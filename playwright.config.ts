import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const TEST_DB_URL = process.env.TEST_DATABASE_URL!;
const SERVER_PORT = 3001;
const CLIENT_PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',

  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    trace: 'on-first-retry',
  },

  projects: [
    // Auth setup: seeds test users into helpdesk_test and saves storageState.
    // Must complete before any test project that uses e2e/.auth/user.json.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // All other tests run in chromium after setup completes.
    // Individual test files/describe-blocks that need an authenticated session
    // opt in with: test.use({ storageState: 'e2e/.auth/user.json' })
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  webServer: [
    {
      name: 'Backend',
      command: 'bun run src/index.ts',
      cwd: path.resolve(__dirname, 'server'),
      url: `http://localhost:${SERVER_PORT}/api/health`,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: TEST_DB_URL,
        PORT: String(SERVER_PORT),
        BETTER_AUTH_URL: `http://localhost:${SERVER_PORT}`,
        SESSION_SECRET: 'test-session-secret-do-not-use-in-prod',
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'test-better-auth-secret-do-not-use-in-prod',
        CORS_ORIGINS: `http://localhost:${CLIENT_PORT}`,
        RATE_LIMIT_MAX: '1000',
      },
    },
    {
      name: 'Frontend',
      command: 'bun run dev',
      cwd: path.resolve(__dirname, 'client'),
      url: `http://localhost:${CLIENT_PORT}`,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_PORT: String(CLIENT_PORT),
        SERVER_PORT: String(SERVER_PORT),
      },
    },
  ],
});
