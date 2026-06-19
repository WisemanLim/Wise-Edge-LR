import { describe, expect, it } from 'vitest';
import { MockBackend } from '../llm/mock.backend';
import { InMemoryVectorStore } from './vector-store';
import { buildPrompt, ingestInto, queryHybrid, queryStore } from './rag.core';

describe('RAG core (mock backend)', () => {
  it('인제스천 후 관련 청크가 최상위로 검색된다 (한글 부분일치)', async () => {
    const store = new InMemoryVectorStore();
    const be = new MockBackend();
    await ingestInto(store, be, 'cat', '고양이는 귀여운 동물이다', { size: 100 });
    await ingestInto(store, be, 'dog', '강아지는 충성스러운 반려동물이다', { size: 100 });

    const hits = await queryStore(store, be, '고양이', 2);
    expect(hits[0].docId).toBe('cat');
    expect(hits[0].text).toContain('고양이');
  });

  it('ACL: 인가 등급 부족 시 기밀 문서는 검색결과에서 제외', async () => {
    const store = new InMemoryVectorStore();
    const be = new MockBackend();
    await ingestInto(store, be, 'pub', '연차 휴가 안내 공개문서', { size: 100 });
    await ingestInto(store, be, 'sec', '연차 관련 기밀 인사자료', {
      size: 100,
      metadata: { acl: { level: 'C' } },
    });

    const asO = await queryHybrid(store, be, '연차', 5, 10, { clearance: 'O' });
    expect(asO.map((h) => h.docId)).not.toContain('sec');
    const asC = await queryHybrid(store, be, '연차', 5, 10, { clearance: 'C' });
    expect(asC.map((h) => h.docId)).toContain('sec');
  });

  it('빈 문서는 청크 0', async () => {
    const store = new InMemoryVectorStore();
    const be = new MockBackend();
    const r = await ingestInto(store, be, 'empty', '   ');
    expect(r.chunks).toBe(0);
    expect(store.size()).toBe(0);
  });

  it('buildPrompt 는 문맥과 질문을 포함', () => {
    const p = buildPrompt('질문?', [
      { id: 'x::0', docId: 'x', text: '근거문장', score: 0.9 },
    ]);
    expect(p).toContain('근거문장');
    expect(p).toContain('질문?');
    expect(p).toContain('# 문맥');
  });

  it('mock generate 는 토큰 스트림을 낸다', async () => {
    const be = new MockBackend();
    let out = '';
    for await (const t of be.generate('아무 프롬프트')) out += t;
    expect(out.length).toBeGreaterThan(0);
  });
});
