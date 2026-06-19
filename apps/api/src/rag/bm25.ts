// 어휘 검색 BM25 (하이브리드 검색의 키워드 축). 순수 함수 — 오프라인 시험 가능.
// 한글/영문 토큰화: 한글 음절 연속 + 영숫자 단위.

export interface LexDoc {
  id: string;
  text: string;
}

export interface LexHit {
  id: string;
  score: number;
}

export function tokenize(text: string): string[] {
  return (text ?? '').toLowerCase().match(/[가-힣]+|[a-z0-9]+/g) ?? [];
}

export function bm25Search(
  corpus: LexDoc[],
  query: string,
  topK = 10,
  k1 = 1.5,
  b = 0.75,
): LexHit[] {
  const qTerms = tokenize(query);
  if (corpus.length === 0 || qTerms.length === 0) return [];

  const docTokens = corpus.map((d) => tokenize(d.text));
  const docLen = docTokens.map((t) => t.length);
  const avgdl = docLen.reduce((s, x) => s + x, 0) / corpus.length || 1;

  const df = new Map<string, number>();
  for (const toks of docTokens) {
    for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = corpus.length;

  const scored = corpus.map((d, i) => {
    const tf = new Map<string, number>();
    for (const t of docTokens[i]) tf.set(t, (tf.get(t) ?? 0) + 1);
    let s = 0;
    for (const term of qTerms) {
      const f = tf.get(term) ?? 0;
      if (!f) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * docLen[i]) / avgdl)));
    }
    return { id: d.id, score: s };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, topK);
}
