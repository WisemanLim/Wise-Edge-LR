# 7차 구현 시험 결과

판정: **PASS** (2026-06-14, Node 20.20.1, postgres pgvector 0.8.2)

## 단위 시험 (vitest)
```
Test Files  12 passed (12)
Tests       50 passed (50)   # 기존 48 + pgvector-store.spec 2. async 리팩터 회귀 없음
```

## DB 레벨 시험 (psql) — RLS 격리
| # | 결과 | 근거 |
|---|---|---|
| D1 | 확인 | superuser(app) → 전 행 노출(RLS 우회) → 런타임 비-superuser 필요성 입증 |
| D2 | PASS | rag_app + app.tenant=A → `a1|A` 만 |
| D3 | PASS | rag_app + app.tenant=B → `b1|B` 만 |

## 통합 시험 (HTTP, VECTOR_STORE=pgvector, mock dim 128)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | ingest → `{"docId":"policy","chunks":1}`, DB `SELECT count(*)=1` |
| I2 | PASS | query → sources(score 0.0328) |
| I3 | PASS | api 재기동 후 `/rag/documents` → policy 잔존(영속) |

## 수정 이력
- **RLS 미격리 발견(D1)**: postgres 컨테이너 기본 사용자 `app` 이 superuser → FORCE RLS 도 우회.
  수정: 부트스트랩(superuser)과 런타임(비-superuser `rag_app`) 풀 분리. rag_app 으로 격리 확인.
- async 스토어 포트(VectorStoreLike) 도입 — rag.core 가 await 로 동기/비동기 스토어 모두 수용.

## 규제 검증 (COMPLIANCE.md)
- 크로스테넌트 누출 차단: RLS 정책 + 비-superuser 런타임으로 강제(testing_additions 충족).
- 영속: pgvector 테이블, 재기동 무손실.

## 다음 차수 (사용자 지시 순)
- #3 Ollama 실백엔드 E2E + 한글 모델(EMBEDDING_DIM=1024 bge-m3) — Ollama 설치 필요.
- #4 웹 대시보드+KWCAG 2.2, #5 멀티런타임, #6 감사 WORM.
