/**
 * CV Generation Prompt.
 * Generates an ATS-optimized CV using Perplexity Sonar.
 */
import { chatCompletion } from '../api/sonar.js';
import { getGoalStrategyPrompt } from './goal-strategy.js';
import { selectBestCertifications } from './select-certifications.js';

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
 * @param {string} params.focus - 'experiences' | 'skills' | 'results'
 * @param {string} params.template - 'modern' | 'classic'
 * @param {object} params.analysis - Result from analyzeJob (new format: {analysis, improvements})
 * @param {Array} params.selectedSuggestions - User-selected improvement suggestions
 * @returns {Promise<object>} Generated CV data
 */
export async function generateCV({ profile, jobDescription, goal, focus, template, analysis, selectedSuggestions = [] }) {

  // ═══ CERTIFICATE SELECTOR AGENT ═══
  // If user has >5 certifications, AI picks the best 3-5 for the target role
  let workingProfile = { ...profile };
  let certSelectionResult = null;

  if (profile.certifications?.length > 5) {
    try {
      const state = await import('../lib/store.js').then(m => m.getState());
      certSelectionResult = await selectBestCertifications({
        certifications: profile.certifications,
        professionalGoal: state.professionalGoal || goal || '',
        targetRole: state.targetRole || '',
        jobDescription: jobDescription || '',
      });
      workingProfile.certifications = certSelectionResult.filtered;
      console.log(
        `🎯 Agente de Certificados: ${profile.certifications.length} → ${certSelectionResult.filtered.length} selecionadas`,
        certSelectionResult.selected?.map(s => `✓ ${s.title} (${s.reason})`),
        certSelectionResult.dropped?.map(d => `✗ ${d.title} (${d.reason})`)
      );
    } catch (err) {
      console.warn('Certificado selector falhou, usando todas:', err.message);
      // Fallback: use all certifications
    }
  }

  // Extract intelligence from the new Evolui-CV analysis format
  const recruiterAnalysis = analysis?.analysis || {};
  const overallScore = recruiterAnalysis.overallScore || 0;
  const issues = recruiterAnalysis.issues || [];
  const strengths = recruiterAnalysis.strengths || [];
  const recommendedActions = recruiterAnalysis.recommendedActions || [];
  const executiveSummary = recruiterAnalysis.executiveSummary || '';

  const focusInstructions = buildFocusInstructions(focus);

  const systemPrompt = `Você é um redator profissional de currículos otimizados para ATS (Applicant Tracking System).
Sua tarefa é gerar um currículo completo e otimizado para uma vaga específica.

REGRAS CRÍTICAS PARA ATS:
1. Use EXATAMENTE as palavras-chave da vaga no currículo (não use sinônimos).
2. Coloque as palavras-chave nas primeiras linhas de cada seção.
3. Use formato cronológico reverso nas experiências.
4. Use bullet points simples (•) para listar responsabilidades.
5. Quantifique resultados sempre que possível (%, R$, números).
6. NÃO altere os cargos das experiências — copie EXATAMENTE do perfil (veja seção DADOS IMUTÁVEIS).
7. NÃO use formatação markdown (**, *, #, etc.) em NENHUM campo de texto. O output é renderizado como texto puro em HTML. Escreva texto limpo, sem asteriscos, sem negrito markdown.

INJEÇÃO DE KEYWORDS (COM HONESTIDADE):
Você receberá uma lista de KEYWORDS FALTANTES. Regras para inserção:

a) RESUMO PROFISSIONAL: Máximo 5 termos técnicos no resumo. Escreva como narrativa fluida,
   NÃO como lista disfarçada de parágrafo. Conecte com a experiência real do candidato.
   RUIM: "Proficiente em Java 17+, Spring MVC, Spring Security e Spring Data JPA..."
   BOM: "Desenvolvedor Full Stack com experiência sólida em ecossistema Spring e React, atuando em APIs RESTful com autenticação segura."

b) BULLETS DAS EXPERIÊNCIAS: Só adicione keywords que tenham CONEXÃO REAL com a atividade descrita.
   Se o candidato usou JWT, pode mencionar "autenticação JWT/OAuth2".
   Se o candidato usou Docker, pode mencionar "deploy em containers Docker (AWS ECS)".
   NÃO invente experiências. Se não há conexão possível, NÃO force a keyword no bullet.

c) LISTA DE SKILLS: Keywords faltantes que NÃO puderam ser conectadas a experiências reais
   devem ser adicionadas aqui e SOMENTE aqui. Marque-as internamente no campo "injectedSkills"
   do JSON para que o frontend saiba quais foram adicionadas vs originais.

REGRA DE COERÊNCIA: Nunca invente experiências. O candidato será perguntado sobre tudo na entrevista.
Se uma keyword não pode ser conectada a nenhuma experiência real, adicione-a APENAS na lista de skills.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS IMUTÁVEIS — NUNCA ALTERE ESTES CAMPOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome, email, telefone, localização, nome das empresas anteriores, CARGOS DAS EXPERIÊNCIAS,
nome dos cursos e instituições de ensino são FATOS VERIFICÁVEIS. Copie-os LITERALMENTE do perfil.

✗ ALUCINAÇÃO (proibido): Candidato tem "Sistemas de Informação" → output diz "Ciência da Computação"
✗ ALUCINAÇÃO (proibido): Candidato tem "IFMA" → output diz "Universidade Federal do Maranhão"
✗ ALUCINAÇÃO (proibido): Cargo é "Estagiário de Desenvolvimento Full Stack" → output diz "Desenvolvedor Java Estagiário"
✓ CORRETO: Copie EXATAMENTE o cargo, curso, instituição e empresa como estão no perfil.

Esta regra se aplica a: nome completo, CARGOS, empresas, cursos, instituições, datas.

${focusInstructions}
${goal ? '\n' + getGoalStrategyPrompt(goal) : ''}

RESTRIÇÕES DE TAMANHO:
- Máximo 1 página A4 (guia para concisão, não regra absoluta).
- Se o candidato tem muitas experiências, inclua APENAS as 3-4 mais relevantes.
- Resumo profissional: máximo 3 linhas.
- Seja conciso, direto e impactante.

CALIBRAÇÃO DE SENIORIDADE NO TÍTULO (header.title):
O campo "title" é o subtítulo do CV (ex: "Desenvolvedor Java Full Stack"). Ele DEVE refletir
o nível REAL de experiência do candidato. Regras:
- Se o candidato é estagiário ou tem <1 ano de experiência: use termos como "Desenvolvedor Junior",
  "Desenvolvedor em Formação", "Estagiário de [Área]". NUNCA use "Especialista", "Sênior", "Expert".
- Se o candidato tem 1-3 anos: pode usar "Desenvolvedor [Área]" sem qualificador de senioridade.
- Se o candidato tem 3-5 anos: pode usar "Desenvolvedor Pleno" ou equivalente.
- Se o candidato tem 5+ anos: pode usar "Especialista", "Sênior", etc.
- O título pode conter keywords da vaga (ex: "Microsserviços", "APIs RESTful") mas o nível
  de senioridade DEVE ser honesto.
✗ PROIBIDO: Estagiário com título "Especialista em Microsserviços e APIs RESTful"
✓ CORRETO: Estagiário com título "Desenvolvedor Java Junior | Foco em Microsserviços e APIs RESTful"

FORMATO DE RESPOSTA (JSON):
{
  "header": {
    "name": "Nome Completo",
    "title": "Título profissional calibrado ao nível real + keywords da vaga",
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
  "injectedSkills": ["skills that were NOT in the original profile but added for ATS optimization"],
  "languages": [{ "name": "Português", "level": "Nativo" }],
  "certifications": [{ "name": "Cert", "institution": "Org" }],
  "keywordsUsed": ["lista de todas as keywords da vaga usadas no CV"],
  "resultFormat": false
}`;

  const profileSummary = buildProfileSummary(workingProfile);

  const userMessage = `PERFIL DO CANDIDATO:
${profileSummary}

DESCRIÇÃO DA VAGA:
${jobDescription}

═══════════════════════════════════════
INTELIGÊNCIA ATS (use estas informações para otimizar o CV):
═══════════════════════════════════════

SCORE ATUAL DO CV: ${overallScore}/100
PARECER DO RECRUTADOR: ${executiveSummary}

PONTOS FORTES IDENTIFICADOS: ${JSON.stringify(strengths)}
→ Mantenha e destaque estes pontos no CV.

${issues.length ? `PROBLEMAS IDENTIFICADOS:\n${issues.map(i => `  - [${i.severity}] ${i.section}: ${i.problem} → ${i.suggestion || ''}`).join('\n')}` : ''}

${recommendedActions.length ? `AÇÕES RECOMENDADAS:\n${recommendedActions.map(a => `  - ${a}`).join('\n')}` : ''}

${selectedSuggestions.length ? `🔴 URGENTE E OBRIGATÓRIO: O USUÁRIO APROVOU AS SEGUINTES REESCRITAS. VOCÊ DEVE USAR O TEXTO EXATO DA "PROPOSTA" NO JSON FINAL (SUBSTITUINDO O TEXTO ORIGINAL):
${selectedSuggestions.map(s => `  - SEÇÃO: ${s.section}\n    SUBSTITUIR: "${s.current || '...'}"\n    POR ESTE TEXTO EXATO: "${s.proposed || ''}"`).join('\n\n')}` : ''}

${certSelectionResult ? `🎯 CERTIFICAÇÕES CURADAS POR IA (use SOMENTE estas no CV):\n${certSelectionResult.selected?.map(s => `  ✓ ${s.title} — ${s.reason}`).join('\n') || 'Nenhuma selecionada'}\n${certSelectionResult.dropped?.length ? `  Descartadas: ${certSelectionResult.dropped.map(d => d.title).join(', ')}` : ''}` : ''}

Meta: Elevar o score para 85%+ após a otimização.

🔒 ÂNCORA DE DADOS IMUTÁVEIS — COPIE VERBATIM NO JSON:
Nome: ${profile.name || ''}
Email: ${profile.email || ''}
Telefone: ${profile.phone || ''}
Localização: ${profile.location || ''}
${(profile.education || []).length ? `Formação (copie degree e institution EXATAMENTE assim):\n${(profile.education || []).map(e => `  degree="${e.degree}" | institution="${e.institution}" | period="${e.startDate || ''}–${e.endDate || ''}"`).join('\n')}` : ''}
${(profile.experiences || []).length ? `Empresas (copie company e title EXATAMENTE assim):\n${(profile.experiences || []).map(e => `  company="${e.company}" | title="${e.title}"`).join('\n')}` : ''}

Gere o currículo otimizado em formato JSON. Respeite as restrições de tamanho.`;

  // Primary: Gemini 2.5 Flash (best prose in Portuguese)
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  let response, parsed;

  // Attempt 1: Gemini 2.5 Flash
  try {
    response = await chatCompletion(messages, { temperature: 0.4, maxTokens: 4000, provider: 'gemini', model: 'gemini-2.5-flash' });
    parsed = parseJsonResponse(response);
  } catch (err) {
    console.warn('Gemini 2.5 Flash failed:', err.message);
  }

  // Attempt 2: Gemini 2.0 Flash
  if (!parsed) {
    try {
      console.warn('Trying Gemini 2.0 Flash...');
      response = await chatCompletion(messages, { temperature: 0.4, maxTokens: 4000, provider: 'gemini', model: 'gemini-2.0-flash' });
      parsed = parseJsonResponse(response);
    } catch (err) {
      console.warn('Gemini 2.0 Flash failed:', err.message);
    }
  }

  // Attempt 3: Groq llama-3.3-70b
  if (!parsed) {
    console.warn('Falling back to Groq llama-3.3-70b...');
    response = await chatCompletion(messages, { temperature: 0.3, maxTokens: 4000, provider: 'groq', model: 'llama-3.3-70b-versatile' });
    parsed = parseJsonResponse(response);
  }

  if (!parsed) {
    console.error('Failed to parse CV response after retry:', response);
    throw new Error('Erro ao gerar currículo: a IA não retornou um JSON válido após 2 tentativas.');
  }

  return parsed;
}
