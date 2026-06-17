/**
 * Certificate Parser — Deterministic OCR + Heuristic Pipeline.
 * 
 * 1. Tesseract.js (browser OCR) extracts text from certificate images
 * 2. pdf.js extracts text from PDF certificates
 * 3. Robust heuristic rules parse title + issuer + date
 */
// NO AI is used here — this is 100% deterministic and instant.
// AI selection of the best 3-5 certs happens later via select-certifications.js
import { extractTextFromPDF as extractFileText } from '../lib/pdf.js';

// ═══════════════════════════════════════
// KNOWN PLATFORMS / ISSUERS
// ═══════════════════════════════════════

/** Sorted longest-first so "Digital Innovation One" matches before "DIO" */
const KNOWN_ISSUERS = [
  // Full names first (longer strings)
  'Digital Innovation One', 'Amazon Web Services', 'LinkedIn Learning',
  'Fundação Bradesco', 'Fundacao Bradesco', 'Escola Virtual Gov',
  'Khan Academy', 'FreeCodeCamp', 'Google Cloud', 'Scrum Alliance',
  'Red Hat', 'EC-Council',
  // Global platforms
  'Coursera', 'Udemy', 'edX', 'Pluralsight', 'Skillshare',
  'Codecademy', 'HackerRank', 'LeetCode', 'Kaggle', 'Datacamp',
  'Domestika', 'MasterClass', 'Brilliant', 'Treehouse',
  // BR platforms
  'Alura', 'DIO', 'Rocketseat', 'Origamid', 'B7Web', 'Balta.io',
  'FIAP', 'SENAI', 'SENAC', 'SEBRAE', 'ENAP', 'Impacta',
  'Descomplica', 'Gran Cursos', 'Estratégia',
  // Cloud / Tech vendors
  'AWS', 'Google', 'Microsoft', 'Azure', 'Oracle', 'IBM', 'Cisco',
  'HashiCorp', 'Terraform', 'VMware', 'Salesforce', 'SAP',
  'MongoDB', 'Databricks', 'Snowflake', 'Atlassian', 'GitHub',
  'Docker', 'Kubernetes', 'Meta', 'Apple', 'Huawei',
  // Certification bodies
  'PMI', 'Scrum.org', 'EXIN', 'AXELOS', 'CertiProf',
  'CompTIA', 'ISC2', '(ISC)²', 'ISACA', 'PeopleCert',
].sort((a, b) => b.length - a.length);

// Markers that precede or label the issuer
const ISSUER_MARKERS = [
  'emitido por', 'emitido pela', 'emitida por', 'emitida pela',
  'issued by', 'oferecido por', 'oferecido pela', 'oferecida por',
  'provided by', 'powered by', 'certificado por', 'certificado pela',
  'certificada por', 'instrutor', 'instructor', 'professor',
  'organizado por', 'organized by', 'promoted by', 'promovido por',
  'ministrado por', 'ministrada por', 'taught by',
];

// Markers that precede or label the title / course
const TITLE_MARKERS = [
  'certificado de conclusão', 'certificate of completion',
  'certificado de participação', 'certificate of participation',
  'certificate of achievement', 'certificado de aprovação',
  'concluiu o curso', 'concluiu com sucesso', 'has completed',
  'has successfully completed', 'completed the course',
  'completou o curso', 'participou do', 'participated in',
  'certificado', 'certificate', 'curso', 'course',
  'formação', 'bootcamp', 'trilha', 'path', 'track',
  'treinamento', 'training', 'programa', 'program',
  'workshop', 'masterclass', 'nanodegree', 'specialization',
  'especialização', 'imersão', 'immersion',
];

