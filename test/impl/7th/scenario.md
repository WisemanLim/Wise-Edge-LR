# 7차 구현 시험 시나리오 — pgvector 영속화 + RLS (#2)

대상: 사용자 지시 #2. 인메모리 → pgvector 영속 스토어. 테넌트 RLS 로 크로스테넌트 누출 차단.
`VECTOR_STORE=pgvector` 시 PgVectorStore 사용. superuser 부트스트랩 + 비-superuser(rag_app) 런타임.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | toVectorLiteral number[]→리터럴 | pgvector-store.spec |
| U2 | 기존 50 테스트 회귀(async 리팩터) | 전부 통과 |

## DB 레벨 시험 (psql) — RLS 격리
| # | 케이스 | 기대 |
|---|---|---|
| D1 | superuser(app) 연결 | RLS 우회(전 행) — **격리 안 됨 확인** |
| D2 | 비-superuser(rag_app) tenant A | A 행만 |
| D3 | 비-superuser(rag_app) tenant B | B 행만 |

## 통합 시험 (HTTP, pgvector + mock dim 128)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | ingest | `{docId,chunks:1}`, DB chunks=1 |
| I2 | query | sources 반환(cosine score) |
| I3 | 재기동 후 list | 영속 데이터 잔존 |

## govtech 규제 연계 (COMPLIANCE.md)
- **크로스테넌트 누출 차단(RLS)**: 비-superuser 역할 + FORCE RLS + app.tenant 정책.
- 부트스트랩(DDL/role) superuser 1회, CRUD 는 rag_app(NOSUPERUSER) → RLS 강제.
- 주의: superuser 연결은 RLS 우회 — 런타임은 반드시 비-superuser.
