import { describe, expect, it } from 'vitest';
import { chunkText } from './chunk';

describe('chunkText', () => {
  it('빈 문자열은 빈 배열', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
  });

  it('size 보다 짧으면 단일 청크', () => {
    expect(chunkText('짧은 문장', { size: 100 })).toEqual(['짧은 문장']);
  });

  it('size 기준으로 여러 청크 분할 + 오버랩', () => {
    const text = 'a'.repeat(1000);
    const chunks = chunkText(text, { size: 400, overlap: 40 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBe(400);
  });

  it('overlap >= size 면 에러', () => {
    expect(() => chunkText('x', { size: 10, overlap: 10 })).toThrow();
  });
});
