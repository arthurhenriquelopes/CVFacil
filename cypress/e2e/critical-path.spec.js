import { test } from '../support/commands.js';
import { expect } from '@playwright/test';

test.describe('CV Wizard - Critical Path', () => {
    test('Gera CV completo do início ao fim', async ({ page, mockProfile }) => {
        await page.goto('/');

        // Step 1: Inicia wizard
        await page.click('text=Criar CV');
        await expect(page).toHaveURL(/step-profile/);

        // Step 2: Preenche perfil
        await page.fill('#name', 'João Silva');
        await page.click('#btn-continue');

        // Step 3: Preenche objetivo e descrição da vaga
        await page.fill('#professional-goal', 'Desenvolvedor Frontend React');
        await page.fill('#job-desc', 'Vaga Frontend React');
        await page.click('#btn-next');

        // Step 4: Redireciona para análise e vai para o resultado do ATS
        await page.waitForURL(/step-ats-result/, { timeout: 15000 });

        // Step 5: Clica em Gerar CV no painel do resultado do ATS
        await page.click('#btn-generate');

        // Step 6: Escolhe modelo e clica em continuar
        await page.waitForURL(/step-template/);
        await page.click('#btn-continue');

        // Step 7: Aguarda geração do CV e vai para o resultado final
        await page.waitForURL(/result/, { timeout: 15000 });

        // Verifica CV renderizado
        await expect(page.locator('#cv-preview .cv-name')).toContainText('João Silva');
        await expect(page.locator('#kpi-score-after')).toContainText(/%/);
    });
});
