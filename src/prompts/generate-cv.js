/**
 * CV Generation Prompt.
 * Generates an ATS-optimized CV using Perplexity Sonar.
 */
import { chatCompletion } from '../api/sonar.js';
import { getGoalStrategyPrompt } from './goal-strategy.js';
import { getFrequencyStrategyPrompt } from './frequency-strategy.js';

/**
 * Build a clean, readable profile summary for the AI (no raw JSON).
 */
function buildProfileSummary(profile) {
  const parts = [];
  if (profile.name) parts.push(`Nome: ${profile.name}`);
  if (profile.email) parts.push(`Email: ${profile.email}`);
  if (profile.phone) parts.push(`Telefone: ${profile.phone}`);
  if (profile.location) parts.push(`Localização: ${profile.location}`);
  if (profile.summary) parts.push(`Resumo atual: ${profile.summary}`);

  if (profile.experiences?.length) {
    parts.push('\nExperiências:');
    profile.experiences.forEach(exp => {
      const period = exp.isCurrent
        ? `${exp.startDate || ''} - Atual`
        : `${exp.startDate || ''} - ${exp.endDate || ''}`;
      parts.push(`  - ${exp.title || 'Cargo'} em ${exp.company || 'Empresa'} (${period})`);
      if (exp.description) parts.push(`    ${exp.description}`);
    });
  }

  if (profile.education?.length) {
    parts.push('\nFormação:');
    profile.education.forEach(edu => {
      const period = `${edu.startDate || ''} - ${edu.endDate || ''}`;
      parts.push(`  - ${edu.degree || 'Curso'} em ${edu.institution || 'Instituição'} (${period})`);
    });
  }

  if (profile.skills?.length) {
    parts.push(`\nHabilidades: ${profile.skills.join(', ')}`);
  }

  if (profile.languages?.length) {
    parts.push('\nIdiomas:');
    profile.languages.forEach(lang => {
      parts.push(`  - ${lang.name || ''}: ${lang.level || ''}`);
    });
  }

  if (profile.projects?.length) {
    parts.push('\nProjetos:');
    profile.projects.forEach(proj => {
      parts.push(`  - ${proj.title || 'Projeto'} (${proj.role || ''}): ${proj.description || ''}`);
    });
  }

  if (profile.certifications?.length) {
    parts.push('\nCertificações:');
    profile.certifications.forEach(cert => {
      parts.push(`  - ${cert.name || cert.title || 'Certificação'} (${cert.issuer || cert.institution || ''})`);
    });
  }

  return parts.join('\n');
}

/**
 * Build focus-specific instructions that structurally change the output.
 */
function buildFocusInstructions(focus) {
  switch (focus) {
    case 'results':
      return `FOCO: RESULTADOS E CONQUISTAS (modo ativado)
REGRAS ESTRUTURAIS PARA ESTE FOCO:
- TODOS os bullet points DEVEM seguir o formato: "• [Verbo de ação] + [o que fez] + [resultado quantificado]"
- CADA bullet OBRIGATORIAMENTE deve conter pelo menos 1 métrica (%, R$, quantidade, prazo, escala)
- Se o candidato não forneceu números, ESTIME métricas razoáveis baseadas no contexto (ex: "equipe de 5+" ou "redução de ~20%")
- O resumo profissional DEVE abrir com a conquista mais impactante
- Priorize experiências que tenham potencial para métricas sobre as puramente descritivas
- No JSON, inclua o campo "resultFormat": true para sinalizar ao renderer`;

    case 'skills':
      return `FOCO: HABILIDADES TÉCNICAS (modo ativado)
REGRAS ESTRUTURAIS PARA ESTE FOCO:
- Reduza os bullets de experiência para MÁXIMO 2 por cargo (apenas os mais relevantes)
- EXPANDA a seção de skills: inclua no mínimo 12-15 skills organizáveis por categoria
- Cada bullet de experiência DEVE mencionar pelo menos 2 skills/ferramentas técnicas
- O resumo profissional DEVE listar as 5 principais competências técnicas em sequência
- Priorize termos técnicos específicos sobre descrições genéricas
- No JSON, inclua o campo "resultFormat": false`;

    case 'experiences':
    default:
      return `FOCO: EXPERIÊNCIAS RELEVANTES (modo padrão)
REGRAS ESTRUTURAIS PARA ESTE FOCO:
- Máximo 4 bullets por experiência, detalhando responsabilidades e impacto
- Conecte cada experiência diretamente com os requisitos da vaga
- Use verbos de ação fortes no início de cada bullet
- O resumo profissional DEVE destacar os anos de experiência e a área principal
- No JSON, inclua o campo "resultFormat": false`;
  }
}

