export interface VectorItem {
  id: string;
  docId: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchHit {
  id: string;
  docId: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface StoreEntry {
  id: string;
  docId: string;
  text: string;
  metadata?: Record<string, unknown>;
}

// 인메모리/pgvector 공용 포트(동기 또는 비동기). rag.core 는 await 로 둘 다 수용.
export interface VectorStoreLike {
  add(items: VectorItem[]): void | Promise<void>;
  search(query: number[], topK?: number): SearchHit[] | Promise<SearchHit[]>;
  entries(): StoreEntry[] | Promise<StoreEntry[]>;
  get(id: string): VectorItem | undefined | Promise<VectorItem | undefined>;
  documents(): { docId: string; chunks: number }[] | Promise<{ docId: string; chunks: number }[]>;
  size(): number | Promise<number>;
}

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

// 인메모리 벡터스토어(local/test). dev+ 는 pgvector 어댑터로 교체(다음 차수).
export class InMemoryVectorStore {
  private items: VectorItem[] = [];

  add(items: VectorItem[]): void {
    this.items.push(...items);
  }

  search(query: number[], topK = 4): SearchHit[] {
    return this.items
      .map((it) => ({
        id: it.id,
        docId: it.docId,
        text: it.text,
        score: cosine(query, it.embedding),
        metadata: it.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  get(id: string): VectorItem | undefined {
    return this.items.find((it) => it.id === id);
  }

  entries(): StoreEntry[] {
    return this.items.map(({ id, docId, text, metadata }) => ({ id, docId, text, metadata }));
  }

  documents(): { docId: string; chunks: number }[] {
    const counts = new Map<string, number>();
    for (const it of this.items) {
      counts.set(it.docId, (counts.get(it.docId) ?? 0) + 1);
    }
    return [...counts.entries()].map(([docId, chunks]) => ({ docId, chunks }));
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}
