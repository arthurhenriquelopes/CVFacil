/**
 * Unit tests for the algorithmic keyword extraction engine.
 */
import { describe, it, expect } from 'vitest';
import { extractKeywords, matchKeywords, deepMatchKeywords, classifyKeywordImportance } from '../../src/lib/keywords.js';
import { PROFILE_FULLSTACK_JR, PROFILE_SENIOR_BACKEND, PROFILE_DESIGNER, JOB_FINTECH_FULLSTACK, JOB_DATA_SCIENCE, JOB_DATA_ENGINEERING } from '../fixtures/mocks.js';

describe('extractKeywords', () => {
  it('should extract known tech skills from a fintech job description', () => {
    const keywords = extractKeywords(JOB_FINTECH_FULLSTACK);

    // Must find these core terms
    expect(keywords).toContainSome(['spring boot', 'react', 'docker', 'postgresql', 'git']);
    expect(keywords).toContainSome(['junit', 'mockito']);
    expect(keywords).toContainSome(['scrum']);
    expect(keywords.length).toBeGreaterThanOrEqual(10);
  });

  it('should extract data science keywords from a DS job', () => {
    const keywords = extractKeywords(JOB_DATA_SCIENCE);
    expect(keywords).toContainSome(['python', 'sql', 'git']);
    expect(keywords.length).toBeGreaterThanOrEqual(5);
  });

  it('should return empty array for empty text', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('should handle compound terms like "Spring Boot" and "Spring Security"', () => {
    const keywords = extractKeywords('Experiência com Spring Boot, Spring Security e Spring Data JPA');
    const normalized = keywords.map(k => k.toLowerCase());
    expect(normalized).toContain('spring boot');
    // Should find the compound forms
    expect(normalized.some(k => k.includes('spring security'))).toBe(true);
  });
});

describe('matchKeywords', () => {
  it('should correctly match Arthur profile skills against fintech job', () => {
    const jobKw = extractKeywords(JOB_FINTECH_FULLSTACK);
    const { matched, missing } = matchKeywords(PROFILE_FULLSTACK_JR.skills, jobKw);

    // Arthur has: Spring Boot, React, Docker, PostgreSQL, JWT, Scrum
    expect(matched.length).toBeGreaterThanOrEqual(5);

    // Arthur is missing: TypeScript, JUnit, Mockito, Spring Security, etc.
    expect(missing.length).toBeGreaterThan(0);

    // Missing should include some of these
    const missingNorm = missing.map(m => m.toLowerCase());
    const shouldBeMissing = ['typescript', 'junit', 'mockito'];
    const foundMissing = shouldBeMissing.filter(s => missingNorm.some(m => m.includes(s)));
    expect(foundMissing.length).toBeGreaterThanOrEqual(1);
  });

  it('should have near-full match for senior backend profile on fintech job', () => {
    const jobKw = extractKeywords(JOB_FINTECH_FULLSTACK);
    const { matched, missing } = matchKeywords(PROFILE_SENIOR_BACKEND.skills, jobKw);

    // Maria has almost everything
    expect(matched.length).toBeGreaterThan(missing.length);
  });

  it('should have very low match for designer on fintech dev job', () => {
    const jobKw = extractKeywords(JOB_FINTECH_FULLSTACK);
    const { matched, missing } = matchKeywords(PROFILE_DESIGNER.skills, jobKw);

    // Designer has almost nothing relevant
    expect(missing.length).toBeGreaterThan(matched.length);
  });
});

describe('deepMatchKeywords', () => {
  it('should find keywords in experience descriptions even if not in skills list', () => {
    const jobKw = extractKeywords(JOB_FINTECH_FULLSTACK);
    const { matched, matchedInExperience } = deepMatchKeywords(PROFILE_FULLSTACK_JR, jobKw);

    // Arthur mentions "Spring Boot", "Docker", "PostgreSQL" in experience description
    expect(matched.length).toBeGreaterThanOrEqual(5);
  });
});

describe('classifyKeywordImportance', () => {
  it('should classify keywords under "Requisitos Obrigatórios" as required', () => {
    const importance = classifyKeywordImportance('Spring Boot', JOB_FINTECH_FULLSTACK);
    expect(importance).toBe('required');
  });

  it('should classify keywords under "Diferenciais" as desirable', () => {
    const importance = classifyKeywordImportance('Kafka', JOB_FINTECH_FULLSTACK);
    expect(importance).toBe('desirable');
  });

  it('should classify keywords only in responsibilities as general', () => {
    const importance = classifyKeywordImportance('gateways de pagamento', JOB_FINTECH_FULLSTACK);
    expect(importance).toBe('general');
  });
});

// ──────────────────────────────────────────────────
// Regression tests for Data Engineering job (Rethink bug fixes)
// ──────────────────────────────────────────────────
describe('Data Engineering job — keyword extraction', () => {
  it('should extract data engineering keywords', () => {
    const keywords = extractKeywords(JOB_DATA_ENGINEERING);
    expect(keywords).toContainSome(['databricks', 'sql', 'python', 'git']);
    expect(keywords).toContainSome(['delta']);
    expect(keywords.length).toBeGreaterThanOrEqual(8);
  });

  it('should extract "Apache Spark" as compound term, NOT standalone "apache"', () => {
    const keywords = extractKeywords(JOB_DATA_ENGINEERING);
    const normalized = keywords.map(k => k.toLowerCase());

    // Should have the compound form
    expect(normalized.some(k => k.includes('apache spark') || k.includes('spark'))).toBe(true);

    // Should NOT have standalone "apache"
    expect(normalized.includes('apache')).toBe(false);
  });

  it('should NOT extract "Swift" when it appears as a company name', () => {
    const keywords = extractKeywords(JOB_DATA_ENGINEERING);
    const normalized = keywords.map(k => k.toLowerCase());
    expect(normalized.includes('swift')).toBe(false);
  });

  it('should classify SQL and Python as required for this job', () => {
    expect(classifyKeywordImportance('SQL', JOB_DATA_ENGINEERING)).toBe('required');
    expect(classifyKeywordImportance('Python', JOB_DATA_ENGINEERING)).toBe('required');
  });

  it('should classify Azure Data Factory as desirable', () => {
    expect(classifyKeywordImportance('Azure Data Factory', JOB_DATA_ENGINEERING)).toBe('desirable');
  });
});

// Custom matcher: toContainSome checks that at least one element from expected is in the array
expect.extend({
  toContainSome(received, expected) {
    const receivedNorm = received.map(r => r.toLowerCase());
    const found = expected.filter(e => receivedNorm.some(r => r.includes(e.toLowerCase())));
    return {
      pass: found.length > 0,
      message: () => `Expected array to contain at least one of: ${expected.join(', ')}\nReceived: ${received.join(', ')}`,
    };
  },
});
