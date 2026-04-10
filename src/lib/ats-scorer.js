/**
 * Deterministic ATS Score Calculator.
 * Replaces AI-generated scores with algorithmic, reproducible scoring.
 */
import { extractKeywords, deepMatchKeywords, classifyKeywordImportance } from './keywords.js';

/**
 * Category weights for ATS scoring (total = 100).
 */
const WEIGHTS = {
  hardSkills: 40,
  experience: 30,
  keywords: 20,
  education: 10,
};

/**
 * Calculate a deterministic ATS score by comparing a profile against job keywords.
 *
 * @param {object} profile - User profile object from store
 * @param {string} jobDescription - Raw job description text
 * @returns {object} Full ATS analysis result
 */
export function calculateATSScore(profile, jobDescription) {
  // Step 1: Extract keywords algorithmically
  const jobKeywords = extractKeywords(jobDescription);

  // Step 2: Deep match against the full profile
  const { matched, missing, matchedInExperience } = deepMatchKeywords(profile, jobKeywords);

  // Step 3: Classify each keyword's importance
  const requiredKeywords = [];
  const desirableKeywords = [];
  const generalKeywords = [];

  for (const kw of jobKeywords) {
    const importance = classifyKeywordImportance(kw, jobDescription);
    if (importance === 'required') requiredKeywords.push(kw);
    else if (importance === 'desirable') desirableKeywords.push(kw);
    else generalKeywords.push(kw);
  }

  // Step 4: Calculate sub-scores

  // Hard Skills: blend required match (60%) with overall match (40%)
  const requiredTechMatched = requiredKeywords.filter(k => matched.includes(k)).length;
  const requiredRatio = requiredKeywords.length > 0
    ? requiredTechMatched / requiredKeywords.length
    : 1.0; // no required section = full mark
  const overallRatio = matched.length / Math.max(jobKeywords.length, 1);
  const hardSkillsRatio = requiredKeywords.length > 0
    ? requiredRatio * 0.6 + overallRatio * 0.4
    : overallRatio;
  const hardSkillsScore = Math.round(hardSkillsRatio * WEIGHTS.hardSkills);

  // Experience: Based on how many keywords appear in experience descriptions (not just skills list)
  const experienceKeywords = (profile.experiences || [])
    .map(e => `${e.title || ''} ${e.description || ''}`.toLowerCase())
    .join(' ');
  let expMatchCount = 0;
  for (const kw of jobKeywords) {
    if (experienceKeywords.includes(kw.toLowerCase())) expMatchCount++;
  }
  const expRatio = jobKeywords.length > 0 ? expMatchCount / jobKeywords.length : 0;
  const experienceScore = Math.round(expRatio * WEIGHTS.experience);

  // Keywords: Overall coverage
  const kwRatio = jobKeywords.length > 0 ? matched.length / jobKeywords.length : 0;
  const keywordsScore = Math.round(kwRatio * WEIGHTS.keywords);

  // Education: Check if degree/field is mentioned or relevant
  const educationText = (profile.education || [])
    .map(e => `${e.degree || ''} ${e.institution || ''}`.toLowerCase())
    .join(' ');
  let eduScore = WEIGHTS.education * 0.5; // Base score for having any education
  const eduKeywords = ['ciência da computação', 'sistemas de informação', 'engenharia de software',
    'engenharia da computação', 'análise de sistemas', 'tecnologia da informação',
    'computer science', 'software engineering', 'information systems'];
  for (const ek of eduKeywords) {
    if (educationText.includes(ek)) {
      eduScore = WEIGHTS.education;
      break;
    }
  }
  const educationScore = Math.round(eduScore);

  // Total score
  const totalScore = hardSkillsScore + experienceScore + keywordsScore + educationScore;

  // Step 5: Classification
  let classification, risk;
  if (totalScore >= 80) {
    classification = 'Aprovado pelo ATS';
    risk = 'BAIXO';
  } else if (totalScore >= 60) {
    classification = 'Aprovado com ressalvas pelo ATS';
    risk = 'MÉDIO';
  } else if (totalScore >= 40) {
    classification = 'Risco de rejeição pelo ATS';
    risk = 'ALTO';
  } else {
    classification = 'Reprovado automaticamente pelo ATS';
    risk = 'CRÍTICO';
  }

  // Step 6: Identify critical gaps (required keywords that are missing)
  const criticalGaps = missing.filter(kw =>
    classifyKeywordImportance(kw, jobDescription) === 'required'
  );

  // Step 7: Build summary
  const matchPct = Math.round((matched.length / Math.max(jobKeywords.length, 1)) * 100);
  const summary = buildSummary(totalScore, matchPct, matched, missing, criticalGaps, profile);

  return {
    keywords: jobKeywords,
    matchPercentage: matchPct,
    matchedKeywords: matched,
    highlightableExperiences: findHighlightableExperiences(profile, jobKeywords),
    suggestions: generateSuggestions(missing, criticalGaps, profile),
    ats: {
      score: totalScore,
      classification,
      risk,
      summary,
      breakdown: {
        hardSkills: { score: hardSkillsScore, max: WEIGHTS.hardSkills },
        experience: { score: experienceScore, max: WEIGHTS.experience },
        keywords: { score: keywordsScore, max: WEIGHTS.keywords },
        education: { score: educationScore, max: WEIGHTS.education },
      },
      criticalGaps: criticalGaps.map(kw =>
        `Ausência de "${kw}" — ${classifyKeywordImportance(kw, jobDescription) === 'required' ? 'requisito obrigatório' : 'diferencial'} da vaga`
      ),
      missingKeywords: missing,
      matchedKeywords: matched,
      strengths: findStrengths(profile, matched, jobKeywords),
      tips: generateTips(missing, criticalGaps, matchedInExperience, profile),
    },
  };
}

