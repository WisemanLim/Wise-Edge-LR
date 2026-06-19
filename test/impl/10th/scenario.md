# 10차 구현 시험 시나리오 — 멀티런타임 (MLX/llama.cpp/vLLM) (#5)

대상: 사용자 지시 #5. LLM 런타임 추상화 확장(PRD §7). 셋 다 OpenAI 호환 /v1 API →
단일 OpenAICompatBackend 로 커버. `LLM_BACKEND=mlx|llamacpp|vllm` 로 선택.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | embeddingsFromResponse index 정렬 | openai-compat.spec |
| U2 | deltaFromChunk content 추출/빈값 | openai-compat.spec |
| U3 | OpenAICompatBackend kind→name | openai-compat.spec |
| U4 | LlmService 선택(mock/ollama/mlx/llamacpp/vllm) | openai-compat.spec |

## 통합 시험 (HTTP)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | LLM_BACKEND=vllm 기동 | backend=vllm, 로그 확인 |
| I2 | 미기동 런타임 query | `event: error` + `event: done` 우아한 보고 |

비고: MLX/llama.cpp/vLLM 실서버 미설치 → 실 추론 E2E 는 각 서버 기동 시.
기본 base URL: llamacpp/mlx :8080/v1, vllm :8000/v1. `OPENAI_BASE_URL` 로 오버라이드.

## govtech 규제 연계
- 외부 egress 0: 전부 로컬 런타임(localhost). 상용 API 미사용.
- 런타임 다양화로 하드웨어/모델 선택지 확대(저사양·Edge 목표).
