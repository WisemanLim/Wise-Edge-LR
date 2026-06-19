# 3차 구현 시험 결과

판정: **PASS** (2026-06-14, LLM_BACKEND=mock, Node 20.20.1)

## 단위 시험 (vitest)
```
Test Files  6 passed (6)
Tests       26 passed (26)   # 기존 19 + bm25.spec 5 + hybrid.spec 2
```

## 통합 시험 (HTTP)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | `/rag/query` hybrid → leave::0 최상위(RRF 0.0328), parking 0.0161 |
| I2 | PASS | `mode:"vector"` → leave::0 cosine 0.510, parking 0.250 |

## 수정 이력
- bm25.spec U1: '15일' 토큰화 기대값을 `['15','일']` 로 정정(한글/영숫자 경계 분리 = 의도 동작). 코드 변경 없음.

## 미해결 / 다음 차수
- pgvector 영속 어댑터(postgres + `pg`, 네트워크 설치 필요).
- Ollama 실백엔드 E2E + 한글 임베딩/생성 모델.
- 웹 UI: 검색 모드 토글 + 비용 대시보드 화면 + KWCAG 2.2 접근성.
- 재랭킹(reranker) 추가 검토(현재 RRF 융합까지).
