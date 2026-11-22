const crypto = require('crypto');
const https = require('https');

require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN || '';
const ACCOUNTS_DB_ID = process.env.AURA_ACCOUNTS_DB_ID || '4206c80d-4897-81b6-822a-c37ff0d1ce3a';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_aura_salt_2026').digest('hex');
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

  const passwordHash = page.properties?.PasswordHash?.rich_text?.[0]?.plain_text || '';
  const profileJsonStr = page.properties?.ProfileJSON?.rich_text?.[0]?.plain_text || '{}';
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
async function saveAccount(email, password, profile) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const passwordHash = hashPassword(password);
  const profileJsonStr = JSON.stringify(profile || {});

  const existing = await getAccountByEmail(cleanEmail);

  if (existing) {
    // Update existing page
    const updatePayload = {
      properties: {
        PasswordHash: { rich_text: [{ text: { content: passwordHash } }] },
        ProfileJSON: { rich_text: [{ text: { content: profileJsonStr.slice(0, 1900) } }] },
        UpdatedAt: { date: { start: new Date().toISOString() } }
      }
    };
    await notionRequest(`/v1/pages/${existing.pageId}`, 'PATCH', updatePayload);
    return { email: cleanEmail, profile };
  } else {
    // Create new page
    const createPayload = {
      parent: { database_id: ACCOUNTS_DB_ID },
      properties: {
        Email: { title: [{ text: { content: cleanEmail } }] },
        PasswordHash: { rich_text: [{ text: { content: passwordHash } }] },
        ProfileJSON: { rich_text: [{ text: { content: profileJsonStr.slice(0, 1900) } }] },
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

  const expectedHash = hashPassword(password);
  if (account.passwordHash !== expectedHash) {
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
