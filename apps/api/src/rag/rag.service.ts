import { Inject, Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { SearchHit, VectorStoreLike } from './vector-store';
import { buildPrompt, ingestInto, IngestResult, queryHybrid, queryStore } from './rag.core';
import { AccessContext } from './acl';

export const VECTOR_STORE = 'VECTOR_STORE';
export type RetrieveMode = 'hybrid' | 'vector';

@Injectable()
export class RagService {
  constructor(
    private readonly llm: LlmService,
    @Inject(VECTOR_STORE) private readonly store: VectorStoreLike,
  ) {}

  ingest(docId: string, text: string, metadata?: Record<string, unknown>): Promise<IngestResult> {
    return ingestInto(this.store, this.llm, docId, text, { metadata });
  }

  documents(): { docId: string; chunks: number }[] | Promise<{ docId: string; chunks: number }[]> {
    return this.store.documents();
  }

  retrieve(
    question: string,
    topK = 4,
    mode: RetrieveMode = 'hybrid',
    access?: AccessContext,
  ): Promise<SearchHit[]> {
    return mode === 'hybrid'
      ? queryHybrid(this.store, this.llm, question, topK, 10, access)
      : queryStore(this.store, this.llm, question, topK, access);
  }

  buildPrompt(question: string, hits: SearchHit[]): string {
    return buildPrompt(question, hits);
  }

  generate(prompt: string): AsyncIterable<string> {
    return this.llm.generate(prompt);
  }

  backendName(): string {
    return this.llm.name;
  }
}
