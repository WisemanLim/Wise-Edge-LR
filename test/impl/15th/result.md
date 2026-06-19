# 15차 구현 시험 결과

판정: **PASS** (2026-06-14, Apple Silicon arm64, mlx 0.31.1 + mlx-lm, ollama 0.30.8)

## 단위 시험 (vitest)
```
Test Files  17 passed (17)
Tests       78 passed (78)   # 기존 77 + EMBED_BACKEND 분리 1
```

## E2E 시험 (HTTP, 실서버)
| # | 결과 | 근거 |
|---|---|---|
| E1 | PASS | MLX `/v1/chat/completions`(Qwen2.5-0.5B-4bit) 직접 → "서울입니다." |
| E2 | PASS | OpenAICompatBackend via ollama `/v1`(embed bge-m3 + gen llama3.2:3b) → ingest+query "15일. 출처 [1]" |
| E3 | PASS | backend=mlx(생성) + ollama bge-m3(임베딩) 혼합 → query "15일" |

## 수정 이력 (코드 + 환경)
- LlmService: 임베딩/생성 백엔드 분리(`EMBED_BACKEND`, 기본=LLM_BACKEND). MLX는 임베딩 미제공 → ollama 임베딩과 혼합. 회귀 없음(78).
- 설치: PEP 668(externally-managed) 차단 → venv(`--system-site-packages`)로 mlx-lm 설치(시스템 mlx 0.31.1 재사용). python3.14 직접 pip 불가.

## 규제 검증
- 외부 egress 0: MLX(8082)·ollama(11434) 전부 로컬 추론.
- Apple Silicon MLX 네이티브 실증(PRD: 저전력 Edge sLLM). OpenAI 호환 어댑터가 ollama/MLX 양쪽 실서버에서 동작 → llama.cpp/vLLM 동일 프로토콜로 호환.

## 다음 (잔여 마지막)
- #4 KWCAG 수동 33항목 라이브 감사 (axe-core/Playwright 설치).
