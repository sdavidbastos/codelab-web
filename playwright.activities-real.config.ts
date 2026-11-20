import { defineConfig } from '@playwright/test';
import education from './playwright.classrooms-real.config';
export default defineConfig({
  ...education,
  outputDir: 'test-results/activities-real',
  testMatch: 'activities-real.spec.ts',
});
