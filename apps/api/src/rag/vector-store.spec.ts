import { describe, expect, it } from 'vitest';
import { cosine, InMemoryVectorStore } from './vector-store';

describe('cosine', () => {
  it('동일 벡터는 1', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });
  it('직교 벡터는 0', () => {
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });
  it('영벡터는 0', () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});

describe('InMemoryVectorStore', () => {
  it('add/search/documents/size', () => {
    const s = new InMemoryVectorStore();
    s.add([
      { id: 'a::0', docId: 'a', text: 'cat', embedding: [1, 0, 0] },
      { id: 'a::1', docId: 'a', text: 'dog', embedding: [0, 1, 0] },
      { id: 'b::0', docId: 'b', text: 'fish', embedding: [0, 0, 1] },
    ]);
    expect(s.size()).toBe(3);
    expect(s.documents()).toEqual([
      { docId: 'a', chunks: 2 },
      { docId: 'b', chunks: 1 },
    ]);
    const hits = s.search([1, 0, 0], 2);
    expect(hits[0].text).toBe('cat');
    expect(hits[0].score).toBeCloseTo(1);
    expect(hits.length).toBe(2);
  });
});
