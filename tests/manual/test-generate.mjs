/**
 * Manual test: analyze job + generate CV for Arthur's profile
 * Run with: node tests/manual/test-generate.mjs
 * Requires: Vite dev server running on localhost:5173 or 5174
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5173/api/chat';

// Arthur's mock profile
const profile = {
  name: 'Arthur Henrique Lopes Feitosa',
  email: 'arthurhenriquelopesf@gmail.com',
  phone: '98 99161-2062',
  location: 'São José de Ribamar, Maranhão',
  summary: 'Estagiário de desenvolvimento full stack com domínio em criar aplicações web escaláveis e APIs RESTful robustas.',
  skills: ['Spring Boot', 'FastAPI', 'React', 'Vue.js', 'Docker', 'PostgreSQL', 'JWT', 'OCR', 'Flutter/Dart', 'APIs REST', 'Testes unitários', 'Testes de integração', 'Scrum', 'Kanban', 'Gradle', 'DBeaver', 'Autenticação e autorização', 'Criptografia', 'Segurança da informação'],
  experiences: [
    {
      title: 'Estagiário de Desenvolvimento Full Stack',
      company: 'Midas Desenvolvimento de Sistemas',
      startDate: '06/2025', endDate: '12/2025', isCurrent: false,
      description: 'Desenvolvimento de chatbot inteligente com backend Spring Boot e frontend Flutter/Dart, integrando LLM para processamento de documentos via OCR. Implementação de APIs REST, controllers e autenticação JWT com criptografia. Criação de testes unitários e de integração. Conteinerização com Docker e gestão de banco PostgreSQL. Trabalho em equipe ágil com Scrum e Kanban.',
    },
    {
      title: 'Intérprete de Inglês',
      company: 'FIRA RoboWorld Cup 2024',
      startDate: '01/2024', endDate: '12/2024', isCurrent: false,
      description: 'Atuação como intérprete em competição internacional de robótica por 7 dias.',
    },
  ],
  education: [{ degree: 'Bacharelado em Sistemas de Informação', institution: 'Instituto Federal do Maranhão (IFMA)', startDate: '03/2024', endDate: '01/2027' }],
  languages: [{ name: 'Inglês', level: 'C1 Avançado' }],
  projects: [], certifications: [],
};

// Node.js Backend Junior job
const jobDescription = `Desenvolvedor(a) Backend Júnior (Node.js)

Responsabilidades:
Ajudar na manutenção e evolução da nossa API em Node.js (NestJS).
Implementar novas funcionalidades backend com apoio do time.
Integrar serviços e consumir APIs internas e externas.
Apoiar na escrita de testes e na melhoria da qualidade do código.
Participar de code reviews e discussões técnicas.

Requisitos:
Conhecimento em JavaScript ou TypeScript.
Experiência acadêmica, pessoal ou profissional com Node.js.
Noções de APIs REST.
Noções de banco de dados relacionais (ex: PostgreSQL ou MySQL).
Familiaridade com Git.

Diferenciais:
Já ter utilizado NestJS em projetos pessoais ou acadêmicos.
Noções de testes automatizados.
Conhecimento básico sobre filas/mensageria ou cache (mesmo que teórico).
Conhecimento básico em frontend (React) para facilitar colaboração.`;

async function callAPI(messages, opts = {}) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, ...opts }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Step 1: Algorithmic ATS Analysis ───────────────────────────────────────
import { calculateATSScore } from '../../src/lib/ats-scorer.js';
import { extractKeywords } from '../../src/lib/keywords.js';

console.log('\n🔍 STEP 1: Algorithmic ATS Analysis\n' + '─'.repeat(50));
const atsResult = calculateATSScore(profile, jobDescription);
const { ats } = atsResult;

console.log(`Score: ${ats.score}/100 (${ats.classification})`);
console.log(`Risk: ${ats.risk}`);
console.log(`Match: ${atsResult.matchPercentage}%`);
console.log(`Keywords matched: ${ats.matchedKeywords.join(', ')}`);
console.log(`Keywords missing: ${ats.missingKeywords.join(', ')}`);
console.log(`Critical gaps: ${ats.criticalGaps.length}`);

// ─── Step 2: AI Generate CV ─────────────────────────────────────────────────
console.log('\n🤖 STEP 2: Generate CV (Gemini → Groq fallback)\n' + '─'.repeat(50));

const immutableAnchor = `
🔒 ÂNCORA DE DADOS IMUTÁVEIS — COPIE VERBATIM NO JSON:
Nome: ${profile.name}
Email: ${profile.email}
Telefone: ${profile.phone}
Localização: ${profile.location}
Formação (copie degree e institution EXATAMENTE assim):
${profile.education.map(e => `  degree="${e.degree}" | institution="${e.institution}" | period="${e.startDate}–${e.endDate}"`).join('\n')}
Empresas (copie company e title EXATAMENTE assim):
${profile.experiences.map(e => `  company="${e.company}" | title="${e.title}"`).join('\n')}`;

const systemPrompt = `Você é um redator profissional de currículos otimizados para ATS.
DADOS IMUTÁVEIS: Nome, email, empresas, cursos e instituições devem ser copiados LITERALMENTE do perfil.
✗ PROIBIDO: alterar "Sistemas de Informação" para "Ciência da Computação"
✗ PROIBIDO: alterar "IFMA" para outro nome de instituição
Retorne APENAS JSON válido sem markdown.`;

const userPrompt = `PERFIL: ${profile.name}
Skills: ${profile.skills.join(', ')}
Experiências: ${profile.experiences.map(e => `${e.title} em ${e.company}: ${e.description}`).join('\n')}
Formação: ${profile.education.map(e => `${e.degree} — ${e.institution}`).join('\n')}

VAGA: Desenvolvedor Backend Júnior (Node.js)
KEYWORDS FALTANTES: ${ats.missingKeywords.join(', ')}
KEYWORDS JÁ TEM: ${ats.matchedKeywords.join(', ')}

${immutableAnchor}

Gere o currículo em JSON com: header {name, title, contact}, summary, experiences [{company, title, period, bullets[]}], education [{degree, institution, period}], skills[], injectedSkills[], languages[].`;

let cvJson;
try {
  const response = await callAPI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    { provider: 'gemini', model: 'gemini-2.0-flash', temperature: 0.4, max_tokens: 3000 }
  );
  const match = response.match(/\{[\s\S]*\}/);
  cvJson = match ? JSON.parse(match[0]) : null;
} catch (err) {
  console.log('Gemini failed, trying Groq...', err.message);
  const response = await callAPI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 3000 }
  );
  const match = response.match(/\{[\s\S]*\}/);
  cvJson = match ? JSON.parse(match[0]) : null;
}

if (!cvJson) { console.error('❌ Failed to parse CV JSON'); process.exit(1); }

// ─── Step 3: Validate ───────────────────────────────────────────────────────
console.log('\n✅ STEP 3: Validation\n' + '─'.repeat(50));
const edu = cvJson.education?.[0];
const hallucinations = [];
if (!edu?.degree?.includes('Sistemas de Informação')) hallucinations.push(`❌ Degree hallucinated: "${edu?.degree}"`);
if (!edu?.institution?.includes('IFMA') && !edu?.institution?.includes('Federal do Maranhão')) hallucinations.push(`❌ Institution hallucinated: "${edu?.institution}"`);
if (!cvJson.header?.name?.includes('Arthur')) hallucinations.push(`❌ Name altered: "${cvJson.header?.name}"`);

const exp0 = cvJson.experiences?.[0];
if (!exp0?.company?.includes('Midas')) hallucinations.push(`❌ Company hallucinated: "${exp0?.company}"`);

if (hallucinations.length === 0) {
  console.log('✅ No hallucinations detected — all factual data correct!');
} else {
  console.log('HALLUCINATION DETECTED:');
  hallucinations.forEach(h => console.log(h));
}

console.log('\n📋 CV Summary:');
console.log(`  Name: ${cvJson.header?.name}`);
console.log(`  Title: ${cvJson.header?.title}`);
console.log(`  Education: ${edu?.degree} — ${edu?.institution}`);
console.log(`  Experience bullets (first): ${(cvJson.experiences?.[0]?.bullets || []).slice(0, 2).join('\n    ')}`);
console.log(`  Skills count: ${(cvJson.skills || []).length}`);
console.log(`  Injected skills: ${(cvJson.injectedSkills || []).join(', ')}`);
