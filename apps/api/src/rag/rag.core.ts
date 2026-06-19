import { chunkText, ChunkOptions } from './chunk';
import { SearchHit, VectorItem, VectorStoreLike } from './vector-store';
import { bm25Search } from './bm25';
import { rrfMerge } from './hybrid';
import { AccessContext, applyAcl } from './acl';

// 임베딩 능력만 요구하는 최소 인터페이스(데코레이터 비의존 → 단위시험 용이).
export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export interface IngestResult {
  docId: string;
  chunks: number;
}

export async function ingestInto(
  store: VectorStoreLike,
  embedder: Embedder,
  docId: string,
  text: string,
  opts?: ChunkOptions & { metadata?: Record<string, unknown> },
): Promise<IngestResult> {
  const chunks = chunkText(text, opts);
  if (chunks.length === 0) return { docId, chunks: 0 };
  const embeddings = await embedder.embed(chunks);
  const items: VectorItem[] = chunks.map((t, i) => ({
    id: `${docId}::${i}`,
    docId,
    text: t,
    embedding: embeddings[i],
    metadata: opts?.metadata,
  }));
  await store.add(items);
  return { docId, chunks: chunks.length };
}

export async function queryStore(
  store: VectorStoreLike,
  embedder: Embedder,
  question: string,
  topK = 4,
  access?: AccessContext,
): Promise<SearchHit[]> {
  const [q] = await embedder.embed([question]);
  // ACL 필터로 줄어들 수 있어 후보를 넉넉히 뽑고 필터 후 자른다(권한 누출 차단).
  const candidates = await store.search(q, Math.max(topK * 4, 10));
  return applyAcl(candidates, access).slice(0, topK);
}

// 하이브리드 검색: 벡터(의미) + BM25(어휘)를 RRF 로 융합 (PRD §7 retrieval, govtech 도메인 전제).
export async function queryHybrid(
  store: VectorStoreLike,
  embedder: Embedder,
  question: string,
  topK = 4,
  candidateN = 10,
  access?: AccessContext,
): Promise<SearchHit[]> {
  const [q] = await embedder.embed([question]);
  const vec = await store.search(q, candidateN);
  const ents = await store.entries();
  const lex = bm25Search(ents, question, candidateN);
  // 어휘로만 잡힌 청크의 metadata(ACL) 까지 보존하도록 entries 맵으로 lookup.
  const byId = new Map(ents.map((e) => [e.id, e]));
  const lookup = (id: string): SearchHit | undefined => {
    const e = byId.get(id);
    return e ? { id: e.id, docId: e.docId, text: e.text, score: 0, metadata: e.metadata } : undefined;
  };
  const merged = rrfMerge(vec, lex, lookup, Math.max(topK * 4, candidateN));
  return applyAcl(merged, access).slice(0, topK);
}

export function buildPrompt(question: string, hits: SearchHit[]): string {
  const ctx = hits.map((h, i) => `[${i + 1}] ${h.text}`).join('\n\n');
  return [
    '다음 문맥만 근거로 한국어로 답하라. 문맥에 없으면 "모른다"고 답하라. 답변 끝에 사용한 근거 번호를 표기하라.',
    '',
    '# 문맥',
    ctx,
    '',
    `# 질문`,
    question,
    '',
    '# 답변',
  ].join('\n');
}
