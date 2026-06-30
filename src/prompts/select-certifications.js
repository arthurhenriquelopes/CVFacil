/**
 * Certificate Selector Agent.
 * 
 * Receives ALL user certifications and selects the 3-5 most relevant
 * for the target role/job description. Uses AI to read certificate names
 * and make strategic selections — no OCR, just name-based intelligence.
 */
import { chatCompletion } from '../api/sonar.js';

const CERT_SELECTOR_PERSONA = `Você é um especialista em recrutamento e curadoria de certificações profissionais. Sua única tarefa é selecionar as 5 a 12 certificações MAIS RELEVANTES de uma lista completa de certificados do candidato, considerando:

1. O OBJETIVO PROFISSIONAL do candidato
2. O CARGO ALVO (se informado)
3. A DESCRIÇÃO DA VAGA (se informada)

Regras obrigatórias:

1. Selecione TODAS as certificações que agreguem algum valor ao objetivo do candidato, descartando apenas as totalmente irrelevantes. Não há limite máximo de quantidade.
2. Priorize certificações que:
   - Têm relação DIRETA com a vaga/objetivo (ex: AWS para vaga de Cloud Engineer)
   - São reconhecidas pelo mercado (ex: PMP, Scrum Master, AWS, Azure, Google Cloud)
   - Demonstram atualização tecnológica recente
   - Complementam lacunas identificadas no perfil
3. DESCARTE certificações que:
   - São muito genéricas ou de baixo valor de mercado
   - São de áreas completamente diferentes do objetivo
   - São muito antigas e sem relevância atual
4. Para cada certificação selecionada, explique em UMA frase curta por que ela é relevante.
5. NÃO invente certificações. Selecione SOMENTE da lista fornecida.
6. Responda no mesmo idioma do objetivo profissional.

RESPONDA EXCLUSIVAMENTE em JSON válido com o seguinte schema:
{
  "selected": [
    {
      "index": 0,
      "title": "Nome exato da certificação",
      "issuer": "Instituição emissora",
      "reason": "Frase curta explicando relevância para a vaga"
    }
  ],
  "dropped": [
    {
      "index": 2,
      "title": "Nome da certificação descartada",
      "reason": "Frase curta explicando por que foi descartada"
    }
  ]
}`;

/**
 * Select the best 3-5 certifications for the target role.
 * 
 * @param {object} params
 * @param {Array} params.certifications - All user certifications [{title, issuer, date}]
 * @param {string} params.professionalGoal - Professional objective
 * @param {string} [params.targetRole] - Target role
 * @param {string} [params.jobDescription] - Job description
 * @returns {Promise<{selected: Array, dropped: Array}>}
 */
export async function selectBestCertifications({ certifications, professionalGoal, targetRole, jobDescription }) {
  // We no longer strictly skip if <= 12. But if there are very few (e.g. <= 3), no point in filtering.
  if (!certifications || certifications.length <= 3) {
    return {
      selected: (certifications || []).map((c, i) => ({
        index: i,
        title: c.title || c.name || '',
        issuer: c.issuer || c.institution || '',
        reason: 'Incluída automaticamente'
      })),
      dropped: [],
      filtered: certifications || [],
    };
  }

  const certList = certifications.map((c, i) => 
    `[${i}] ${c.title || c.name || 'Sem nome'} — Emissora: ${c.issuer || c.institution || 'N/A'}`
  ).join('\n');

  const userMessage = `LISTA COMPLETA DE CERTIFICAÇÕES DO CANDIDATO (${certifications.length} total):
---
${certList}
---

OBJETIVO PROFISSIONAL: ${professionalGoal}
${targetRole ? `CARGO ALVO: ${targetRole}` : ''}
${jobDescription ? `\nDESCRIÇÃO DA VAGA:\n${jobDescription}` : ''}

Selecione todas as certificações estratégicas e relevantes para este objetivo, descartando apenas as inúteis. Responda SOMENTE em JSON válido.`;

  const response = await chatCompletion([
    { role: 'system', content: CERT_SELECTOR_PERSONA },
    { role: 'user', content: userMessage },
  ], {
    temperature: 0.2,
    maxTokens: 1024,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
  });

  const result = parseJson(response);
  
  // Build filtered array from selected indices
  const selectedIndices = new Set((result.selected || []).map(s => s.index));
  result.filtered = certifications.filter((_, i) => selectedIndices.has(i));
  
  return result;
}

/**
 * Parse JSON with fallback strategies.
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
  return { selected: [], dropped: [] };
}
