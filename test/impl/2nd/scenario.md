# 2차 구현 시험 시나리오 — 비용/토큰 모니터링 (PRD P1-4)

대상: 로컬 vs 상용 API 비용 환산 대시보드 + 토큰 카운팅.
단가 근거: `.docs/Perplexity-LLM API 서비스 비용 및 성능 비교 추천.md`.

## 단위 시험 (vitest) — tokens.spec
| # | 케이스 | 기대 |
|---|---|---|
| U1 | estimateTokens 빈/단조증가 | 0, 증가 |
| U2 | cloudCost gpt-4o 1M+1M = $25 | 정확 |
| U3 | 알 수 없는 모델 에러 | throw |
| U4 | localCost rate 환산 | 정확 |
| U5 | savings 절감액·비율 | cloud 25, local 0.7, saved 24.3, pct>95 |
| U6 | 로컬 0원 → 100% 절감 | 100 |

## 통합 시험 (HTTP, mock)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | query 2회 후 `GET /metrics/cost` | queries=2, 토큰 누적, savedPct |
| I2 | `?model=deepseek-v3` | 저단가 모델은 절감률 낮음 |
| I3 | `GET /metrics/pricing` | 단가표 반환 |

## govtech 규제 연계
- 비용 모니터링은 토큰 수만 집계 — 문서 본문/PII 미저장(누적 카운터만).
- 외부 egress 0 유지(상용 단가는 정적 테이블, API 호출 없음).
