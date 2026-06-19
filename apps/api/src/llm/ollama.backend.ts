import { LlmBackend } from './llm.types';

// 온프레미스 Ollama 백엔드. 외부 API egress 0 (망 내부 구동, PRD 성공지표).
export class OllamaBackend implements LlmBackend {
  readonly name = 'ollama';
  private readonly base: string;
  private readonly genModel: string;
  private readonly embModel: string;

  constructor() {
    this.base = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    this.genModel = process.env.LLM_MODEL ?? 'llama3.2';
    this.embModel = process.env.EMBEDDING_MODEL ?? 'bge-m3';
  }

  async embed(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (const t of texts) {
      const r = await fetch(`${this.base}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: this.embModel, prompt: t }),
      });
      if (!r.ok) throw new Error(`ollama embeddings ${r.status}`);
      const j = (await r.json()) as { embedding: number[] };
      out.push(j.embedding);
    }
    return out;
  }

  async *generate(prompt: string): AsyncIterable<string> {
    const r = await fetch(`${this.base}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.genModel, prompt, stream: true }),
    });
    if (!r.ok || !r.body) throw new Error(`ollama generate ${r.status}`);
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
        if (!s) continue;
        const j = JSON.parse(s) as { response?: string; done?: boolean };
        if (j.response) yield j.response;
      }
    }
  }
}
