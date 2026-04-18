import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Polyfill: Uint8Array.toHex / fromHex — required by pdfjs-dist >=5.5
// These are TC39 Stage-4 but only ship in Chromium 140+.
// Safe here because toHex is only called at runtime (inside getDocument),
// not during module initialization, so this code runs before any usage.
if (!Uint8Array.prototype.toHex) {
    Uint8Array.prototype.toHex = function () {
        return Array.from(this)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };
}
if (!Uint8Array.fromHex) {
    Uint8Array.fromHex = function (hexString) {
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
            bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
        }
        return bytes;
    };
}

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
