# 8차 구현 시험 시나리오 — Ollama 실백엔드 E2E + 한글 모델 (#3)

대상: 사용자 지시 #3. mock 대신 실 Ollama 백엔드. 한글 임베딩 bge-m3(1024d) + 생성 llama3.2:3b.
코드 변경 없음 — OllamaBackend(`/api/embeddings`, `/api/generate` 스트림) 기존 구현 그대로.

## 사전 (네트워크/모델, 승인됨)
- `ollama pull bge-m3` (1024차원 한글/다국어 임베딩).
- 생성 모델 llama3.2:3b (기존 보유).

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | 기존 50 회귀 | 전부 통과(코드 무변경) |

## E2E 시험 (HTTP, pgvector dim 1024 + 실 ollama)
| # | 케이스 | 기대 |
|---|---|---|
| E1 | bge-m3 임베딩 엔드포인트 | dim 1024 |
| E2 | ingest 한글 문서 | `{docId:hr,chunks:1}`, DB vector_dims=1024 |
| E3 | query 실 LLM 스트리밍 | hr 검색 + 한글 답변 + 근거 [1] |

## govtech 규제 연계
- 외부 egress 0: 임베딩·생성 전부 로컬 Ollama(localhost:11434).
- 한글 RAG 품질: bge-m3 다국어 임베딩(PRD 한글 문서 Q&A 목표).
