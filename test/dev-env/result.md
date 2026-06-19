# 표준 환경 검증 결과 / Dev-Env Result — Wise-Edge-LR

판정: **PASS** (2026-06-14)

| # | 케이스 | 결과 |
|---|---|---|
| 1 | `pnpm install` (workspace web/api) | PASS — `--no-frozen-lockfile`로 락 갱신 |
| 2 | `make up` (postgres/pgvector+redis) | N/A (이번 차수는 local in-memory store로 검증, compose는 dev+) |
| 5 | `make dev` (`pnpm -r dev`) | PASS — web :3000, api :3001 기동 |
| 6 | `curl :3001/health` | PASS — `{"status":"ok","service":"wise-edge-lr-api"}` |
| 6b | `curl :3000` | PASS — 200 |

비고:
- Node 20.20.1. `packageManager` 핀 제거(전역 pnpm 사용). 표준은 Node ≥22 권장.
- pgvector 검증은 dev 환경(compose) 도입 차수에서 수행.
