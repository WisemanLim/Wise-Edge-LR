import { defineConfig } from '@playwright/test';

// KWCAG 2.2 / WCAG 라이브 감사용. next prod 서버 자동 기동 후 axe 분석.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'next start -p 3100',
    url: 'http://localhost:3100',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
