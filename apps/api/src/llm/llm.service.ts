import { Injectable, Logger } from '@nestjs/common';
import { LlmBackend } from './llm.types';
import { MockBackend } from './mock.backend';
import { OllamaBackend } from './ollama.backend';
import { OpenAICompatBackend } from './openai-compat.backend';

function makeBackend(choice: string): LlmBackend {
  switch (choice) {
    case 'mock':
      return new MockBackend();
    case 'mlx':
    case 'llamacpp':
    case 'vllm':
      return new OpenAICompatBackend(choice);
    case 'ollama':
    default:
      return new OllamaBackend();
  }
}

@Injectable()
export class LlmService implements LlmBackend {
  private readonly logger = new Logger(LlmService.name);
  private readonly genBackend: LlmBackend;
  private readonly embedBackend: LlmBackend;

  constructor() {
    const gen = (process.env.LLM_BACKEND ?? 'ollama').toLowerCase();
    // 임베딩은 별도 지정 가능(MLX/llama.cpp 생성 + ollama 임베딩 등 혼합). 기본 = 생성과 동일.
    const emb = (process.env.EMBED_BACKEND ?? gen).toLowerCase();
    this.genBackend = makeBackend(gen);
    this.embedBackend = emb === gen ? this.genBackend : makeBackend(emb);
    this.logger.log(`LLM backend = ${this.genBackend.name} (embed = ${this.embedBackend.name})`);
  }

  get name(): string {
    return this.genBackend.name;
  }

  embed(texts: string[]): Promise<number[][]> {
    return this.embedBackend.embed(texts);
  }

  generate(prompt: string): AsyncIterable<string> {
    return this.genBackend.generate(prompt);
  }
}
