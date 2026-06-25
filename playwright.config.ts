import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'monocart-reporter',
      {
        name: 'Playwright Assessment Report',
        outputFile: 'monocart-report/index.html'
      }
    ]
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000
  },
  projects: [
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com/'
      }
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://gorest.co.in/public/v2/'
      }
    },
    {
      name: 'dashboard',
      testDir: './tests/dashboard'
    }
  ]
});
