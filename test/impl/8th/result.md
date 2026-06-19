# 8차 구현 시험 결과

판정: **PASS** (2026-06-14, Ollama 0.30.8, bge-m3 + llama3.2:3b, pgvector dim 1024)

## 단위 시험 (vitest)
```
Test Files  12 passed (12)
Tests       50 passed (50)   # 코드 무변경, 회귀 없음
```

## E2E 시험 (HTTP, 실 Ollama)
| # | 결과 | 근거 |
|---|---|---|
| E1 | PASS | `/api/embeddings` bge-m3 → dim 1024 |
| E2 | PASS | ingest → `{"docId":"hr","chunks":1}`, DB `vector_dims=1024` |
| E3 | PASS | query → 검색 docId `hr`, 실 LLM 한글 답변 "연차 휴가는 입사 1년 후 15일이 부여된다. 근거 번호: [1]" |

## 수정 이력 (환경/인프라 — 코드 무변경)
- **임베딩 엔드포인트 에러**: 생성전용 llama3.2:3b 는 `/api/embeddings` 미지원("server does not support embeddings"). → 임베딩은 bge-m3 사용(정상 1024). 모델별 capability 차이.
- **컨테이너 소멸/포트 충돌**: 다른 프로젝트(wise-auth)가 5432 점유 + 내 컨테이너 제거됨. → docker-compose 포트 변수화(`POSTGRES_PORT`/`REDIS_PORT`), 내 스택 5433/6380 재기동.
- **named volume 잔존**: 이전 dim-128 chunks 테이블이 볼륨에 남아 `expected 128 dimensions` 에러. → DROP TABLE 후 재부팅(dim 1024 재생성).

## 규제 검증
- 외부 egress 0: 임베딩·생성 모두 로컬 Ollama. 상용 API 미사용.
- 한글 RAG: bge-m3 임베딩으로 한글 검색 정상.

## 다음 차수 (사용자 지시 순)
- #4 웹 대시보드 + KWCAG 2.2 접근성 (무설치).
- #5 멀티런타임, #6 감사 WORM.
