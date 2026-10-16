import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.SITE_URL || 'http://127.0.0.1:4173/sorteador-rede-soma/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.SITE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4173',
        url: 'http://127.0.0.1:4173/sorteador-rede-soma/',
        reuseExistingServer: !process.env.CI,
      },
});
