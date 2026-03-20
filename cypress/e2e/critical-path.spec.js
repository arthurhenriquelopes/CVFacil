import { test } from '../support/commands.js';
import { expect } from '@playwright/test';

test.describe('CV Wizard - Critical Path', () => {
    test('Gera CV completo do início ao fim', async ({ page, mockProfile }) => {
        await page.goto('/');

        // Step 1: Inicia wizard
        await page.click('text=Criar CV');
        await expect(page).toHaveURL(/step-goal/);

        // Step 2-7: Preenche dados mínimos
        await page.selectOption('select', { index: 1 });
        await page.click('#btn-next');

        await page.selectOption('select', { index: 1 });
        await page.click('#btn-next');

        await page.fill('#name', 'João Silva');
        await page.click('#btn-continue');

        await page.fill('#jobDescription', 'Desenvolvedor Frontend React');
        await page.click('#btn-continue');

        await page.selectOption('select', 'modern');
        await page.click('#btn-continue');

        // Steps de loading passam automaticamente
        await page.waitForURL(/result/);

        // Verifica CV renderizado
        await expect(page.locator('#cv-preview h1')).toContainText('João Silva');
        await expect(page.locator('[id="ats-score"]')).toContainText(/Score ATS/);
    });
});