/**
 * Calculate post-optimization score by comparing generated CV text against job keywords.
 * Keywords in experience bullets count full weight, skills-only count half.
 * @param {object} generatedCV - The generated CV JSON
 * @param {string[]} jobKeywords - Keywords from the job
 * @returns {{ score: number, coverage: number, kwUsed: string[], kwMissing: string[] }}
 */
export function calculatePostOptimizationScore(generatedCV, jobKeywords) {
  const bulletText = (generatedCV.experiences || [])
    .flatMap(e => e.bullets || [])
    .join(' ')
    .toLowerCase();
  const summaryText = (generatedCV.summary || '').toLowerCase();
  const skillsText = (generatedCV.skills || []).join(' ').toLowerCase();
  const fullText = `${bulletText} ${summaryText} ${skillsText}`;

  const kwUsed = [];
  const kwMissing = [];
  let weightedScore = 0;

  for (const kw of jobKeywords) {
    const kwLower = kw.toLowerCase();
    const inBulletsOrSummary = bulletText.includes(kwLower) || summaryText.includes(kwLower);
    const inSkillsOnly = !inBulletsOrSummary && skillsText.includes(kwLower);

    if (inBulletsOrSummary) {
      kwUsed.push(kw);
      weightedScore += 1.0;
    } else if (inSkillsOnly) {
      kwUsed.push(kw);
      weightedScore += 0.5; // Skills-only = half credit
    } else {
      kwMissing.push(kw);
    }
  }

  const maxScore = jobKeywords.length;
  const score = maxScore > 0 ? Math.round((weightedScore / maxScore) * 100) : 0;
  const coverage = maxScore > 0 ? Math.round((kwUsed.length / maxScore) * 100) : 0;

  return { score, coverage, kwUsed, kwMissing };
}

// ──────────────────────────────────────────────────
// Helper functions (all pure algorithms, no AI)
// ──────────────────────────────────────────────────

