# 14차 구현 시험 결과

판정: **PASS** (2026-06-14, Node 20.20.1)

## 단위 시험 (vitest)
```
Test Files  17 passed (17)
Tests       77 passed (77)   # 기존 73 + baseline.spec 4
```

## 통합 시험 (HTTP)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | 미설정 `GET /metrics/baseline` → `{"error":"baseline not set ..."}` |
| I2 | PASS | `POST /metrics/baseline {monthlyUsd:1200,capexUsd:3000}` → savedPct 100, paybackMonths 2.5 |
| I3 | PASS | query 3건 후 → localMonthlyUsd 0.02, savedMonthlyUsd 1199.98 |

## 수정 이력
- 코드 1차 통과(추가 디버깅 없음).

## 규제 검증 (COMPLIANCE.md / PRD §5)
- PRD 성공지표(비용 절감률 ≥70%)의 baseline 실측 입력 경로 제공 — PRD Open Question 해소.
- capex 회수개월(payback)로 하드웨어 1회 투자 ROI 가시화.

## 완료 — 무설치 잔여 2건 처리
- ✅ 13차 감사 외부 SIEM 연동
- ✅ 14차 비용 baseline 실측

## 설치 필요 잔여 2건 (별도)
- 각 런타임 실서버 추론 E2E (llama.cpp/vLLM/MLX 서버 기동, 수GB).
- KWCAG 수동 33항목 라이브 감사 (axe/Playwright/스크린리더 설치).
