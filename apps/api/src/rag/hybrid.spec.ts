import { describe, expect, it } from 'vitest';
import { rrfMerge } from './hybrid';
import { SearchHit } from './vector-store';
import { MockBackend } from '../llm/mock.backend';
import { InMemoryVectorStore } from './vector-store';
import { ingestInto, queryHybrid } from './rag.core';

describe('rrfMerge', () => {
  it('두 랭킹을 융합하고 양쪽에 있는 항목을 끌어올린다', () => {
    const vec: SearchHit[] = [
      { id: 'x', docId: 'd', text: 'X', score: 0.9 },
      { id: 'y', docId: 'd', text: 'Y', score: 0.8 },
    ];
    const lex = [
      { id: 'y', score: 5 },
      { id: 'z', score: 3 },
    ];
    const lookup = (id: string): SearchHit | undefined =>
      id === 'z' ? { id: 'z', docId: 'd', text: 'Z', score: 0 } : undefined;
    const merged = rrfMerge(vec, lex, lookup, 3);
    // y 는 양쪽 랭킹에 있어 최상위
    expect(merged[0].id).toBe('y');
    expect(merged.map((m) => m.id).sort()).toEqual(['x', 'y', 'z']);
  });
});

describe('queryHybrid (mock backend)', () => {
  it('어휘 매칭만 강한 문서도 표면화', async () => {
    const store = new InMemoryVectorStore();
    const be = new MockBackend();
    await ingestInto(store, be, 'leave', '연차 휴가는 입사 1년 후 15일 부여', { size: 100 });
    await ingestInto(store, be, 'parking', '주차 등록은 관리실 신청', { size: 100 });

    const hits = await queryHybrid(store, be, '연차 휴가', 2);
    expect(hits[0].docId).toBe('leave');
    expect(hits[0].text).toContain('연차');
  });
});
