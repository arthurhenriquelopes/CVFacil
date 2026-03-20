import { test as base } from '@playwright/test';
import mockHigh from '../fixtures/mock-analysis-high.json' assert { type: 'json' };
import mockLow from '../fixtures/mock-analysis-low.json' assert { type: 'json' };

export const test = base.extend({
    mockProfile: async ({ page }, use) => {
        await page.route('**/api/chat', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    choices: [{
                        message: { content: JSON.stringify(mockHigh) }
                    }]
                })
            });
        });
        await use();
    },
    mockProfileLow: async ({ page }, use) => {
        await page.route('**/api/chat', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    choices: [{
                        message: { content: JSON.stringify(mockLow) }
                    }]
                })
            });
        });
        await use();
    }
});
