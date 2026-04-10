/**
 * Unit tests for the deterministic ATS scorer.
 */
import { describe, it, expect } from 'vitest';
import { calculateATSScore, calculatePostOptimizationScore } from '../../src/lib/ats-scorer.js';
import { PROFILE_FULLSTACK_JR, PROFILE_SENIOR_BACKEND, PROFILE_DESIGNER, JOB_FINTECH_FULLSTACK, JOB_DATA_SCIENCE } from '../fixtures/mocks.js';

describe('calculateATSScore', () => {
  it('should score Arthur (junior fullstack) at 30-75 range for fintech job', () => {
    const result = calculateATSScore(PROFILE_FULLSTACK_JR, JOB_FINTECH_FULLSTACK);

    expect(result.ats.score).toBeGreaterThanOrEqual(30);
    expect(result.ats.score).toBeLessThanOrEqual(75);
    expect(result.ats.risk).toMatch(/MÉDIO|ALTO|CRÍTICO/);
    expect(result.ats.missingKeywords.length).toBeGreaterThan(0);
    expect(result.ats.matchedKeywords.length).toBeGreaterThan(0);
  });

  it('should score senior backend (Maria) at 50+ for fintech job', () => {
    const result = calculateATSScore(PROFILE_SENIOR_BACKEND, JOB_FINTECH_FULLSTACK);

    expect(result.ats.score).toBeGreaterThanOrEqual(50);
    expect(result.ats.risk).toMatch(/BAIXO|MÉDIO|ALTO/);
    expect(result.ats.matchedKeywords.length).toBeGreaterThan(result.ats.missingKeywords.length);
  });

  it('should score designer very low for fintech dev job', () => {
    const result = calculateATSScore(PROFILE_DESIGNER, JOB_FINTECH_FULLSTACK);

    expect(result.ats.score).toBeLessThanOrEqual(40);
    expect(result.ats.risk).toMatch(/ALTO|CRÍTICO/);
  });

  it('should score Arthur very low for data science job', () => {
    const result = calculateATSScore(PROFILE_FULLSTACK_JR, JOB_DATA_SCIENCE);

    expect(result.ats.score).toBeLessThanOrEqual(40);
  });

  it('should return complete structure with all required fields', () => {
    const result = calculateATSScore(PROFILE_FULLSTACK_JR, JOB_FINTECH_FULLSTACK);

    // Top level
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('matchPercentage');
    expect(result).toHaveProperty('matchedKeywords');
    expect(result).toHaveProperty('highlightableExperiences');
    expect(result).toHaveProperty('suggestions');

    // ATS block
    expect(result.ats).toHaveProperty('score');
    expect(result.ats).toHaveProperty('classification');
    expect(result.ats).toHaveProperty('risk');
    expect(result.ats).toHaveProperty('summary');
    expect(result.ats).toHaveProperty('breakdown');
    expect(result.ats).toHaveProperty('criticalGaps');
    expect(result.ats).toHaveProperty('missingKeywords');
    expect(result.ats).toHaveProperty('matchedKeywords');
    expect(result.ats).toHaveProperty('strengths');
    expect(result.ats).toHaveProperty('tips');

    // Breakdown
    expect(result.ats.breakdown).toHaveProperty('hardSkills');
    expect(result.ats.breakdown).toHaveProperty('experience');
    expect(result.ats.breakdown).toHaveProperty('keywords');
    expect(result.ats.breakdown).toHaveProperty('education');
  });

  it('should be deterministic (same input = same output)', () => {
    const result1 = calculateATSScore(PROFILE_FULLSTACK_JR, JOB_FINTECH_FULLSTACK);
    const result2 = calculateATSScore(PROFILE_FULLSTACK_JR, JOB_FINTECH_FULLSTACK);

    expect(result1.ats.score).toBe(result2.ats.score);
    expect(result1.ats.matchedKeywords).toEqual(result2.ats.matchedKeywords);
    expect(result1.ats.missingKeywords).toEqual(result2.ats.missingKeywords);
  });
});

describe('calculatePostOptimizationScore', () => {
  it('should give full credit for keywords in experience bullets', () => {
    const mockCV = {
      summary: 'Desenvolvedor Full Stack com Spring Boot',
      experiences: [
        { bullets: ['• Desenvolvimento de APIs RESTful com Spring Boot e Java 17+', '• Testes com JUnit e Mockito'] },
      ],
      skills: ['React', 'Docker', 'PostgreSQL'],
    };
    const keywords = ['spring boot', 'react', 'docker', 'junit'];
    const result = calculatePostOptimizationScore(mockCV, keywords);

    expect(result.kwUsed.length).toBeGreaterThanOrEqual(3);
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('should give half credit for keywords only in skills list', () => {
    const mockCV = {
      summary: '',
      experiences: [],
      skills: ['Kubernetes', 'Kafka', 'RabbitMQ'],
    };
    const keywords = ['kubernetes', 'kafka', 'rabbitmq', 'terraform'];

    const result = calculatePostOptimizationScore(mockCV, keywords);

    // 3 found in skills only = 3 * 0.5 = 1.5 out of 4 = 37.5%
    expect(result.score).toBeLessThan(50);
    expect(result.kwUsed.length).toBe(3);
    expect(result.kwMissing).toContain('terraform');
  });
});
