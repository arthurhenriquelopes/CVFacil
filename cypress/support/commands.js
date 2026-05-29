import { test as base } from '@playwright/test';
import mockHigh from '../fixtures/mock-analysis-high.json' assert { type: 'json' };
import mockLow from '../fixtures/mock-analysis-low.json' assert { type: 'json' };

export const test = base.extend({
    mockExtract: [async ({ page }, use) => {
        await page.route('**/api/extract', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ text: 'Extracted text from PDF. Nome: João Silva. Email: joao@example.com. Telefone: 11999999999. Experiências: Desenvolvedor React na Tech Corp de 2020 a 2023.' })
            });
        });
        await use();
    }, { auto: true }],
    mockProfile: async ({ page }, use) => {
        await page.route('**/api/chat', async route => {
            const request = route.request();
            const postData = JSON.parse(request.postData());
            const systemPrompt = postData.messages.find(m => m.role === 'system')?.content || '';
            
            let responseContent = '';
            if (systemPrompt.includes('revisor sênior') || systemPrompt.includes('IMPROVEMENT_PERSONA')) {
                responseContent = JSON.stringify({
                    suggestions: [
                        {
                            action: 'IMPROVE',
                            section: 'Resumo',
                            current: 'Desenvolvedora Frontend',
                            proposed: 'Desenvolvedora Frontend com foco em React',
                            rationale: 'Mais específico',
                            impact: 'HIGH'
                        }
                    ]
                });
            } else {
                responseContent = JSON.stringify({
                    language: 'pt',
                    overallScore: 92,
                    executiveSummary: 'Excelente aderência e sólida experiência.',
                    strengths: ['Sólida experiência'],
                    issues: [],
                    recommendedActions: ['Mantenha o bom trabalho']
                });
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    choices: [{
                        message: { content: responseContent }
                    }]
                })
            });
        });
        await use();
    },
    mockProfileLow: async ({ page }, use) => {
        await page.route('**/api/chat', async route => {
            const request = route.request();
            const postData = JSON.parse(request.postData());
            const systemPrompt = postData.messages.find(m => m.role === 'system')?.content || '';
            
            let responseContent = '';
            if (systemPrompt.includes('revisor sênior') || systemPrompt.includes('IMPROVEMENT_PERSONA')) {
                responseContent = JSON.stringify({
                    suggestions: [
                        {
                            action: 'REWRITE',
                            section: 'Experiência',
                            current: 'HTML vago',
                            proposed: 'Desenvolvimento de interfaces usando HTML/CSS com foco em acessibilidade',
                            rationale: 'Melhora relevância',
                            impact: 'HIGH'
                        }
                    ]
                });
            } else {
                responseContent = JSON.stringify({
                    language: 'pt',
                    overallScore: 45,
                    executiveSummary: 'Muitas palavras-chave faltando.',
                    strengths: ['HTML vago'],
                    issues: [
                        {
                            section: 'Experiência',
                            problem: 'Falta de tecnologias chave',
                            reason: 'O ATS não encontra React ou Typescript',
                            suggestion: 'Adicione React e Typescript',
                            severity: 'HIGH'
                        }
                    ],
                    recommendedActions: ['Melhore isso']
                });
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    choices: [{
                        message: { content: responseContent }
                    }]
                })
            });
        });
        await use();
    }
});
