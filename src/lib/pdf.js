/**
 * Extracts raw text from a File object by sending it to the Tika extraction API.
 * 
 * @param {File} file - The file to extract text from (PDF, Word, Images, etc)
 * @returns {Promise<string>} The extracted text
 */
export async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    
    const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
            'Content-Type': file.type || 'application/octet-stream',
        },
        body: arrayBuffer
    });

    if (!response.ok) {
        let errMessage = response.statusText;
        try {
            const errData = await response.json();
            if (errData.error) errMessage = errData.error;
        } catch (e) {}
        throw new Error(`Erro na extração: ${errMessage}`);
    }

    const data = await response.json();
    return data.text || '';
}