// Month names for date detection
const MONTHS_PT = ['janeiro','fevereiro','março','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MONTHS_EN = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTHS_SHORT_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MONTHS_SHORT_EN = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

// Institutional keywords (catch universities/schools not in the fixed list)
const INSTITUTION_KEYWORDS = [
  'universidade', 'university', 'instituto', 'institute',
  'faculdade', 'college', 'escola', 'school', 'academia', 'academy',
  'centro', 'center', 'centre', 'fundação', 'foundation',
  'associação', 'association', 'laboratório', 'lab',
];



// ═══════════════════════════════════════
// DATE DETECTION
// ═══════════════════════════════════════

/**
 * Extract a date from text using multiple regex patterns.
 * Returns the LAST (most likely completion) date found, or ''.
 * @param {string} text
 * @returns {string}
 */
function detectDate(text) {
  if (!text) return '';

  const allMonths = [...MONTHS_PT, ...MONTHS_EN, ...MONTHS_SHORT_PT, ...MONTHS_SHORT_EN].join('|');
  const dates = [];

  // Pattern 1: "Janeiro 2024", "Jan 2024", "January 2024", "jan/2024"
  const monthYear = new RegExp(`\\b(${allMonths})[\\s./\\-,]*(\\d{4})\\b`, 'gi');
  for (const m of text.matchAll(monthYear)) {
    dates.push({ text: m[2], pos: m.index });
  }

  // Pattern 2: "01/2024", "01-2024", "01.2024" (MM/YYYY)
  const mmYYYY = /\b(0[1-9]|1[0-2])[\/\-\.](20\d{2}|19\d{2})\b/g;
  for (const m of text.matchAll(mmYYYY)) {
    dates.push({ text: m[2], pos: m.index });
  }

  // Pattern 3: "01/01/2024", "01-01-2024" (DD/MM/YYYY)
  const ddMMYYYY = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](20\d{2}|19\d{2})\b/g;
  for (const m of text.matchAll(ddMMYYYY)) {
    dates.push({ text: m[3], pos: m.index });
  }

  // Pattern 4: "2024-01-15" (ISO)
  const iso = /\b(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g;
  for (const m of text.matchAll(iso)) {
    dates.push({ text: m[1], pos: m.index });
  }

  // Pattern 5: standalone year "2023", "2024" (only 2015+)
  // Less reliable — only use if no better pattern found
  const standaloneYear = /\b(20[1-9]\d)\b/g;
  const yearMatches = [];
  for (const m of text.matchAll(standaloneYear)) {
    yearMatches.push({ text: m[1], pos: m.index });
  }

  // Return the last precise date found (likely the completion date)
  if (dates.length) {
    return dates[dates.length - 1].text;
  }
  // Fallback to last standalone year
  if (yearMatches.length) {
    return yearMatches[yearMatches.length - 1].text;
  }

  return '';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ═══════════════════════════════════════
// ISSUER DETECTION
// ═══════════════════════════════════════

/**
 * Detect the certificate issuer from text.
 * Uses multiple strategies in priority order.
 * @param {string} text
 * @returns {string}
 */
function detectIssuer(text) {
  if (!text) return '';
  const lower = text.toLowerCase();

  // Strategy 1: Explicit markers like "emitido por: Coursera"
  for (const marker of ISSUER_MARKERS) {
    const idx = lower.indexOf(marker);
    if (idx !== -1) {
      const after = text.substring(idx + marker.length).replace(/^[\s:—\-–]+/, '');
      const line = after.split(/[\n\r]/)[0].trim().substring(0, 100);
      // Clean trailing punctuation and IDs
      const cleaned = line.replace(/[.!,;]+$/, '').trim();
      if (cleaned.length > 1) return cleaned;
    }
  }

  // Strategy 2: Match known issuers (already sorted longest-first)
  for (const issuer of KNOWN_ISSUERS) {
    const issuerLower = issuer.toLowerCase();
    // Word-boundary-ish check to avoid false positives (e.g. "DIO" inside "ESTÚDIO")
    const idx = lower.indexOf(issuerLower);
    if (idx !== -1) {
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + issuerLower.length < lower.length ? lower[idx + issuerLower.length] : ' ';
      const isBoundary = /[\s,.;:!?/()\-–—]/.test(before) || idx === 0;
      const isEndBoundary = /[\s,.;:!?/()\-–—]/.test(after) || (idx + issuerLower.length) === lower.length;
      if (isBoundary && isEndBoundary) {
        // Return with original casing from our list
        return issuer;
      }
    }
  }

  // Strategy 3: Extract from URLs (e.g. "coursera.org", "udemy.com")
  const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\.(com|org|io|dev|net|edu|com\.br|org\.br)/i);
  if (urlMatch) {
    const domain = urlMatch[1];
    // Check if domain matches a known issuer
    for (const issuer of KNOWN_ISSUERS) {
      if (issuer.toLowerCase().replace(/[\s.]/g, '') === domain.toLowerCase()) {
        return issuer;
      }
    }
    // Use capitalized domain as issuer
    if (domain.length > 2) {
      return capitalize(domain);
    }
  }

  // Strategy 4: Look for institutional keywords (catches unknown universities etc.)
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 3);
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    for (const kw of INSTITUTION_KEYWORDS) {
      if (lineLower.includes(kw)) {
        // Return the whole line (trimmed) as issuer — it likely says "Universidade Federal de ..."
        const clean = line.substring(0, 100).replace(/[.!,;]+$/, '').trim();
        if (clean.length > 3 && clean.length < 80) return clean;
      }
    }
  }

  return '';
}

