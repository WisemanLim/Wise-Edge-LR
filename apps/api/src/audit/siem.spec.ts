import { describe, expect, it } from 'vitest';
import { formatPayload, formatSyslog } from './siem';
import type { AuditEntry } from './audit.service';

const entry: AuditEntry = {
  ts: '2026-06-14T09:00:00.000Z',
  action: 'rag.query',
  actor: 'kim(C)',
  resource: 'sec',
  detail: '연차',
  prevHash: 'p',
  hash: 'h',
};

describe('formatSyslog', () => {
  it('RFC5424 PRI=facility*8+severity, 필드 포함', () => {
    const s = formatSyslog(entry);
    expect(s.startsWith('<110>1 2026-06-14T09:00:00.000Z wise-edge-lr audit - rag.query - ')).toBe(true);
    expect(s).toContain('"hash":"h"');
    expect(s).toContain('"actor":"kim(C)"');
  });
  it('severity/facility 옵션 반영', () => {
    expect(formatSyslog(entry, { facility: 1, severity: 3 }).startsWith('<11>1 ')).toBe(true);
  });
});

describe('formatPayload', () => {
  it('기본 JSON', () => {
    expect(JSON.parse(formatPayload(entry, undefined)).hash).toBe('h');
  });
  it('syslog 선택', () => {
    expect(formatPayload(entry, 'syslog').startsWith('<110>1 ')).toBe(true);
  });
});
