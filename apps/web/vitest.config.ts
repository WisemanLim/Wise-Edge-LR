import { defineConfig } from 'vitest/config';

// 단위(lib)만 vitest. e2e(playwright)는 별도 러너(test:a11y).
export default defineConfig({
  test: {
    include: ['lib/**/*.spec.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'node',
  },
});
