/**
 * Algorithmic keyword extraction and matching engine.
 * Replaces the AI-dependent keyword analysis with deterministic logic.
 */

// ──────────────────────────────────────────────────
// Tech Skills Dictionary (expandable)
// ──────────────────────────────────────────────────
const TECH_SKILLS = new Set([
  // Languages
  'java', 'python', 'javascript', 'typescript', 'c#', 'c++', 'go', 'rust', 'ruby', 'php', 'kotlin', 'dart', 'scala', 'sql', 'html', 'css',
  // Frameworks & Libraries
  'spring boot', 'spring mvc', 'spring security', 'spring data jpa', 'spring cloud', 'spring batch',
  'react', 'react native', 'angular', 'vue.js', 'vue', 'next.js', 'nuxt.js', 'svelte', 'express', 'express.js',
  'fastapi', 'flask', 'django', 'laravel', 'rails', 'ruby on rails', '.net', 'asp.net',
  'flutter', 'flutter/dart',
  'node.js', 'node', 'deno', 'bun',
  'jquery', 'bootstrap', 'tailwindcss', 'tailwind',
  'hibernate', 'mybatis', 'sequelize', 'prisma', 'typeorm',
  // Databases
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'sqlite', 'oracle', 'sql server', 'mariadb', 'firebase', 'supabase',
  // Data Engineering
  'databricks', 'apache spark', 'spark', 'delta lake', 'delta', 'delta sharing', 'unity catalog',
  'apache kafka', 'apache airflow', 'airflow',
  'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
  'medallion', 'bronze', 'silver', 'gold',
  'etl', 'elt', 'data pipeline', 'pipeline de dados',
  'data warehouse', 'data lake', 'data lakehouse', 'datalake',
  'great expectations', 'deequ', 'data quality',
  'azure data factory', 'aws glue', 'aws sagemaker', 'gcp vertex ai',
  'databricks workflows', 'databricks repos',
  'azure devops', 'power bi', 'tableau', 'looker', 'metabase',
  'modelagem dimensional', 'star schema', 'snowflake schema',
  'particionamento', 'z-order',
  // DevOps & Cloud
  'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis ci',
  'aws', 'aws ecs', 'aws lambda', 'aws s3', 'aws ec2', 'aws rds', 'aws sqs', 'aws sns',
  'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'digitalocean',
  'ci/cd', 'ci cd',
  'nginx', 'linux', 'ubuntu', 'bash',
  // Testing
  'junit', 'mockito', 'jest', 'mocha', 'chai', 'cypress', 'selenium', 'playwright', 'pytest', 'rspec',
  'testes unitários', 'testes de integração', 'testes automatizados', 'tdd', 'bdd',
  // Security / Auth
  'jwt', 'oauth', 'oauth2', 'saml', 'ldap', 'keycloak', 'rbac',
  'autenticação', 'autorização', 'criptografia', 'segurança da informação',
  // Messaging
  'kafka', 'rabbitmq', 'sqs', 'activemq', 'redis pub/sub',
  // Tools
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello', 'figma', 'postman', 'insomnia',
  'gradle', 'maven', 'npm', 'yarn', 'pnpm', 'webpack', 'vite', 'babel',
  'dbeaver', 'pgadmin', 'datagrip',
  // Concepts
  'apis rest', 'api rest', 'apis restful', 'rest', 'restful', 'graphql', 'grpc', 'websocket', 'microservices', 'microsserviços',
  'solid', 'clean code', 'clean architecture', 'design patterns', 'ddd', 'hexagonal',
  'scrum', 'kanban', 'agile', 'ágil',
  'ocr', 'machine learning', 'deep learning', 'nlp', 'llm', 'ia', 'inteligência artificial',
]);

// Words that are ALSO common company/brand names. Only count as tech keywords
// if they appear in a technical context (near other tech terms).
const AMBIGUOUS_WORDS = new Set(['swift', 'oracle', 'apple', 'meta', 'unity']);

// When a compound term is found, suppress its sub-terms to avoid double-counting.
// e.g., 'apache spark' found → suppress standalone 'apache' and 'spark'
const COMPOUND_SUPPRESSIONS = {
  'apache spark': ['apache', 'spark'],
  'apache kafka': ['apache', 'kafka'],
  'apache airflow': ['apache', 'airflow'],
  'azure data factory': ['azure'],
  'azure devops': ['azure'],
  'unity catalog': ['unity'],
  'delta sharing': ['delta'],
  'delta lake': ['delta'],
  'databricks workflows': ['databricks'],
  'databricks repos': ['databricks'],
  'github actions': ['github'],
  'gitlab ci': ['gitlab'],
  'react native': ['react'],
  'ruby on rails': ['ruby', 'rails'],
  // Sub-term suppressions: when compound found, suppress the subset
  'node.js': ['node'],
  'apis rest': ['rest'],
  'apis restful': ['rest', 'restful'],
  'spring boot': ['spring'],
  'spring security': ['spring'],
  'spring mvc': ['spring'],
  'spring data jpa': ['spring'],
  'spring cloud': ['spring'],
};

