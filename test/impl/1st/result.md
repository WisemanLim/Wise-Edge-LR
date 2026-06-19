# 1차 구현 시험 결과

판정: **PASS** (2026-06-14, LLM_BACKEND=mock, Node 20.20.1)

## 단위 시험 (vitest)
```
Test Files  3 passed (3)
Tests       12 passed (12)
```
- chunk.spec(4), vector-store.spec(4), rag.core.spec(4) 전부 통과.

## 통합 시험 (HTTP)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | `/health` 200 `{"status":"ok","service":"wise-edge-lr-api"}` |
| I2 | PASS | `POST /rag/documents` → `{"docId":"policy","chunks":1}` |
| I3 | PASS | `GET /rag/documents` → `{"backend":"mock","documents":[{"docId":"policy","chunks":1}]}` |
| I4 | PASS | `POST /rag/query` → `event: sources`(score 0.299) + token 스트림 9개 + `event: done` |

## 수정 이력
- `rag.controller.ts`: `import { Response } from 'express'` → 구조적 타입 `SseResponse` 로 교체.
  사유: `@types/express` 미설치로 `nest start` 컴파일 에러(TS2307). 네트워크 설치 회피.

## 미해결 / 다음 차수
- pgvector 어댑터(현재 인메모리). dev 환경 compose 연동 시 교체.
- Ollama 실백엔드 E2E(모델 설치 필요), 한글 임베딩 모델 선정(PRD Open Q).
- 비용/토큰 모니터링(P1), 웹 UI Playwright E2E + KWCAG 2.2 접근성 점검.
