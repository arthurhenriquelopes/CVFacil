// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { messages, temperature, max_tokens } = req.body;
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'sonar', messages, temperature, max_tokens }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
}
