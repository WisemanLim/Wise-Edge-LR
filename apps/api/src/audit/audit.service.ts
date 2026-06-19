import { Injectable, Logger } from '@nestjs/common';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { maskPii } from '../common/pii';
import { canonicalPayload, computeHash, GENESIS, verifyChain } from './chain';
import { formatPayload } from './siem';

export interface AuditInput {
  action: string; // 예: rag.query, rag.ingest
  actor?: string; // 사용자 식별(등급:역할)
  resource?: string; // 대상(docId, docIds)
  detail?: string; // 자유 텍스트(질문 등) — PII 마스킹 적용
}

export interface AuditEntry extends AuditInput {
  ts: string;
  prevHash: string;
  hash: string;
}

// 감사로그 (ISMS-P 접근로그·감사 의무) + WORM 영속(append-only JSONL) + 해시체인 변조탐지.
// AUDIT_LOG_PATH 설정 시 파일에 append. 미설정 시 인메모리만.
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private logs: AuditEntry[] = [];
  private readonly max = 1000;
  private lastHash = GENESIS;
  private readonly path = process.env.AUDIT_LOG_PATH;
  private readonly siemUrl = process.env.SIEM_URL; // 외부 SIEM/WORM 수집기(HTTP)
  private readonly siemFormat = process.env.SIEM_FORMAT; // json(기본) | syslog

  constructor() {
    if (this.path && existsSync(this.path)) {
      const lines = readFileSync(this.path, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        const e = JSON.parse(line) as AuditEntry;
        this.logs.push(e);
        this.lastHash = e.hash;
      }
      if (this.logs.length > this.max) this.logs = this.logs.slice(-this.max);
    }
  }

  record(input: AuditInput): AuditEntry {
    const core = {
      ts: new Date().toISOString(),
      action: input.action,
      actor: input.actor,
      resource: input.resource,
      detail: input.detail != null ? maskPii(input.detail) : undefined,
    };
    const payload = canonicalPayload(core);
    const prevHash = this.lastHash;
    const hash = computeHash(prevHash, payload);
    const entry: AuditEntry = { ...core, prevHash, hash };

    this.logs.push(entry);
    if (this.logs.length > this.max) this.logs.shift();
    this.lastHash = hash;
    if (this.path) appendFileSync(this.path, JSON.stringify(entry) + '\n'); // WORM: append-only
    if (this.siemUrl) void this.forward(entry); // 외부 SIEM 전달(비차단)
    return entry;
  }

  // 외부 SIEM/WORM 수집기로 전달(fire-and-forget, 실패해도 로컬 기록은 유지).
  private async forward(entry: AuditEntry): Promise<void> {
    try {
      const isSyslog = this.siemFormat === 'syslog';
      await fetch(this.siemUrl as string, {
        method: 'POST',
        headers: { 'content-type': isSyslog ? 'text/plain' : 'application/json' },
        body: formatPayload(entry, this.siemFormat),
      });
    } catch (e) {
      this.logger.warn(`SIEM forward failed: ${String(e)}`);
    }
  }

  list(limit = 50): AuditEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  size(): number {
    return this.logs.length;
  }

  // 해시체인 무결성 검증(사후 변조 탐지)
  verify(): { ok: boolean; brokenAt?: number } {
    return verifyChain(
      this.logs.map((e) => ({ prevHash: e.prevHash, hash: e.hash, payload: canonicalPayload(e) })),
    );
  }
}
