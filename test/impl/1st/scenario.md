# 1차 구현 시험 시나리오 — RAG 코어 (인제스천·검색·스트리밍)

대상 PRD: P0-1(문서 인제스천+청킹+임베딩), P0-2(RAG 검색+LLM 스트리밍), P0-3(웹 UI).
LLM 백엔드: `mock` (오프라인 결정적). Ollama 백엔드는 망 내부 구동 시 `LLM_BACKEND=ollama`.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | 청킹: 빈/단일/오버랩/에러 | chunk.spec 통과 |
| U2 | cosine + 인메모리 스토어 add/search/documents | vector-store.spec 통과 |
| U3 | RAG 코어: 인제스천 후 관련 청크 최상위, 빈문서 0청크, buildPrompt, mock 스트림 | rag.core.spec 통과 |

실행: `pnpm --filter @Wise-Edge-LR/api test`

## 통합 시험 (HTTP, mock 백엔드)
| # | 케이스 | 명령 | 기대 |
|---|---|---|---|
| I1 | api 기동 | `LLM_BACKEND=mock nest start` | :3001 /health 200 |
| I2 | 문서 인제스천 | `POST /rag/documents {text}` | `{docId, chunks}` |
| I3 | 문서 목록 | `GET /rag/documents` | backend=mock, documents 배열 |
| I4 | RAG 질의(SSE) | `POST /rag/query {question}` | `event: sources` + `data:{token}` 스트림 + `event: done` |

## govtech 규제 연계 (COMPLIANCE.md)
- 데이터 외부 전송 0: 모든 LLM/임베딩 호출이 OLLAMA_BASE_URL(망 내부) 또는 mock — 외부 egress 없음.
- 규제대상 실데이터 비반입: 시험은 합성 문장(연차/휴가)만 사용.
- (후속 차수) KWCAG 2.2 접근성 자동점검, 고유식별정보 마스킹 검증.
