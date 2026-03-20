import { test } from '../support/commands.js';
import { expect } from '@playwright/test';

test.describe('ATS Scanner', () => {
    test('Scanner Flow - Valid analysis low score', async ({ page, mockProfileLow }) => {
        await page.goto('/');
        await page.click('text=ATS Scanner Pro');
        await expect(page).toHaveURL(/step-ats-scanner/);

        // Provide a dummy PDF
        await page.setInputFiles('input[type="file"]', {
            name: 'sample.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 mock pdf dummy buffer')
        });

        await page.click('#btn-continue'); // Extrair
        await page.fill('#job-description', 'Vaga Senior Frontend');
        await page.click('#btn-continue');

        await page.waitForURL(/step-ats-result/, { timeout: 10000 });

        // Low score implies "Gerar currículo otimizado" or Red Badge
        await expect(page.locator('text=REPROVAR')).toBeVisible();
        await expect(page.locator('text=Testar outra vaga')).toBeVisible();
    });

    test('Scanner Flow - Valid analysis high score', async ({ page, mockProfile }) => {
        // using mockProfile = high
        await page.goto('/pages/step-ats-scanner.html');

        await page.setInputFiles('input[type="file"]', {
            name: 'sample2.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 mock pdf dummy buffer')
        });

        await page.click('#btn-continue');
        await page.fill('#job-description', 'Vaga Junior Frontend');
        await page.click('#btn-continue');

        await page.waitForURL(/step-ats-result/, { timeout: 10000 });

        await expect(page.locator('text=APROVAR')).toBeVisible();
        await expect(page.locator('text=Seu currículo está forte!')).toBeVisible();
    });
});
