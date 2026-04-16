/**
 * Certificate Name Parser Agent.
 * 
 * Reads FILE NAMES of uploaded certificates (no OCR, no content reading)
 * and extracts structured data: title, issuer, date.
 * 
 * Example: "AWS Solutions Architect - Amazon Web Services 2024.pdf"
 *  → { title: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2024" }
 */
import { chatCompletion } from '../api/sonar.js';

const CERT_PARSER_PERSONA = `Você é um parser especializado em extrair informações de NOMES DE ARQUIVO de certificados profissionais. Sua tarefa é analisar uma lista de nomes de arquivo e extrair para cada um:

- title: O nome da certificação/curso
- issuer: A instituição emissora (se identificável no nome do arquivo)
- date: A data (se identificável no nome do arquivo)

Regras:
1. Analise SOMENTE o nome do arquivo fornecido. Não invente informações que não estejam no nome.
2. Remova extensões de arquivo (.pdf, .jpg, .png, .jpeg, .webp, etc.)
3. Interprete separadores comuns: hífens, underscores, pontos, parênteses como delimitadores lógicos.
4. Se não conseguir identificar issuer ou date, retorne string vazia "".
5. Tente identificar abreviações conhecidas:
   - "AWS" → Amazon Web Services
   - "GCP" → Google Cloud Platform
   - "AZ" ou "Azure" → Microsoft Azure
   - "SCRUM", "PSM", "PSPO" → Scrum.org
   - "PMP", "CAPM" → PMI
   - "CKA", "CKAD" → CNCF / Linux Foundation
   - "OCA", "OCP" → Oracle
6. Se o nome contiver números de 4 dígitos (ex: 2023, 2024), interprete como ano.
7. Se contiver padrões como "01-2024" ou "Jan2024", interprete como data.
8. Responda no idioma predominante dos nomes de arquivo.
9. Priorize extrair o título mais limpo possível, sem lixo de formatação.

RESPONDA EXCLUSIVAMENTE em JSON válido:
{
  "certificates": [
    {
      "originalFileName": "nome_original.pdf",
      "title": "Nome Limpo da Certificação",
      "issuer": "Instituição Emissora",
      "date": "2024"
    }
  ]
}`;

/**
 * Parse certificate file names into structured data.
 * 
 * @param {string[]} fileNames - Array of file names (with extensions)
 * @returns {Promise<Array<{title: string, issuer: string, date: string}>>}
 */
export async function parseCertificateNames(fileNames) {
  if (!fileNames?.length) return [];

  // For very simple/short lists, try local heuristic first
  if (fileNames.length <= 2 && fileNames.every(f => f.split(/[-_.\s]/).length <= 3)) {
    return fileNames.map(f => heuristicParse(f));
  }

  const fileList = fileNames.map((f, i) => `[${i}] ${f}`).join('\n');

  const response = await chatCompletion([
    { role: 'system', content: CERT_PARSER_PERSONA },
    { role: 'user', content: `Extraia as informações dos seguintes nomes de arquivo de certificados:\n\n${fileList}\n\nResponda SOMENTE em JSON válido.` },
  ], {
    temperature: 0.1,
    maxTokens: 1024,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  });

  const result = parseJson(response);
  return (result.certificates || []).map(c => ({
    title: c.title || '',
    issuer: c.issuer || '',
    date: c.date || '',
    _expanded: false,
  }));
}

/**
 * Simple heuristic fallback for trivial file names.
 */
function heuristicParse(fileName) {
  // Remove extension
  const name = fileName.replace(/\.(pdf|jpg|jpeg|png|webp|gif|bmp|tiff?)$/i, '');
  // Replace common separators with spaces
  const clean = name.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Try to extract year
  const yearMatch = clean.match(/\b(20\d{2})\b/);
  const date = yearMatch ? yearMatch[1] : '';
  const titleWithoutDate = clean.replace(/\b20\d{2}\b/, '').trim();

  return {
    title: titleWithoutDate || clean,
    issuer: '',
    date,
    _expanded: false,
  };
}

/**
 * Parse JSON with fallback.
 */
function parseJson(text) {
  try { return JSON.parse(text); } catch { /* continue */ }
  const fence = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* continue */ } }
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) {
    try { return JSON.parse(brace[0]); } catch { /* continue */ }
    try {
      return JSON.parse(brace[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
    } catch { /* continue */ }
  }
  return { certificates: [] };
}