/**
 * Attempt to parse JSON from a response string, with progressively
 * more permissive strategies.
 */
function parseJsonResponse(response) {
  // Strategy 1: Match the outermost { ... }
  const match1 = response.match(/\{[\s\S]*\}/);
  if (match1) {
    try { return JSON.parse(match1[0]); } catch { /* try next */ }
  }

  // Strategy 2: Try to find JSON between markdown code fences
  const match2 = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (match2) {
    try { return JSON.parse(match2[1]); } catch { /* try next */ }
  }

  // Strategy 3: Strip common trailing issues (extra commas, trailing text)
  if (match1) {
    try {
      const cleaned = match1[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(cleaned);
    } catch { /* give up */ }
  }

  return null;
}

/**
 * Generate an optimized CV.
 * @param {object} params
 * @param {object} params.profile - User profile
 * @param {string} params.jobDescription - Job description text
 * @param {string} params.goal - Goal chosen by user
 * @param {string} params.frequency - Frequency chosen by user
 * @param {string} params.focus - 'experiences' | 'skills' | 'results'
 * @param {string} params.template - 'modern' | 'classic'
 * @param {object} params.analysis - Result from analyzeJob
 * @returns {Promise<object>} Generated CV data
 */
export async function generateCV({ profile, jobDescription, goal, frequency, focus, template, analysis }) {

  // Extract keyword intelligence from the analysis
  const allKeywords = analysis?.keywords || [];
  const matchedKeywords = analysis?.ats?.matchedKeywords || analysis?.matchedKeywords || [];
  const missingKeywords = analysis?.ats?.missingKeywords || allKeywords.filter(k =>
    !matchedKeywords.some(m => m.toLowerCase() === k.toLowerCase())
  );
  const matchPct = analysis?.matchPercentage || 0;
  const criticalGaps = analysis?.ats?.criticalGaps || [];
  const tips = analysis?.ats?.tips || [];

  const focusInstructions = buildFocusInstructions(focus);

  const systemPrompt = `Você é um redator profissional de currículos otimizados para ATS (Applicant Tracking System).
Sua tarefa é gerar um currículo completo e otimizado para uma vaga específica.

REGRAS CRÍTICAS PARA ATS:
1. Use EXATAMENTE as palavras-chave da vaga no currículo (não use sinônimos).
2. Coloque as palavras-chave nas primeiras linhas de cada seção.
3. Use formato cronológico reverso nas experiências.
4. Use bullet points simples (•) para listar responsabilidades.
5. Quantifique resultados sempre que possível (%, R$, números).
6. Adapte os títulos dos cargos para match com o que a vaga busca (sem mentir).
7. NÃO use formatação markdown (**, *, #, etc.) em NENHUM campo de texto. O output é renderizado como texto puro em HTML. Escreva texto limpo, sem asteriscos, sem negrito markdown.

INJEÇÃO DE KEYWORDS (REGRA MAIS IMPORTANTE):
Você receberá uma lista de KEYWORDS FALTANTES — são palavras-chave que a vaga exige mas que o candidato NÃO mencionou no perfil original. Você DEVE incorporá-las organicamente nos seguintes locais:

a) RESUMO PROFISSIONAL: Reescreva o resumo incluindo as 3-5 keywords mais importantes da vaga.
   Construa frases que conectem a experiência real do candidato com as keywords.
   Exemplo: Se falta "gestão de projetos" e o candidato tem experiência liderando equipes,
   escreva: "Profissional com experiência em gestão de projetos e liderança de equipes..."

b) BULLETS DAS EXPERIÊNCIAS: Reescreva cada bullet point incorporando keywords faltantes de forma
   contextual e honesta. Conecte as atividades reais do candidato com os termos da vaga.
   Exemplo: Se falta "análise de dados" e o candidato fez relatórios, escreva:
   "• Elaboração de relatórios com análise de dados para tomada de decisão"
   NÃO invente experiências. ADAPTE a linguagem para incluir os termos corretos.

c) LISTA DE SKILLS: Inclua TODAS as keywords faltantes que sejam skills técnicas ou comportamentais
   na lista de habilidades, ALÉM das que o candidato já possui.
   Priorize as keywords com maior peso para o ATS (termos técnicos > termos genéricos).

REGRA DE COERÊNCIA: Nunca invente experiências que o candidato não tem. Apenas REFORMULE e
ENRIQUEÇA as experiências reais usando a terminologia exata da vaga. Se uma keyword não pode
ser conectada a nenhuma experiência real, adicione-a APENAS na lista de skills.

${focusInstructions}
${goal ? '\n' + getGoalStrategyPrompt(goal) : ''}
${frequency ? '\n' + getFrequencyStrategyPrompt(frequency) : ''}

RESTRIÇÕES DE TAMANHO:
- Máximo 1 página A4 (guia para concisão, não regra absoluta).
- Se o candidato tem muitas experiências, inclua APENAS as 3-4 mais relevantes.
- Resumo profissional: máximo 3 linhas.
- Seja conciso, direto e impactante.

FORMATO DE RESPOSTA (JSON):
{
  "header": {
    "name": "Nome Completo",
    "title": "Título profissional otimizado para a vaga",
    "contact": { "email": "", "phone": "", "location": "" }
  },
  "summary": "Resumo profissional otimizado com palavras-chave da vaga (máx. 3 linhas)",
  "experiences": [
    {
      "company": "Empresa",
      "title": "Cargo otimizado",
      "period": "Mês Ano - Mês Ano",
      "bullets": ["• Responsabilidade com resultado quantificado e keyword integrada"]
    }
  ],
  "education": [
    {
      "institution": "Instituição",
      "degree": "Curso",
      "period": "Ano - Ano"
    }
  ],
  "skills": ["skill1", "skill2"],
  "languages": [{ "name": "Português", "level": "Nativo" }],
  "certifications": [{ "name": "Cert", "institution": "Org" }],
  "keywordsUsed": ["lista de todas as keywords da vaga usadas no CV"],
  "resultFormat": false
}`;

  const profileSummary = buildProfileSummary(profile);

  const userMessage = `PERFIL DO CANDIDATO:
${profileSummary}

DESCRIÇÃO DA VAGA:
${jobDescription}

═══════════════════════════════════════
INTELIGÊNCIA ATS (use estas informações para otimizar o CV):
═══════════════════════════════════════

TODAS as keywords da vaga: ${JSON.stringify(allKeywords)}

KEYWORDS QUE O CANDIDATO JÁ TEM: ${JSON.stringify(matchedKeywords)}
→ Estas já existem no perfil. Mantenha-as e destaque-as.

⚠️ KEYWORDS FALTANTES (CRÍTICO — INJETE NO CV): ${JSON.stringify(missingKeywords)}
→ Estas NÃO existem no perfil atual. Você DEVE incorporá-las organicamente no resumo, nos bullets das experiências e na lista de skills.

${criticalGaps.length ? `🚨 GAPS CRÍTICOS IDENTIFICADOS:\n${criticalGaps.map(g => `  - ${g}`).join('\n')}` : ''}

${tips.length ? `💡 DICAS DA ANÁLISE PRÉVIA:\n${tips.map(t => `  - [${t.impact?.toUpperCase() || 'MEDIO'}] ${t.text}`).join('\n')}` : ''}

Compatibilidade atual do candidato: ${matchPct}%
Meta: Elevar para 85%+ após a otimização.

Gere o currículo otimizado em formato JSON. Respeite as restrições de tamanho.`;

  // Primary attempt with temperature 0.4
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  let response = await chatCompletion(messages, { temperature: 0.4, maxTokens: 4000 });
  let parsed = parseJsonResponse(response);

  // Retry with lower temperature if parse failed
  if (!parsed) {
    console.warn('First CV generation produced invalid JSON. Retrying with temperature 0.2...');
    response = await chatCompletion(messages, { temperature: 0.2, maxTokens: 4000 });
    parsed = parseJsonResponse(response);
  }

  if (!parsed) {
    console.error('Failed to parse CV response after retry:', response);
    throw new Error('Erro ao gerar currículo: a IA não retornou um JSON válido após 2 tentativas.');
  }

  return parsed;
}
