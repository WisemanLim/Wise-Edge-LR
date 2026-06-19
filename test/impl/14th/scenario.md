# 14차 구현 시험 시나리오 — 비용 baseline 실측 (잔여 #2)

대상: PRD §5 KPI. 도입 전 상용 API 월청구 실측 baseline 입력·저장 → 로컬 운영비 환산 대비 절감.
`POST /metrics/baseline {monthlyUsd, model?, note?, capexUsd?}`, `GET /metrics/baseline`.
관측 토큰 기반 로컬비용을 월 환산, 하드웨어 capex 회수개월 계산. `BASELINE_PATH` 영속.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | 월 환산 + baseline 대비 절감(%) | baseline.spec |
| U2 | capex payback 개월 | baseline.spec |
| U3 | observedDays 0 방어 | baseline.spec |
| U4 | baseline 0 → savedPct 0 | baseline.spec |

## 통합 시험 (HTTP)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | 미설정 GET | `{error:...}` |
| I2 | POST baseline(1200, capex 3000) | savedPct 100, payback 2.5 |
| I3 | query 후 GET | localMonthly 증가(0.02), 절감 유지 |

## govtech 규제 연계 (COMPLIANCE.md)
- PRD §5 성공지표(비용 절감률 ≥70%)의 baseline 실측 연결 — Open Question 해소 경로.
- 절감액·capex 회수개월로 도입 ROI 가시화(대시보드 연계 가능).
