/**
 * ATS Job Analysis — Hybrid Engine.
 * Phase 1 (Algorithmic): keyword extraction, matching, scoring.
 * Phase 2 (AI, optional): narrative summary + actionable tips.
 */
import { chatCompletion } from '../api/sonar.js';
import { calculateATSScore } from '../lib/ats-scorer.js';

/**
 * Analyze a job description against the user's profile.
 * Uses deterministic scoring first, then optionally enriches with AI.
 *
 * @param {object} profile - User profile from store
 * @param {string} jobDescription - Raw job description text
 * @param {object} [options]
 * @param {boolean} [options.skipAI=false] - If true, return only algorithmic results
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeJob(profile, jobDescription, { skipAI = false } = {}) {
  // ═══════════════════════════════════════
  // PHASE 1: Deterministic Analysis (instant, free)
  // ═══════════════════════════════════════
  const result = calculateATSScore(profile, jobDescription);

  if (skipAI) return result;

  // ═══════════════════════════════════════
  // PHASE 2: AI Enrichment (summary + tips only)
  // ═══════════════════════════════════════
  try {
    const aiEnrichment = await enrichWithAI(profile, jobDescription, result);

    // Merge AI narratives into the algorithmic result
    if (aiEnrichment) {
      if (aiEnrichment.summary) result.ats.summary = aiEnrichment.summary;
      if (aiEnrichment.tips?.length) result.ats.tips = aiEnrichment.tips;
      if (aiEnrichment.strengths?.length) result.ats.strengths = aiEnrichment.strengths;
    }
  } catch (err) {
    // AI enrichment failed — no problem, algorithmic result is still complete
    console.warn('AI enrichment failed, using algorithmic results only:', err.message);
  }

  return result;
}

/**
 * Call the AI only for narrative content generation.
 * The AI receives the pre-computed data and writes human-readable text.
 */
async function enrichWithAI(profile, jobDescription, algorithmicResult) {
  const { ats } = algorithmicResult;
  const profileName = profile.name || 'O candidato';

  const systemPrompt = `Você é um consultor de carreira. Receberá dados pré-calculados de uma análise ATS e deve gerar apenas TEXTO NARRATIVO.

REGRAS:
- Responda SOMENTE em JSON válido.
- NÃO recalcule scores ou keywords — use os dados fornecidos.
- Gere textos concisos, profissionais e acionáveis.
- Máximo 3 frases no summary.
- Máximo 5 tips.

FORMATO:
{
  "summary": "Texto narrativo de 2-3 frases analisando o perfil do candidato em relação à vaga",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "tips": [
    { "text": "Dica concreta e acionável", "impact": "alto|medio" }
  ]
}`;

  const userMessage = `CANDIDATO: ${profileName}
SCORE: ${ats.score}/100 (${ats.classification})
KEYWORDS MATCHED: ${ats.matchedKeywords.join(', ')}
KEYWORDS FALTANTES: ${ats.missingKeywords.join(', ')}
GAPS CRÍTICOS: ${ats.criticalGaps.join('; ')}
BREAKDOWN: Hard Skills ${ats.breakdown.hardSkills.score}/${ats.breakdown.hardSkills.max}, Experience ${ats.breakdown.experience.score}/${ats.breakdown.experience.max}

Gere o summary, strengths e tips narrativos em JSON.`;

  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ], { temperature: 0.3, maxTokens: 1024, provider: 'groq', model: 'llama-3.3-70b-versatile' });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
