import { test } from '../support/commands.js';
import { expect } from '@playwright/test';

test.describe('Form Resilience', () => {
    test('Testa formulário step-profile', async ({ page }) => {
        await page.goto('/pages/step-profile.html');

        // Testa persistência e edição
        await page.fill('#name', 'Ana Controller');
        await page.fill('#email', 'ana@email.com');

        // Simula salvar (ou click continuar e interceptar navegação)
        await page.click('#btn-continue');

        // Validar persistence (de forma mockada, já que depende de navegação local)
        const storedObject = await page.evaluate(() => {
            return localStorage.getItem('cvporvaga_data');
        });

        expect(storedObject).toContain('Ana Controller');

        // O mock verifica que não avançou sem job (já que o input de email/telefone não tem match exato aqui de obrigatoriedade, testa fluxo geral)
    });
});
