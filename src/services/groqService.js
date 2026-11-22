// Multi-Key Groq API Rotation Service (Llama 3.3 70B Versatile & Llama 3.2 11B Vision)
// Automatically falls back and rotates through all provided Groq keys upon rate limits (429) or quota errors.

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');

class GroqKeyManager {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.loadKeys();
  }

  loadKeys() {
    const rawKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
    this.keys = rawKeys
      .split(',')
      .map(k => k.trim())
      .filter(k => k.startsWith('gsk_'));
    
    console.log(`⚡ Groq Key Manager initialized with ${this.keys.length} API keys for multi-rotation.`);
  }

  getCurrentKey() {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex % this.keys.length];
  }

  rotateKey() {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`🔄 Groq Rate-Limit! Switched to Key #${this.currentIndex + 1}`);
    return this.getCurrentKey();
  }

  // Call Groq Chat Completion with auto-retry across all keys
  async chatCompletion(messages, model = 'openai/gpt-oss-120b', temperature = 0.7) {
    let attempts = 0;
    const maxAttempts = this.keys.length * 2;

    while (attempts < maxAttempts) {
      const apiKey = this.getCurrentKey();
      try {
        const result = await this._makeRequest(apiKey, {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: 1500
        });
        return result;
      } catch (err) {
        attempts++;
        console.warn(`⚠️ Groq Key #${this.currentIndex + 1} failed: ${err.message}. Rotating...`);
        this.rotateKey();
        if (attempts >= maxAttempts) {
          throw new Error(`Alle Groq API Keys erschöpft: ${err.message}`);
        }
      }
    }
  }

  // Vision Analysis with Llama 3.2 11B Vision
  async visionAnalysis(imageBase64, promptText) {
    let attempts = 0;
    const maxAttempts = this.keys.length * 2;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${cleanBase64}`;

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ];

    while (attempts < maxAttempts) {
      const apiKey = this.getCurrentKey();
      try {
        const result = await this._makeRequest(apiKey, {
          model: 'llama-3.2-11b-vision-preview',
          messages: messages,
          temperature: 0.2,
          max_tokens: 1200
        });
        return result;
      } catch (err) {
        attempts++;
        console.warn(`⚠️ Groq Vision Key #${this.currentIndex + 1} failed: ${err.message}. Rotating...`);
        this.rotateKey();
        if (attempts >= maxAttempts) {
          throw new Error(`Alle Groq Vision Keys erschöpft: ${err.message}`);
        }
      }
    }
  }

  _makeRequest(apiKey, payloadObj) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(payloadObj);
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 25000
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const text = json.choices?.[0]?.message?.content || '';
              resolve(text);
            } else {
              reject(new Error(json.error?.message || `Groq HTTP ${res.statusCode}: ${body}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Groq request timed out'));
      });
      req.write(payload);
      req.end();
    });
  }
}

const groqManager = new GroqKeyManager();
module.exports = groqManager;