// Stopwords PT-BR
const STOPWORDS = new Set([
  'a', 'o', 'e', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
  'que', 'se', 'ou', 'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas',
  'este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'isto', 'isso', 'aquilo',
  'ser', 'ter', 'estar', 'haver', 'fazer', 'poder', 'ir', 'vir', 'dever',
  'como', 'mais', 'muito', 'bem', 'já', 'ainda', 'também', 'só', 'apenas',
  'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
]);

/**
 * Normalize a string for comparison.
 */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents for matching
    .trim();
}

/**
 * Extract technical keywords from a job description text.
 * Uses dictionary matching + n-gram extraction.
 * @param {string} jobText
 * @returns {string[]} Sorted, unique keywords found
 */
export function extractKeywords(jobText) {
  const text = jobText.toLowerCase();
  const found = new Set();

  // Phase 1: Dictionary match (multi-word first, then single)
  const sortedSkills = [...TECH_SKILLS].sort((a, b) => b.length - a.length);
  for (const skill of sortedSkills) {
    // Use simple case-insensitive substring check for multi-word terms
    if (skill.includes(' ') || skill.includes('/') || skill.includes('.') || skill.includes('#') || skill.includes('+')) {
      if (text.includes(skill)) {
        found.add(skill);
      }
    } else {
      // For single-word terms, use word boundary to avoid false positives
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');
      if (regex.test(text)) {
        found.add(skill);
      }
    }
  }

  // Also do exact substring for compound terms like "Java 17+"
  const compoundPatterns = [
    /java\s*1[78]\+?/gi,
    /spring\s+boot/gi,
    /spring\s+mvc/gi,
    /spring\s+security/gi,
    /spring\s+data\s+jpa/gi,
    /spring\s+cloud/gi,
    /react\s+native/gi,
    /node\.?js/gi,
    /vue\.?js/gi,
    /next\.?js/gi,
    /aws\s+ecs/gi,
    /aws\s+lambda/gi,
    /aws\s+s3/gi,
    /aws\s+ec2/gi,
    /github\s+actions/gi,
    /gitlab\s+ci/gi,
    /clean\s+code/gi,
    /clean\s+architecture/gi,
    /design\s+patterns/gi,
    /ci\s*\/?\s*cd/gi,
    /testes?\s+unit[aá]rios?/gi,
    /testes?\s+de\s+integra[cç][aã]o/gi,
    /testes?\s+automatizados?/gi,
    /apis?\s+rest(?:ful)?/gi,
    // Data Engineering
    /apache\s+spark/gi,
    /apache\s+kafka/gi,
    /apache\s+airflow/gi,
    /azure\s+data\s+factory/gi,
    /azure\s+devops/gi,
    /unity\s+catalog/gi,
    /delta\s+shar(?:e|ing)/gi,
    /delta\s+lake/gi,
    /databricks\s+workflows?/gi,
    /databricks\s+repos?/gi,
    /great\s+expectations/gi,
    /data\s+quality/gi,
    /data\s+warehouse/gi,
    /data\s+lake(?:house)?/gi,
    /pipeline[s]?\s+de\s+dados/gi,
    /modelagem\s+dimensional/gi,
    /power\s+bi/gi,
    /window\s+functions?/gi,
  ];

  for (const pattern of compoundPatterns) {
    const match = text.match(pattern);
    if (match) {
      found.add(match[0].toLowerCase().trim());
    }
  }

  // Phase 3: Suppress sub-terms when compound terms were found
  const suppressedTerms = new Set();
  for (const kw of found) {
    const kwLower = kw.toLowerCase();
    for (const [compound, subs] of Object.entries(COMPOUND_SUPPRESSIONS)) {
      if (kwLower.includes(compound) || normalize(kw) === normalize(compound)) {
        subs.forEach(s => suppressedTerms.add(s));
      }
    }
  }

  // Phase 4: Filter ambiguous words (company names vs tech)
  // Only keep ambiguous words if they appear in a technical context
  const technicalContextIndicators = /requisito|experiência|conhecimento|habilidade|skill|tecnologia|ferramenta|linguagem|framework|proficiência/i;

  for (const kw of [...found]) {
    // Remove suppressed sub-terms
    if (suppressedTerms.has(kw) && !found.has(kw + ' ')) {
      // Only suppress if the standalone form exists AND the compound also exists
      const hasCompound = [...found].some(f => f !== kw && f.includes(kw));
      if (hasCompound) found.delete(kw);
    }

    // Filter ambiguous words
    if (AMBIGUOUS_WORDS.has(kw)) {
      // Check if word appears in a technical sentence
      const lines = jobText.split('\n');
      const inTechContext = lines.some(line => {
        const lineLower = line.toLowerCase();
        return lineLower.includes(kw) && technicalContextIndicators.test(line);
      });
      if (!inTechContext) found.delete(kw);
    }
  }

  // Deduplicate normalized forms
  const normalized = new Map();
  for (const kw of found) {
    const key = normalize(kw);
    // Keep the longest/most specific form
    if (!normalized.has(key) || kw.length > normalized.get(key).length) {
      normalized.set(key, kw);
    }
  }

  return [...normalized.values()].sort();
}

