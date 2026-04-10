// api/chat.js — Multi-provider AI proxy
// Routes requests to Groq or Gemini based on the 'provider' field

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { messages, temperature, max_tokens, provider, model } = req.body;

    try {
        let data;

        if (provider === 'gemini') {
            data = await callGemini(messages, { temperature, max_tokens, model });
        } else {
            // Default: Groq
            data = await callGroq(messages, { temperature, max_tokens, model });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error(`API Error (${provider || 'groq'}):`, err.message);
        res.status(500).json({ error: err.message });
    }
}

// ─── Groq (OpenAI-compatible) ───────────────────────
async function callGroq(messages, { temperature = 0.2, max_tokens = 4096, model = 'llama-3.3-70b-versatile' } = {}) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq ${response.status}: ${errText}`);
    }

    return await response.json();
}

// ─── Gemini (Google AI Studio) ──────────────────────
async function callGemini(messages, { temperature = 0.4, max_tokens = 4096, model = 'gemini-2.5-flash' } = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Convert OpenAI-style messages to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');

    const contents = userMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            contents,
            generationConfig: {
                temperature,
                maxOutputTokens: max_tokens,
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini ${response.status}: ${errText}`);
    }

    const geminiData = await response.json();

    // Convert Gemini response to OpenAI-compatible format
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
        choices: [{
            message: { role: 'assistant', content: text },
            finish_reason: 'stop',
        }],
    };
}
