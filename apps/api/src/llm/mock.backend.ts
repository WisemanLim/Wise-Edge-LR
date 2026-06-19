import { LlmBackend } from './llm.types';

// 오프라인/시험용 결정적 백엔드. 네트워크·Ollama 불필요.
// 임베딩은 문자 단위 해싱(한글 부분일치 반영), 생성은 고정 응답 스트림.
export class MockBackend implements LlmBackend {
  readonly name = 'mock';
  private readonly dim = 128;

  embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(texts.map((t) => this.vec(t)));
  }

  async *generate(prompt: string): AsyncIterable<string> {
    const answer = '[mock] 문맥 기반 응답입니다. 실제 응답은 Ollama 백엔드에서 생성됩니다.';
    void prompt;
    for (const tok of answer.split(' ')) {
      yield tok + ' ';
    }
  }

  private vec(text: string): number[] {
    const v = new Array(this.dim).fill(0);
    for (const ch of text.replace(/\s/g, '')) {
      const code = ch.codePointAt(0) ?? 0;
      v[code % this.dim] += 1;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  }
}
