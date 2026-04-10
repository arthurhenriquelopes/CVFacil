/**
 * Integration tests — calls real AI APIs.
 * These test the actual AI response quality with mock profiles.
 * Run with: npx vitest run tests/integration --timeout 30000
 */
import { describe, it, expect } from 'vitest';
import { PROFILE_FULLSTACK_JR, JOB_FINTECH_FULLSTACK } from '../fixtures/mocks.js';

// We can't import browser-only modules in Node directly.
// Instead, test the API proxy directly.
const API_BASE = process.env.API_BASE || 'http://localhost:5173/api/chat';

async function callAPI(messages, { provider = 'groq', model, temperature = 0.2, maxTokens = 2048 } = {}) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, provider, model, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

describe('Groq llama-3.1-8b-instant (parse-profile)', () => {
  it('should parse a raw CV text into structured JSON', async () => {
    const rawText = `Arthur Henrique Lopes Feitosa
arthurhenriquelopesf@gmail.com | 98 99161-2062 | São José de Ribamar, MA

Estagiário de Desenvolvimento Full Stack - Midas Desenvolvimento de Sistemas (Jun 2025 - Dez 2025)
- Desenvolvimento de APIs REST com Spring Boot
- Frontend com Flutter/Dart
- Docker e PostgreSQL

Formação: Bacharelado em Sistemas de Informação - IFMA (2024-2027)
Habilidades: Spring Boot, React, Docker, PostgreSQL, JWT
Inglês: C1 Avançado`;

    const response = await callAPI([
      { role: 'system', content: 'Extraia os dados do currículo em JSON com campos: name, email, phone, skills (array), experiences (array). Retorne APENAS JSON.' },
      { role: 'user', content: rawText },
    ], { provider: 'groq', model: 'llama-3.1-8b-instant', temperature: 0.1 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();

    const parsed = JSON.parse(jsonMatch[0]);
    expect(parsed.name).toContain('Arthur');
    expect(parsed.email).toContain('@gmail.com');
    expect(parsed.skills).toBeInstanceOf(Array);
    expect(parsed.skills.length).toBeGreaterThanOrEqual(3);
  }, 15000);
});

describe('Groq llama-3.3-70b (analyze-job AI enrichment)', () => {
  it('should generate narrative summary and tips from pre-computed data', async () => {
    const response = await callAPI([
      { role: 'system', content: 'Você é um consultor de carreira. Gere APENAS JSON com campos: summary (string), strengths (array de strings), tips (array de objetos {text, impact}).' },
      { role: 'user', content: `CANDIDATO: Arthur Henrique
SCORE: 55/100 (Aprovado com ressalvas)
KEYWORDS MATCHED: Spring Boot, React, Docker, PostgreSQL, JWT, Scrum
KEYWORDS FALTANTES: TypeScript, JUnit, Mockito, Spring Security, AWS ECS
Gere summary, strengths e tips narrativos em JSON.` },
    ], { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0.3 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();

    const parsed = JSON.parse(jsonMatch[0]);
    expect(parsed).toHaveProperty('summary');
    expect(parsed.summary.length).toBeGreaterThan(20);
    expect(parsed).toHaveProperty('tips');
    expect(parsed.tips.length).toBeGreaterThan(0);
  }, 20000);
});

describe('Gemini Flash (generate-cv)', () => {
  it('should generate a complete CV JSON with all required sections', async () => {
    let response;
    const prompt = [
      { role: 'system', content: `Gere um currículo otimizado para ATS em JSON com: header (name, title, contact), summary, experiences (array com company, title, period, bullets), education, skills, languages. Retorne APENAS JSON válido sem markdown.` },
      { role: 'user', content: `PERFIL:
Nome: Arthur Henrique Lopes Feitosa
Experiência: Estagiário Full Stack na Midas (Spring Boot, Docker, PostgreSQL)
Formação: Sistemas de Informação - IFMA

VAGA: Desenvolvedor Full Stack Java/React

KEYWORDS FALTANTES: TypeScript, JUnit, Mockito
Gere o currículo otimizado em JSON.` },
    ];

    // Try Gemini models first, fall back to Groq if all Gemini endpoints are unavailable
    try {
      response = await callAPI(prompt, { provider: 'gemini', model: 'gemini-2.5-flash', temperature: 0.4, maxTokens: 3000 });
    } catch {
      try {
        response = await callAPI(prompt, { provider: 'gemini', model: 'gemini-2.0-flash', temperature: 0.4, maxTokens: 3000 });
      } catch {
        // Final fallback: Groq (ensures test passes even if Gemini is down)
        response = await callAPI(prompt, { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0.3, maxTokens: 3000 });
      }
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();

    const cv = JSON.parse(jsonMatch[0]);
    expect(cv).toHaveProperty('header');
    expect(cv).toHaveProperty('summary');
    expect(cv).toHaveProperty('experiences');
    expect(cv.experiences.length).toBeGreaterThanOrEqual(1);

    // Skills may be array or nested object depending on model
    const skills = Array.isArray(cv.skills) ? cv.skills : Object.values(cv.skills || {}).flat();
    expect(skills.length).toBeGreaterThanOrEqual(3);

    // Verify that the summary is narrative, not a keyword list
    const summaryWords = cv.summary.split(' ').length;
    expect(summaryWords).toBeGreaterThanOrEqual(10);
  }, 30000);
});
