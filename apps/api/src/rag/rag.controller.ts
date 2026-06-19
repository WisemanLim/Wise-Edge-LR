import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RagService } from './rag.service';
import { UsageService } from '../metrics/usage.service';
import { estimateTokens } from '../metrics/tokens';
import { AccessContext } from './acl';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { loadDocument } from './loaders/loader';

// multer 파일의 구조적 부분집합
interface UploadFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}

// express Response 의 구조적 부분집합(@types/express 의존 회피)
interface SseResponse {
  setHeader(name: string, value: string): void;
  write(chunk: string): void;
  end(): void;
}

interface IngestDto {
  id?: string;
  text: string;
  metadata?: Record<string, unknown>;
}

interface QueryDto {
  question: string;
  topK?: number;
  mode?: 'hybrid' | 'vector';
  access?: AccessContext; // 사용자 인가 등급(C/S/O) + 역할 → ACL 필터
}

@Controller('rag')
export class RagController {
  constructor(
    private readonly rag: RagService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  // 문서 인제스천: text → 청킹 → 임베딩 → 벡터스토어 (PRD P0-1)
  @Post('documents')
  async ingest(@Body() body: IngestDto) {
    const id = body.id ?? `doc-${Date.now()}`;
    const result = await this.rag.ingest(id, body.text ?? '', body.metadata);
    this.audit.record({ action: 'rag.ingest', resource: id, detail: `chunks=${result.chunks}` });
    return result;
  }

  // 파일 업로드 인제스천: 문서 로더(PDF/CSV/TXT/MD/한글) → 텍스트 → 청킹 → 임베딩 (PRD Epic B/D)
  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: UploadFile,
    @Body() body: { id?: string; metadata?: string },
  ) {
    if (!file) throw new BadRequestException('file 필드 필요(multipart/form-data)');
    let loaded;
    try {
      loaded = await loadDocument(file.originalname, file.buffer);
    } catch (e) {
      throw new BadRequestException(`문서 파싱 실패(${file.originalname}): ${String(e)}`);
    }
    const id = body.id ?? file.originalname;
    const meta = {
      filename: file.originalname,
      type: loaded.type,
      ...(body.metadata ? JSON.parse(body.metadata) : {}),
    };
    const result = await this.rag.ingest(id, loaded.text, meta);
    this.audit.record({
      action: 'rag.ingest',
      resource: id,
      detail: `upload ${loaded.type} chunks=${result.chunks}`,
    });
    return { ...result, type: loaded.type };
  }

  @Get('documents')
  async list() {
    return { backend: this.rag.backendName(), documents: await this.rag.documents() };
  }

  // RAG 검색 + LLM 응답(SSE 스트리밍) (PRD P0-2)
  @Post('query')
  async query(
    @Body() body: QueryDto,
    @Res() res: SseResponse,
    @Headers('authorization') authHeader?: string,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // JWT 세션(로컬 HS256 또는 외부 OIDC)이 있으면 등급·역할의 신뢰 출처 — body.access 보다 우선.
    const session = await this.auth.contextFromHeader(authHeader);
    const ctx = session ?? body.access;
    let hits: Awaited<ReturnType<RagService['retrieve']>> = [];
    let prompt = '';
    let completion = '';
    // 검색(임베딩)·생성 전체를 감싸 백엔드 장애 시에도 SSE 로 우아하게 보고.
    try {
      hits = await this.rag.retrieve(body.question, body.topK ?? 4, body.mode ?? 'hybrid', ctx);
      res.write(`event: sources\ndata: ${JSON.stringify(hits)}\n\n`);
      prompt = this.rag.buildPrompt(body.question, hits);
      for await (const token of this.rag.generate(prompt)) {
        completion += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    } catch (e) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: String(e) })}\n\n`);
    }
    this.usage.record(estimateTokens(prompt), estimateTokens(completion));
    const actor = session?.sub
      ? `${session.sub}(${session.clearance ?? 'O'})`
      : `${ctx?.clearance ?? 'O'}:${(ctx?.roles ?? []).join(',')}`;
    this.audit.record({
      action: 'rag.query',
      actor,
      resource: hits.map((h) => h.docId).join(','),
      detail: body.question, // PII 마스킹 적용됨(AuditService)
    });
    res.write('event: done\ndata: {}\n\n');
    res.end();
  }
}
