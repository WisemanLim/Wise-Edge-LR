import { Pool, PoolClient } from 'pg';
import { SearchHit, StoreEntry, VectorItem, VectorStoreLike } from './vector-store';

// number[] → pgvector 리터럴
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`;
}

// pgvector 영속 스토어 + 테넌트 RLS (PRD 영속화, COMPLIANCE 크로스테넌트 누출 차단).
// 모든 쿼리는 트랜잭션에서 app.tenant 를 SET LOCAL 하여 RLS 정책으로 격리.
export class PgVectorStore implements VectorStoreLike {
  constructor(
    private readonly pool: Pool,
    private readonly dim: number,
    private readonly tenant = 'default',
  ) {}

  // 부트스트랩은 superuser(adminPool)로 1회. 런타임은 비-superuser(rag_app)로 연결해야
  // RLS 가 강제된다(superuser 는 RLS 우회). 따라서 init 은 admin, CRUD 는 app 풀 사용.
  static async bootstrap(
    adminPool: Pool,
    dim: number,
    appRole: string,
    appPassword: string,
  ): Promise<void> {
    await adminPool.query('CREATE EXTENSION IF NOT EXISTS vector');
    await adminPool.query(
      `CREATE TABLE IF NOT EXISTS chunks (
         id text PRIMARY KEY,
         doc_id text NOT NULL,
         tenant text NOT NULL DEFAULT 'default',
         text text NOT NULL,
         embedding vector(${dim}) NOT NULL,
         metadata jsonb
       )`,
    );
    await adminPool.query('ALTER TABLE chunks ENABLE ROW LEVEL SECURITY');
    await adminPool.query('ALTER TABLE chunks FORCE ROW LEVEL SECURITY');
    await adminPool.query(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chunks' AND policyname='tenant_isolation') THEN
           CREATE POLICY tenant_isolation ON chunks
             USING (tenant = current_setting('app.tenant', true))
             WITH CHECK (tenant = current_setting('app.tenant', true));
         END IF;
       END $$;`,
    );
    await adminPool.query(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${appRole}') THEN
           CREATE ROLE ${appRole} LOGIN PASSWORD '${appPassword}' NOSUPERUSER;
         END IF;
       END $$;`,
    );
    await adminPool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON chunks TO ${appRole}`);
  }

  private async tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      await c.query("SELECT set_config('app.tenant', $1, true)", [this.tenant]);
      const r = await fn(c);
      await c.query('COMMIT');
      return r;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  }

  async add(items: VectorItem[]): Promise<void> {
    await this.tx(async (c) => {
      for (const it of items) {
        await c.query(
          `INSERT INTO chunks(id,doc_id,tenant,text,embedding,metadata)
           VALUES($1,$2,$3,$4,$5::vector,$6)
           ON CONFLICT (id) DO UPDATE SET text=EXCLUDED.text, embedding=EXCLUDED.embedding, metadata=EXCLUDED.metadata`,
          [
            it.id,
            it.docId,
            this.tenant,
            it.text,
            toVectorLiteral(it.embedding),
            it.metadata ? JSON.stringify(it.metadata) : null,
          ],
        );
      }
    });
  }

  async search(query: number[], topK = 4): Promise<SearchHit[]> {
    return this.tx(async (c) => {
      const r = await c.query(
        `SELECT id, doc_id, text, metadata, 1 - (embedding <=> $1::vector) AS score
         FROM chunks ORDER BY embedding <=> $1::vector LIMIT $2`,
        [toVectorLiteral(query), topK],
      );
      return r.rows.map((row) => ({
        id: row.id,
        docId: row.doc_id,
        text: row.text,
        score: Number(row.score),
        metadata: row.metadata ?? undefined,
      }));
    });
  }

  async entries(): Promise<StoreEntry[]> {
    return this.tx(async (c) => {
      const r = await c.query('SELECT id, doc_id, text, metadata FROM chunks');
      return r.rows.map((x) => ({
        id: x.id,
        docId: x.doc_id,
        text: x.text,
        metadata: x.metadata ?? undefined,
      }));
    });
  }

  async get(id: string): Promise<VectorItem | undefined> {
    return this.tx(async (c) => {
      const r = await c.query('SELECT id, doc_id, text, metadata FROM chunks WHERE id=$1', [id]);
      const x = r.rows[0];
      return x
        ? { id: x.id, docId: x.doc_id, text: x.text, embedding: [], metadata: x.metadata ?? undefined }
        : undefined;
    });
  }

  async documents(): Promise<{ docId: string; chunks: number }[]> {
    return this.tx(async (c) => {
      const r = await c.query('SELECT doc_id, COUNT(*)::int AS chunks FROM chunks GROUP BY doc_id');
      return r.rows.map((x) => ({ docId: x.doc_id, chunks: x.chunks }));
    });
  }

  async size(): Promise<number> {
    return this.tx(async (c) => {
      const r = await c.query('SELECT COUNT(*)::int AS n FROM chunks');
      return r.rows[0].n as number;
    });
  }

  async clear(): Promise<void> {
    await this.tx(async (c) => {
      await c.query('DELETE FROM chunks');
    });
  }
}
