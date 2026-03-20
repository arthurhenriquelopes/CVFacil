/**
 * ATS Job Analysis Prompt.
 * Extracts keywords, calculates compatibility, and identifies highlights.
 */
import { chatCompletion } from '../api/sonar.js';

/**
 * Analyze a job description against the user's profile.
 * @param {object} profile - User profile from store
 * @param {string} jobDescription - Raw job description text
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeJob(profile, jobDescription) {
    const profileSummary = buildProfileSummary(profile);

    const systemPrompt = `Você é um especialista em análise ATS (Applicant Tracking System) e recrutamento.
Sua tarefa é analisar uma descrição de vaga e compará-la com o perfil de um candidato.

REGRAS:
- Responda SOMENTE em JSON válido, sem markdown, sem explicações extras.
- Identifique todas as palavras-chave técnicas e comportamentais da vaga.
- Compare cada palavra-chave com as habilidades, experiências e formação do candidato.
- Calcule um percentual de compatibilidade real baseado no match das keywords.
- Identifique experiências do candidato que podem ser destacadas para esta vaga.
- Sugira melhorias concretas no currículo para aumentar o score ATS.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "keywords": ["palavra1", "palavra2", "..."],
  "matchPercentage": 73,
  "highlightableExperiences": [
    { "title": "Nome do cargo", "reason": "Motivo para destacar" }
  ],
  "suggestions": [
    "Sugestão concreta 1"
  ],
  "ats": {
    "score": 33,
    "classification": "Reprovado automaticamente pelo ATS",
    "risk": "ALTO", 
    "summary": "O candidato possui experiência limitada... há um desalinhamento...",
    "breakdown": {
       "hardSkills": { "score": 15, "max": 40 },
       "experience": { "score": 5, "max": 30 },
       "keywords": { "score": 8, "max": 20 },
       "education": { "score": 5, "max": 10 }
    },
    "criticalGaps": [
       "Ausência de experiência com Node.js e TypeScript (requisitos obrigatórios)"
    ],
    "missingKeywords": ["Node.js", "TypeScript", "AWS"],
    "matchedKeywords": ["Docker", "PostgreSQL"],
    "strengths": [
       "Experiência documentada com Docker e PostgreSQL"
    ],
    "tips": [
       { "text": "Adicionar experiência prática com Node.js...", "impact": "alto" },
       { "text": "Mencionar explicitamente a aplicação dos princípios...", "impact": "medio" }
    ]
  }
}`;

    const userMessage = `PERFIL DO CANDIDATO:
${profileSummary}

DESCRIÇÃO DA VAGA:
${jobDescription}

Analise rigorosamente e retorne APENAS o JSON com a análise ATS completa.`;

    const response = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
    ]);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('A resposta da IA não contém um JSON válido.');
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error('Failed to parse analysis response:', response);
        throw new Error('Erro ao processar análise da vaga: ' + e.message);
    }
}

function buildProfileSummary(profile) {
    const parts = [];
    if (profile.name) parts.push(`Nome: ${profile.name}`);
    if (profile.summary) parts.push(`Resumo: ${profile.summary}`);

    if (profile.experiences?.length) {
        parts.push('Experiências:');
        profile.experiences.forEach(exp => {
            parts.push(`  - ${exp.title} em ${exp.company} (${exp.period}): ${exp.description || ''}`);
        });
    }

    if (profile.education?.length) {
        parts.push('Formação:');
        profile.education.forEach(edu => {
            parts.push(`  - ${edu.degree} em ${edu.institution} (${edu.period})`);
        });
    }

    if (profile.skills?.length) {
        parts.push(`Habilidades: ${profile.skills.join(', ')}`);
    }

    if (profile.languages?.length) {
        parts.push('Idiomas:');
        profile.languages.forEach(lang => {
            parts.push(`  - ${lang.name}: ${lang.level}`);
        });
    }

    if (profile.certifications?.length) {
        parts.push('Certificações:');
        profile.certifications.forEach(cert => {
            parts.push(`  - ${cert.name} (${cert.institution})`);
        });
    }

    return parts.join('\n');
}
