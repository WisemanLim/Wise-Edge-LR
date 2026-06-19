import { LlmBackend } from './llm.types';

// OpenAI 호환 백엔드 — llama.cpp(server) · vLLM · MLX(mlx_lm.server) 공통 (/v1).
// 셋 다 OpenAI 호환 /v1/embeddings, /v1/chat/completions 를 제공한다.
export type CompatKind = 'mlx' | 'llamacpp' | 'vllm';

const DEFAULT_BASE: Record<CompatKind, string> = {
  llamacpp: 'http://localhost:8080/v1',
  vllm: 'http://localhost:8000/v1',
  mlx: 'http://localhost:8080/v1',
};

// 순수 파서 — 단위시험 대상
export function embeddingsFromResponse(obj: {
  data?: { index?: number; embedding: number[] }[];
}): number[][] {
  const data = obj.data ?? [];
  return [...data]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((d) => d.embedding);
}

export function deltaFromChunk(obj: {
  choices?: { delta?: { content?: string } }[];
}): string {
  return obj?.choices?.[0]?.delta?.content ?? '';
}

export class OpenAICompatBackend implements LlmBackend {
  readonly name: CompatKind;
  private readonly base: string;
  private readonly genModel: string;
  private readonly embModel: string;

  constructor(kind: CompatKind) {
    this.name = kind;
    this.base = (process.env.OPENAI_BASE_URL ?? DEFAULT_BASE[kind]).replace(/\/$/, '');
    this.genModel = process.env.LLM_MODEL ?? 'local';
    this.embModel = process.env.EMBEDDING_MODEL ?? 'local';
  }

  async embed(texts: string[]): Promise<number[][]> {
    const r = await fetch(`${this.base}/embeddings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.embModel, input: texts }),
    });
    if (!r.ok) throw new Error(`${this.name} embeddings ${r.status}`);
    return embeddingsFromResponse((await r.json()) as { data: { index?: number; embedding: number[] }[] });
  }

  async *generate(prompt: string): AsyncIterable<string> {
    const r = await fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.genModel,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });
    if (!r.ok || !r.body) throw new Error(`${this.name} chat ${r.status}`);
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        const payload = s.slice(5).trim();
        if (payload === '[DONE]') return;
        const token = deltaFromChunk(JSON.parse(payload));
        if (token) yield token;
      }
    }
  }
}
