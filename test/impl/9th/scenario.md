# 9차 구현 시험 시나리오 — 웹 대시보드 + KWCAG 2.2 접근성 (#4)

대상: 사용자 지시 #4. 비용/감사 대시보드 화면 + 접근성. 무설치.
- `/dashboard`: /metrics/cost(상용 모델 선택) + /audit(최근 20, PII 마스킹) 표.
- KWCAG 2.2 자동 점검 가능 항목: lang, img alt, 폼 레이블, 버튼 이름, h1 구조, skip-link, aria-live.

## 단위 시험 (vitest, web)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | auditHtml 정상 마크업 무이슈 | a11y.spec |
| U2 | lang/img-alt/label/button/h1 누락 탐지 | a11y.spec |
| U3 | aria-label 입력은 통과 | a11y.spec |

## 통합 시험
| # | 케이스 | 기대 |
|---|---|---|
| I1 | `next build` | / · /dashboard 정적 생성 성공 |
| I2 | 렌더 마커 | home: lang/h1/skip-link/aria-live, dash: lang/h1/label/scope |
| I3 | 라이브 auditHtml(렌더 HTML) | home·dashboard CLEAN |

## govtech 규제 연계 (COMPLIANCE.md)
- **KWCAG 2.2 웹접근성**(전자정부 필수): 자동 점검 항목 통과.
- 수동 항목(대비 측정·스크린리더·키보드 흐름·target size)은 라이브 감사(Playwright/스크린리더)로 보완 — 잔여.
- 대시보드는 비용 절감(성공지표)·감사로그(ISMS-P) 가시화.
