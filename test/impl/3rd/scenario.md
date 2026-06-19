# 3차 구현 시험 시나리오 — 하이브리드 검색 (BM25 + 벡터, RRF)

대상: PRD §7 retrieval(BM25+벡터 하이브리드), govtech/AGENTS 도메인 전제(하이브리드 검색).
`/rag/query` 기본 모드를 `hybrid` 로, `mode:"vector"` 로 벡터 단독 선택 가능.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | tokenize 한글/영숫자 분리, 구두점 제거, 경계분리 | bm25.spec |
| U2 | bm25Search 쿼리 용어 문서 최상위 / 무매칭 빈결과 / 빈입력 | bm25.spec |
| U3 | rrfMerge 두 랭킹 융합, 양쪽 항목 최상위 | hybrid.spec |
| U4 | queryHybrid 어휘 매칭 문서 표면화 | hybrid.spec |

## 통합 시험 (HTTP, mock)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | `/rag/query` 기본(hybrid) | leave 문서 최상위(RRF score) |
| I2 | `mode:"vector"` | 벡터 cosine score, leave 최상위 |

## govtech 규제 연계
- 하이브리드 검색은 인메모리/로컬 — 외부 egress 0 유지.
- 합성 문장(연차/주차)만 사용, 규제대상 실데이터 비반입.
