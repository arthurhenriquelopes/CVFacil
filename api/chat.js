// api/chat.js — Groq / OpenAI AI proxy

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { messages, temperature, max_tokens, model, userKeys, provider } = req.body;

    try {
        let data;
        if (provider === 'openai' || (model && model.startsWith('gpt-'))) {
            data = await callOpenAI(messages, { temperature, max_tokens, model });
        } else {
            data = await callGroq(messages, { temperature, max_tokens, model, userKeys });
        }
        res.status(200).json(data);
    } catch (err) {
        console.error(`API Error:`, err.message);
        res.status(500).json({ error: err.message });
    }
}

let currentKeyIndex = 0;
let currentOpenAIKeyIndex = 0;

// ─── OpenAI Key Rotation ───────────────────────────
async function callOpenAI(messages, { temperature = 0.2, max_tokens = 4096, model = 'gpt-4o' } = {}) {
    const keys = [
        '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',
        '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'
    ];

    let lastError = null;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[currentOpenAIKeyIndex % keys.length];
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || 'gpt-4o',
                messages,
                temperature,
                max_tokens,
            }),
        });

        if (response.ok) {
            return await response.json();
        }

        const errText = await response.text();
        lastError = new Error(`OpenAI ${response.status}: ${errText}`);
        
        if (response.status === 429 || response.status === 401) {
            console.warn(`OpenAI Key ${currentOpenAIKeyIndex % keys.length} failed with ${response.status}. Rotating...`);
            currentOpenAIKeyIndex++;
            continue;
        }

        throw lastError;
    }

    throw new Error(`Todas as chaves OpenAI falharam. Último erro: ${lastError.message}`);
}

// ─── Groq (OpenAI-compatible) ───────────────────────
async function callGroq(messages, { temperature = 0.2, max_tokens = 4096, model = 'llama-3.3-70b-versatile', userKeys } = {}) {
    // Prefer user-provided keys, then fall back to server env keys
    const envKeys = (process.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    const clientKeys = Array.isArray(userKeys) ? userKeys.filter(Boolean) : [];
    const keys = [...clientKeys, ...envKeys];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave Groq configurada. Adicione sua chave nas Configurações (⚙️).");
    }

    let lastError = null;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[currentKeyIndex % keys.length];
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens,
            }),
        });

        if (response.ok) {
            return await response.json();
        }

        const errText = await response.text();
        lastError = new Error(`Groq ${response.status}: ${errText}`);
        
        // If Rate Limit (429) or Unauthorized (401), try the next key
        if (response.status === 429 || response.status === 401) {
            console.warn(`Key ${currentKeyIndex % keys.length} failed with ${response.status}. Rotating to next key...`);
            currentKeyIndex++;
            continue;
        }

        // For other errors (e.g. 400 Bad Request), don't retry, just throw
        throw lastError;
    }

    // Se esgotar todas as chaves
    throw new Error(`Todas as chaves Groq falharam. Último erro: ${lastError.message}`);
}

