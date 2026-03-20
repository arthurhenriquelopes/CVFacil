const API_URL = '/api/chat';
const MODEL = 'sonar';

/**
 * Send a chat completion request to Perplexity Sonar.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.2]
 * @param {number} [opts.maxTokens=4096]
 * @returns {Promise<string>} The assistant's response content
 */
export async function chatCompletion(messages, { temperature = 0.2, maxTokens = 4096 } = {}) {
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    temperature,
                    max_tokens: maxTokens
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    throw new Error(`Erro na API Perplexity (${response.status}): ${errText}`);
                }
                throw new Error(`Fallback HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content ?? '';
        } catch (error) {
            if (attempt >= maxAttempts - 1 || error.message.includes('Erro na API Perplexity')) {
                throw error;
            }
            const delay = 1000 * Math.pow(2, attempt);
            await new Promise(res => setTimeout(res, delay));
            attempt++;
        }
    }
}
