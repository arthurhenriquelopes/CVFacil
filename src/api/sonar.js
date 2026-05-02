const API_URL = '/api/chat';

/**
 * Send a chat completion request.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.2]
 * @param {number} [opts.maxTokens=4096]
 * @param {string} [opts.model] - Override default model
 * @returns {Promise<string>} The assistant's response content
 */
export async function chatCompletion(messages, {
    temperature = 0.2,
    maxTokens = 4096,
    model,
} = {}) {
    const maxAttempts = 2;
    let attempt = 0;

    while (attempt < maxAttempts) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    model,
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
