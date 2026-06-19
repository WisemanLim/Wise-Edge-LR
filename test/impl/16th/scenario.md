# 16차 구현 시험 시나리오 — KWCAG 수동 33항목 라이브 감사 (잔여 #4, 마지막)

대상: 웹 페이지 라이브 접근성 감사. Playwright(실 Chromium) + axe-core 로 렌더된 / · /dashboard 점검.
KWCAG 2.2 는 WCAG 2.1/2.2 정합 → axe wcag2a/2aa/2.1 룰셋으로 자동 항목 점검 + 키보드 포커스.

## 사전 (설치, 승인됨)
- `@playwright/test` + `@axe-core/playwright` (web devDeps).
- `playwright install chromium` (실 브라우저).

## 단위 시험 (vitest, 무영향)
- lib/a11y.spec 6 유지(정적 점검). e2e 는 vitest 제외(vitest.config include lib만).

## 라이브 E2E (Playwright + axe)
| # | 케이스 | 기대 |
|---|---|---|
| L1 | `/` axe(critical/serious) | 위반 0 |
| L2 | `/dashboard` axe(critical/serious) | 위반 0 |
| L3 | `/` 키보드 Tab 포커스 + lang=ko | 인터랙티브 요소 포커스 |
| L4 | `/dashboard` 키보드 Tab + lang=ko | 인터랙티브 요소 포커스 |

## govtech 규제 연계 (COMPLIANCE.md)
- KWCAG 2.2 웹접근성(전자정부 필수): 자동화 가능 항목 라이브 통과.
- 잔여(자동화 불가): 스크린리더 실청취, 색 대비 디자인 판단, 의미 흐름 등 수동 항목 — 정기 수동 점검 필요.