/**
 * Detect which section of the job description a keyword appears in.
 * Returns 'required', 'desirable', or 'general'.
 * @param {string} keyword
 * @param {string} jobText
 * @returns {'required'|'desirable'|'general'}
 */
export function classifyKeywordImportance(keyword, jobText) {
  const lines = jobText.split('\n');
  let currentSection = 'general';
  let bestSection = null;

  const requiredHeaders = /requisitos?\s*(obrigat[oó]rios?)?|obrigat[oó]rio|exig[eê]ncias?|indispens[aá]vel|necess[aá]rio|[eé]\s+essencial|essenciais?|esperamos\s+que|precisa\s+ter|deve\s+ter|imprescind[ií]vel/i;
  const desirableHeaders = /diferencia[il]|desej[aá]ve[il]|plus|bonus|valoriz|pode\s+se\s+destac|ser[aá]\s+um\s+plus|nice\s+to\s+have|n[aã]o\s+obrigat|se\s+destac/i;

  const priority = { required: 3, desirable: 2, general: 1 };

  for (const line of lines) {
    if (requiredHeaders.test(line)) currentSection = 'required';
    else if (desirableHeaders.test(line)) currentSection = 'desirable';

    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      if (!bestSection || priority[currentSection] > priority[bestSection]) {
        bestSection = currentSection;
      }
    }
  }

  return bestSection || 'general';
}

/**
 * Match profile skills against job keywords.
 * Uses fuzzy matching for close variants.
 * @param {string[]} profileSkills - Skills from the user's profile
 * @param {string[]} jobKeywords - Keywords extracted from the job
 * @returns {{ matched: string[], missing: string[] }}
 */
export function matchKeywords(profileSkills, jobKeywords) {
  const profileNormalized = new Map();
  for (const skill of profileSkills) {
    profileNormalized.set(normalize(skill), skill);
  }

  const matched = [];
  const missing = [];

  for (const keyword of jobKeywords) {
    const kwNorm = normalize(keyword);
    let found = false;

    // Exact normalized match
    if (profileNormalized.has(kwNorm)) {
      matched.push(keyword);
      found = true;
      continue;
    }

    // Substring match (e.g., "spring boot" matches if profile has "Spring Boot")
    for (const [profNorm] of profileNormalized) {
      if (profNorm.includes(kwNorm) || kwNorm.includes(profNorm)) {
        matched.push(keyword);
        found = true;
        break;
      }
    }

    // Also check if keyword appears in experience descriptions
    // (will be done at call site with full profile)

    if (!found) {
      missing.push(keyword);
    }
  }

  return { matched, missing };
}

/**
 * Enhanced match that also searches experience descriptions and education.
 * @param {object} profile - Full profile object
 * @param {string[]} jobKeywords
 * @returns {{ matched: string[], missing: string[], matchedInExperience: string[] }}
 */
export function deepMatchKeywords(profile, jobKeywords) {
  // Build a giant text blob from all profile content
  const profileText = [
    profile.summary || '',
    ...(profile.skills || []),
    ...(profile.experiences || []).map(e => `${e.title} ${e.company} ${e.description || ''}`),
    ...(profile.education || []).map(e => `${e.degree} ${e.institution}`),
    ...(profile.certifications || []).map(c => `${c.name} ${c.institution || ''}`),
    ...(profile.projects || []).map(p => `${p.title} ${p.role || ''} ${p.description || ''}`),
  ].join(' ').toLowerCase();

  const matched = [];
  const matchedInExperience = [];
  const missing = [];

  const skillSet = new Set((profile.skills || []).map(s => normalize(s)));

  for (const keyword of jobKeywords) {
    const kwNorm = normalize(keyword);
    const kwLower = keyword.toLowerCase();

    // Check in skills list first
    let foundInSkills = false;
    for (const skill of skillSet) {
      if (skill.includes(kwNorm) || kwNorm.includes(skill)) {
        foundInSkills = true;
        break;
      }
    }

    if (foundInSkills) {
      matched.push(keyword);
    } else if (profileText.includes(kwLower)) {
      matchedInExperience.push(keyword);
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  return { matched, missing, matchedInExperience };
}
