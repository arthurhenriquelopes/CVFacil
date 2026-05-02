export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const tikaUrl = process.env.TIKA_URL || 'http://localhost:9998/tika';
    
    try {
        const response = await fetch(tikaUrl, {
            method: 'PUT',
            headers: {
                'Accept': 'text/plain',
                'Content-Type': req.headers['content-type'] || 'application/octet-stream',
            },
            body: req.body // the raw buffer
        });

        if (!response.ok) {
            throw new Error(`Tika error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        res.status(200).json({ text });
    } catch (err) {
        console.error('Tika Extraction Error:', err);
        res.status(500).json({ error: err.message });
    }
}
