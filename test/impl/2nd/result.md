# 2차 구현 시험 결과

판정: **PASS** (2026-06-14, LLM_BACKEND=mock, Node 20.20.1)

## 단위 시험 (vitest)
```
Test Files  4 passed (4)
Tests       19 passed (19)   # 기존 12 + tokens.spec 7
```

## 통합 시험 (HTTP)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | query 2회 후 `/metrics/cost`(gpt-4o) → `{promptTokens:68, completionTokens:26, totalTokens:94, cloudCostUsd:0.00086, localCostUsd:0.000033, savedUsd:0.000827, savedPct:96.2, queries:2}` |
| I2 | PASS | `?model=deepseek-v3` → savedPct 29.9 (저단가 모델은 절감폭 작음, 합리적) |
| I3 | PASS | `/metrics/pricing` → 6개 모델 단가표 |

## 수정 이력
- 코드 1차 통과(추가 디버깅 없음). 단위·통합 모두 1회 통과.

## 미해결 / 다음 차수
- estimateTokens 는 휴리스틱(/3). 모델별 실 토크나이저 연동 시 정밀화(PRD Open Q).
- 비용 baseline 실측치 연결(상용 월청구 vs 로컬) — PRD §5 KPI.
- 웹 UI 비용 대시보드 화면(현재 API만). pgvector 영속화.
