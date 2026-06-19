import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// KWCAG 2.2 는 WCAG 2.1/2.2 와 정합 — axe wcag2a/2aa/2.1 룰셋으로 자동 항목 점검.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

for (const path of ['/', '/dashboard']) {
  test(`axe 위반 없음 (critical/serious): ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (serious.length) {
      console.log(JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact })), null, 2));
    }
    expect(serious).toEqual([]);
  });

  test(`키보드 포커스 도달 + lang 속성: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    // 첫 Tab 이 인터랙티브 요소로 포커스 이동(키보드 접근성)
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(tag);
  });
}
