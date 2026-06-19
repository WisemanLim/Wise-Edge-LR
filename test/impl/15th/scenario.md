# 15차 구현 시험 시나리오 — 각 런타임 실서버 추론 E2E (잔여 #3)

대상: 멀티런타임을 실서버로 추론 검증. OpenAI 호환(/v1) 어댑터(OpenAICompatBackend)를 실 서버에 연결.
임베딩/생성 백엔드 분리(EMBED_BACKEND) 추가 — MLX 생성 + ollama 임베딩 혼합 지원.

## 사전 (설치, 승인됨)
- mlx-lm (Apple Silicon, venv `/tmp/mlxvenv` system-site-packages). MLX 서버 `mlx_lm server`.
- 모델: mlx-community/Qwen2.5-0.5B-Instruct-4bit (한글). 임베딩: ollama bge-m3(기존).
- ollama `/v1` OpenAI 호환 엔드포인트(실 서버) — llama.cpp/vLLM/MLX 동일 프로토콜.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | EMBED_BACKEND 분리(name=생성) | openai-compat.spec |
| U2 | 기존 77 회귀 | 전부 통과 |

## E2E 시험 (HTTP)
| # | 케이스 | 기대 |
|---|---|---|
| E1 | MLX `/v1/chat/completions` 직접 | "서울입니다." 실추론 |
| E2 | OpenAICompatBackend via ollama /v1 (embed+gen) | ingest+query → "15일. 출처[1]" |
| E3 | MLX 생성 + ollama(bge-m3) 임베딩 혼합 | backend=mlx, query → "15일" |

## govtech 규제 연계
- 외부 egress 0: MLX(로컬 8082)·ollama(11434) 전부 로컬. 상용 API 미사용.
- Apple Silicon MLX 네이티브(PRD 핵심: 저전력 Edge). 런타임 선택지 실증.
