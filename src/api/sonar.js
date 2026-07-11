import { getApiKeys, getAiProvider, getSelectedModel } from '../lib/settings.js';

const API_URL = '/api/chat';

/**
 * Get the default model for a given provider.
 */
function getDefaultModel(provider) {
    switch (provider) {
        case 'openrouter': return 'google/gemini-2.5-flash-preview-05-20:free';
        case 'groq': return 'llama-3.3-70b-versatile';
        case 'cerebras': return 'gpt-oss-120b';
        case 'nvidia': return getSelectedModel('nvidia') || 'meta/llama-3.3-70b-instruct';
        default: return 'gemini-2.5-flash';
    }
}

/**
 * Send a chat completion request.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.2]
 * @param {number} [opts.maxTokens=4096]
 * @param {string} [opts.model] - Override default model
 * @param {string} [opts.provider] - AI provider selection
 * @returns {Promise<string>} The assistant's response content
 */
export async function chatCompletion(messages, {
    temperature = 0.2,
    maxTokens = 4096,
    model,
    provider,
} = {}) {
    const maxAttempts = 2;
    let attempt = 0;

    const selectedProvider = provider || getAiProvider();

    while (attempt < maxAttempts) {
        try {
            const userKeys = getApiKeys(selectedProvider);
            const finalProvider = selectedProvider;
            const finalModel = model || getDefaultModel(finalProvider);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    model: finalModel,
                    provider: finalProvider,
                    ...(userKeys.length > 0 ? { userKeys } : {}),
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content ?? '';
        } catch (error) {
            if (attempt >= maxAttempts - 1) throw error;
            const delay = 1000 * Math.pow(2, attempt);
            await new Promise(res => setTimeout(res, delay));
            attempt++;
        }
    }
}