// ═══════════════════════════════════════
// TITLE DETECTION
// ═══════════════════════════════════════

/**
 * Extract the certificate title from text.
 * @param {string} text
 * @param {string} fileName
 * @returns {string}
 */
function detectTitle(text, fileName) {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 3);

  if (!lines.length) return cleanFileName(fileName);

  const lower = text.toLowerCase();

  // 1. Look for text after title markers (e.g. "concluiu o curso React Avançado")
  for (const marker of TITLE_MARKERS) {
    const idx = lower.indexOf(marker);
    if (idx !== -1) {
      const afterMarker = text.substring(idx + marker.length).replace(/^[\s:—\-–"']+/, '');
      const sameLine = afterMarker.split(/[\n\r]/)[0].trim();

      if (sameLine.length > 5 && sameLine.length < 120) {
        // Remove trailing punctuation
        return sameLine.replace(/[.!,;:]+$/, '').trim();
      }

      // Check next non-empty line
      const restLines = afterMarker.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 3);
      if (restLines.length > 0 && restLines[0].length < 120) {
        return restLines[0].replace(/[.!,;:]+$/, '').trim();
      }
    }
  }

  // 2. Heuristic: best candidate line (not a date, URL, ID, or boilerplate)
  const skipPatterns = [
    /^https?:\/\//i,
    /^\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}$/,
    /^(id|código|code|credential|credencial|verificar|verify|data|date|hora|time)/i,
    /^(emitido|issued|válido|valid|expir)/i,
    /^(nome|name|email|cpf|rg|endereço|address)/i,
    /certificamos que/i,
    /^[\d\s\-\/.,]+$/,  // Lines that are just numbers/dates
  ];

  const candidates = lines.filter(l =>
    l.length > 5 &&
    l.length < 120 &&
    !skipPatterns.some(p => p.test(l))
  );

  if (candidates.length) {
    // Score candidates: prefer 10-80 char lines, penalize very short/long
    const scored = candidates.map(l => ({
      text: l,
      score: (l.length >= 10 && l.length <= 80 ? 10 : 0) +
             (l.length >= 15 && l.length <= 60 ? 5 : 0) +
             (/[A-ZÀ-Ú]/.test(l[0]) ? 3 : 0) +  // Starts with uppercase
             (lines.indexOf(l) < 5 ? 2 : 0),      // Early in text
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].text;
  }

  return cleanFileName(fileName);
}

/**
 * Clean a filename into a readable title.
 */
function cleanFileName(name) {
  return name
    .replace(/\.[^.]+$/, '')                            // remove extension
    .replace(/certificado[_\s-]*(de[_\s-]*)?/gi, '')    // remove "Certificado de"
    .replace(/[_\-]+/g, ' ')                            // underscores/hyphens to spaces
    .replace(/\s+/g, ' ')                               // collapse whitespace
    .trim() || name;
}

/**
 * Try to detect an issuer from just the file name.
 */
function detectIssuerFromFileName(fileName) {
  const lower = fileName.toLowerCase();
  for (const issuer of KNOWN_ISSUERS) {
    if (lower.includes(issuer.toLowerCase())) {
      return issuer;
    }
  }
  return '';
}

// ═══════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════

/**
 * Parse multiple certificate files using OCR + deterministic heuristics.
 * Returns structured data with title, issuer and date — NO AI involved.
 *
 * @param {File[]} files - Certificate files (images or PDFs)
 * @param {function} [onProgress] - (current, total, fileName) => void
 * @returns {Promise<Array<{title: string, issuer: string, date: string}>>}
 */
export async function parseCertificateFiles(files, onProgress) {
  if (!files?.length) return [];

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) onProgress(i + 1, files.length, file.name);

    let text = '';
    try {
      text = await extractFileText(file);
    } catch (err) {
      console.warn(`Extraction failed for ${file.name}:`, err.message);
    }

    const title = detectTitle(text, file.name);
    const issuer = detectIssuer(text) || detectIssuerFromFileName(file.name);
    const date = detectDate(text);

    results.push({ title, issuer, date, _expanded: false });
  }

  return results;
}

/**
 * Tesseract is no longer used, keep dummy for compatibility.
 */
export async function terminateOCR() {
  // no-op
}
