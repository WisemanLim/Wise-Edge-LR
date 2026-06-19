import { describe, expect, it, beforeEach } from 'vitest';
import { deltaFromChunk, embeddingsFromResponse, OpenAICompatBackend } from './openai-compat.backend';
import { LlmService } from './llm.service';

describe('embeddingsFromResponse', () => {
  it('index 순으로 정렬해 embedding 추출', () => {
    const obj = {
      data: [
        { index: 1, embedding: [3, 4] },
        { index: 0, embedding: [1, 2] },
      ],
    };
    expect(embeddingsFromResponse(obj)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
  it('빈 응답', () => {
    expect(embeddingsFromResponse({})).toEqual([]);
  });
});

describe('deltaFromChunk', () => {
  it('choices[0].delta.content 추출', () => {
    expect(deltaFromChunk({ choices: [{ delta: { content: '안녕' } }] })).toBe('안녕');
  });
  it('delta 없으면 빈 문자열', () => {
    expect(deltaFromChunk({ choices: [{}] })).toBe('');
    expect(deltaFromChunk({})).toBe('');
  });
});

describe('OpenAICompatBackend', () => {
  it('kind 별 name + 기본 base', () => {
    delete process.env.OPENAI_BASE_URL;
    expect(new OpenAICompatBackend('vllm').name).toBe('vllm');
    expect(new OpenAICompatBackend('llamacpp').name).toBe('llamacpp');
    expect(new OpenAICompatBackend('mlx').name).toBe('mlx');
  });
});

describe('LlmService 백엔드 선택', () => {
  beforeEach(() => {
    delete process.env.OPENAI_BASE_URL;
  });
  it('LLM_BACKEND 별 백엔드', () => {
    delete process.env.EMBED_BACKEND;
    process.env.LLM_BACKEND = 'mock';
    expect(new LlmService().name).toBe('mock');
    process.env.LLM_BACKEND = 'vllm';
    expect(new LlmService().name).toBe('vllm');
    process.env.LLM_BACKEND = 'llamacpp';
    expect(new LlmService().name).toBe('llamacpp');
    process.env.LLM_BACKEND = 'mlx';
    expect(new LlmService().name).toBe('mlx');
    process.env.LLM_BACKEND = 'ollama';
    expect(new LlmService().name).toBe('ollama');
  });

  it('EMBED_BACKEND 로 임베딩/생성 분리 (name=생성 백엔드)', () => {
    process.env.LLM_BACKEND = 'mlx';
    process.env.EMBED_BACKEND = 'ollama';
    const svc = new LlmService();
    expect(svc.name).toBe('mlx'); // name 은 생성 백엔드 기준
    delete process.env.EMBED_BACKEND;
  });
});
