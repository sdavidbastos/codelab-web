import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  outputDir: 'test-results/classrooms-real',
  testMatch: 'classrooms-real.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5176',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'off',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: 'npm run dev -- --port 5176 --strictPort',
    env: { API_PROXY_TARGET: 'http://127.0.0.1:3006' },
    url: 'http://127.0.0.1:5176',
    reuseExistingServer: false,
    timeout: 20000,
  },
});
