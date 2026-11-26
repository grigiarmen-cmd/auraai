const crypto = require('crypto');
const https = require('https');

require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN || '';
const ACCOUNTS_DB_ID = process.env.AURA_ACCOUNTS_DB_ID || '4206c80d-4897-81b6-822a-c37ff0d1ce3a';

function hashPasswordLegacy(password) {
  return crypto.createHash('sha256').update(password + '_aura_salt_2026').digest('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith('scrypt:')) {
    const [, salt, key] = storedHash.split(':');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
  }
  return storedHash === hashPasswordLegacy(password);
}

// Split long JSON across Notion rich_text blocks (max 1900 chars per block) so nothing is ever truncated
function toNotionRichTextChunks(str) {
  const chunks = [];
  for (let i = 0; i < str.length; i += 1900) {
    chunks.push({ text: { content: str.slice(i, i + 1900) } });
  }
  return chunks.length > 0 ? chunks : [{ text: { content: '{}' } }];
}

function notionRequest(path, method, payload) {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : null;
    const req = https.request({
      hostname: 'api.notion.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(json.message || `Notion error ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Find user account in Notion database
async function getAccountByEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const query = {
    filter: {
      property: 'Email',
      title: {
        equals: cleanEmail
      }
    }
  };

  const res = await notionRequest(`/v1/databases/${ACCOUNTS_DB_ID}/query`, 'POST', query);
  const page = res.results?.[0];
  if (!page) return null;

  const passwordHash = (page.properties?.PasswordHash?.rich_text || []).map(t => t.plain_text).join('') || '';
  const profileJsonStr = (page.properties?.ProfileJSON?.rich_text || []).map(t => t.plain_text).join('') || '{}';
  let profile = {};
  try { profile = JSON.parse(profileJsonStr); } catch(e) {}

  return {
    pageId: page.id,
    email: cleanEmail,
    passwordHash,
    profile
  };
}

// Register or update user account in Notion database
async function saveAccount(email, password, profile, { allowOverwrite = false } = {}) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const profileJsonStr = JSON.stringify(profile || {});
  const richTextChunks = toNotionRichTextChunks(profileJsonStr);

  const existing = await getAccountByEmail(cleanEmail);

  if (existing) {
    if (!allowOverwrite) {
      throw new Error('Ein Account mit dieser E-Mail existiert bereits. Bitte melde dich an.');
    }
    const properties = {
      ProfileJSON: { rich_text: richTextChunks },
      UpdatedAt: { date: { start: new Date().toISOString() } }
    };
    if (password) {
      properties.PasswordHash = { rich_text: [{ text: { content: hashPassword(password) } }] };
    }
    await notionRequest(`/v1/pages/${existing.pageId}`, 'PATCH', { properties });
    return { email: cleanEmail, profile };
  } else {
    if (!password) {
      throw new Error('Passwort erforderlich für neuen Account.');
    }
    const createPayload = {
      parent: { database_id: ACCOUNTS_DB_ID },
      properties: {
        Email: { title: [{ text: { content: cleanEmail } }] },
        PasswordHash: { rich_text: [{ text: { content: hashPassword(password) } }] },
        ProfileJSON: { rich_text: richTextChunks },
        UpdatedAt: { date: { start: new Date().toISOString() } }
      }
    };
    await notionRequest('/v1/pages', 'POST', createPayload);
    return { email: cleanEmail, profile };
  }
}

// Authenticate via Email + Password
async function authenticateUser(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const account = await getAccountByEmail(cleanEmail);

  if (!account) {
    throw new Error('Kein Account mit dieser E-Mail gefunden. Bitte erstelle zuerst dein Profil.');
  }

  if (!verifyPassword(password, account.passwordHash)) {
    throw new Error('Falsches Passwort.');
  }

  return account.profile || {};
}

module.exports = {
  getAccountByEmail,
  saveAccount,
  authenticateUser,
  hashPassword
};
