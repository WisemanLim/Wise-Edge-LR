# 표준 환경 검증 시나리오 / Dev-Env Verification — Wise-Edge-LR (node-next-nest)

| # | 케이스 | 명령 | 기대 결과 |
|---|---|---|---|
| 1 | 의존성 설치 | `pnpm install` | 성공, 워크스페이스(web/api) 링크 |
| 2 | datastore 기동 | `make up` | postgres(5432)+redis(6379) healthy |
| 3 | DB 연결 | psql `DATABASE_URL` | 연결 성공 |
| 4 | pgvector 확장 | `CREATE EXTENSION IF NOT EXISTS vector;` | 성공 (RAG 벡터검색 전제) |
| 5 | dev 기동 | `make dev` (`pnpm -r dev`) | web :3000, api :3001 기동 |
| 6 | 헬스 체크 | `curl localhost:3001/health` | 200 |
| 7 | 시험 실행 | `make test` | Vitest 통과 |
| 8 | LLM 런타임 | `curl $OLLAMA_BASE_URL/api/tags` | 로컬 LLM 응답(Ollama 설치 후) |

오류 시: 수정 → 재시험 → `logs/` 에 결과 기록.
