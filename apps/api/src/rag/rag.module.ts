import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { InMemoryVectorStore, VectorStoreLike } from './vector-store';
import { RagService, VECTOR_STORE } from './rag.service';
import { RagController } from './rag.controller';

// VECTOR_STORE=pgvector → pgvector 영속(RLS), 그 외 → 인메모리(local/test)
const vectorStoreProvider = {
  provide: VECTOR_STORE,
  useFactory: async (): Promise<VectorStoreLike> => {
    if (process.env.VECTOR_STORE === 'pgvector') {
      const { Pool } = await import('pg');
      const { PgVectorStore } = await import('./pgvector-store');
      const dim = Number(process.env.EMBEDDING_DIM ?? 128);
      const role = process.env.PG_APP_ROLE ?? 'rag_app';
      const pw = process.env.PG_APP_PASSWORD ?? 'rag_app';
      // 1) superuser 로 부트스트랩(확장/테이블/RLS/역할)
      const admin = new Pool({ connectionString: process.env.DATABASE_URL });
      await PgVectorStore.bootstrap(admin, dim, role, pw);
      await admin.end();
      // 2) 비-superuser(rag_app) 런타임 풀 — RLS 강제
      const appUrl =
        process.env.DATABASE_URL_APP ??
        (process.env.DATABASE_URL ?? '').replace(/\/\/[^@]+@/, `//${role}:${pw}@`);
      const pool = new Pool({ connectionString: appUrl });
      const store = new PgVectorStore(pool, dim, process.env.TENANT ?? 'default');
      return store;
    }
    return new InMemoryVectorStore();
  },
};

@Module({
  imports: [LlmModule, MetricsModule, AuditModule, AuthModule],
  controllers: [RagController],
  providers: [RagService, vectorStoreProvider],
})
export class RagModule {}
