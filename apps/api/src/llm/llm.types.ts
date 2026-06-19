// LLM 백엔드 추상화 — Ollama / MLX / llama.cpp / vLLM / mock 교체 지점 (PRD §7)
export interface LlmBackend {
  readonly name: string;
  /** 텍스트 배열을 임베딩 벡터 배열로 변환 */
  embed(texts: string[]): Promise<number[][]>;
  /** 프롬프트를 토큰 스트림으로 생성 */
  generate(prompt: string): AsyncIterable<string>;
}
