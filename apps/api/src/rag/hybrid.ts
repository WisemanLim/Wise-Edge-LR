import { SearchHit } from './vector-store';
import { LexHit } from './bm25';

// Reciprocal Rank Fusion: 벡터 랭킹 + 어휘(BM25) 랭킹을 순위 기반으로 융합.
// 두 신호 어느 한쪽만 잡은 청크도 표면화 → 한글 동의어/오탈자 강건성.
export function rrfMerge(
  vec: SearchHit[],
  lex: LexHit[],
  lookup: (id: string) => SearchHit | undefined,
  topK = 4,
  k = 60,
): SearchHit[] {
  const rrf = new Map<string, number>();
  vec.forEach((h, i) => rrf.set(h.id, (rrf.get(h.id) ?? 0) + 1 / (k + i + 1)));
  lex.forEach((h, i) => rrf.set(h.id, (rrf.get(h.id) ?? 0) + 1 / (k + i + 1)));

  const merged: SearchHit[] = [...rrf.entries()].map(([id, score]) => {
    const base = vec.find((v) => v.id === id) ?? lookup(id);
    return {
      id,
      docId: base?.docId ?? '',
      text: base?.text ?? '',
      score,
      metadata: base?.metadata,
    };
  });

  return merged.sort((a, b) => b.score - a.score).slice(0, topK);
}