function buildSummary(score, matchPct, matched, missing, criticalGaps, profile) {
  const name = profile.name || 'O candidato';
  if (score >= 80) {
    return `${name} demonstra forte alinhamento com os requisitos da vaga, com ${matchPct}% de cobertura de keywords. As habilidades técnicas e experiências são compatíveis com o perfil buscado.`;
  } else if (score >= 60) {
    return `${name} possui ${matched.length} keywords alinhadas com a vaga (${matchPct}% de cobertura), mas faltam ${missing.length} termos importantes${criticalGaps.length ? ', incluindo ' + criticalGaps.slice(0, 3).join(', ') : ''}. Otimização pode elevar significativamente o score.`;
  } else {
    return `${name} tem baixo alinhamento com esta vaga (${matchPct}% de match). Faltam ${missing.length} keywords críticas. Recomenda-se forte otimização do currículo antes de se candidatar.`;
  }
}

function findHighlightableExperiences(profile, jobKeywords) {
  const results = [];
  const kwSet = new Set(jobKeywords.map(k => k.toLowerCase()));

  for (const exp of (profile.experiences || [])) {
    const text = `${exp.title || ''} ${exp.description || ''}`.toLowerCase();
    const matchingKws = [...kwSet].filter(kw => text.includes(kw));

    if (matchingKws.length > 0) {
      results.push({
        title: exp.title || 'Experiência',
        reason: `Menciona ${matchingKws.slice(0, 4).join(', ')} — diretamente relevante para a vaga`,
      });
    }
  }

  return results;
}

function findStrengths(profile, matched, jobKeywords) {
  const strengths = [];

  if (matched.length >= jobKeywords.length * 0.7) {
    strengths.push(`Alta cobertura de keywords: ${matched.length}/${jobKeywords.length} termos da vaga encontrados no perfil`);
  }

  if (matched.length > 0) {
    strengths.push(`Habilidades diretamente alinhadas: ${matched.slice(0, 5).join(', ')}`);
  }

  const exps = profile.experiences || [];
  if (exps.length > 0) {
    strengths.push(`${exps.length} experiência(s) profissional(is) documentada(s)`);
  }

  const langs = profile.languages || [];
  const english = langs.find(l => l.name?.toLowerCase().includes('inglês') || l.name?.toLowerCase().includes('english'));
  if (english) {
    strengths.push(`${english.name} ${english.level} — diferencial competitivo`);
  }

  const edu = profile.education || [];
  if (edu.length > 0) {
    strengths.push(`Formação: ${edu[0].degree} — ${edu[0].institution}`);
  }

  return strengths;
}

function generateSuggestions(missing, criticalGaps, profile) {
  const suggestions = [];

  if (criticalGaps.length > 0) {
    suggestions.push(`Adicionar ${criticalGaps.slice(0, 5).join(', ')} às habilidades e experiências — são requisitos obrigatórios`);
  }

  if (missing.length > criticalGaps.length) {
    const desirable = missing.filter(m => !criticalGaps.includes(m));
    if (desirable.length > 0) {
      suggestions.push(`Mencionar ${desirable.slice(0, 3).join(', ')} como diferenciais que possui`);
    }
  }

  if (!profile.summary || profile.summary.length < 50) {
    suggestions.push('Adicionar um resumo profissional robusto com keywords da vaga nas primeiras linhas');
  }

  return suggestions;
}

function generateTips(missing, criticalGaps, matchedInExperience, profile) {
  const tips = [];

  for (const gap of criticalGaps.slice(0, 3)) {
    tips.push({
      text: `Incluir "${gap}" no currículo — é requisito obrigatório. Conecte com sua experiência real.`,
      impact: 'alto',
    });
  }

  const otherMissing = missing.filter(m => !criticalGaps.includes(m));
  for (const kw of otherMissing.slice(0, 2)) {
    tips.push({
      text: `Adicionar "${kw}" na lista de habilidades ou nos bullets de experiência`,
      impact: 'medio',
    });
  }

  if (matchedInExperience.length > 0) {
    tips.push({
      text: `Mover ${matchedInExperience.slice(0, 3).join(', ')} para a lista de Skills — aparecem na experiência mas não em habilidades`,
      impact: 'medio',
    });
  }

  return tips;
}
