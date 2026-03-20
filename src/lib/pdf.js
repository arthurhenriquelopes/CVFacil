import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extracts raw text from a PDF File object.
 * @param {File} file - The PDF file from an input element
 * @returns {Promise<string>} The extracted text
 */
export async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const sorted = content.items
            .slice()
            .sort((a, b) => {
                const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
                return yDiff !== 0 ? yDiff : a.transform[4] - b.transform[4];
            });
        fullText += sorted.map(item => item.str).join(' ') + '\n';
    }

    return fullText;
}
