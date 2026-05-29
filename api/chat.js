// api/chat.js — Groq AI proxy

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { messages, temperature, max_tokens, model, userKeys } = req.body;

    try {
        const data = await callGroq(messages, { temperature, max_tokens, model, userKeys });
        res.status(200).json(data);
    } catch (err) {
        console.error(`API Error (groq):`, err.message);
        res.status(500).json({ error: err.message });
    }
}

let currentKeyIndex = 0;

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

