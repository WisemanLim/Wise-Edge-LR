// 감사로그 외부 SIEM 전달 포맷. 순수 — JSON 또는 syslog(RFC5424).
import type { AuditEntry } from './audit.service';

export interface SyslogOptions {
  host?: string;
  app?: string;
  facility?: number; // 기본 13(log audit)
  severity?: number; // 기본 6(info)
}

// RFC5424: <PRI>VERSION TIMESTAMP HOSTNAME APP PROCID MSGID SD MSG
export function formatSyslog(entry: AuditEntry, opts: SyslogOptions = {}): string {
  const facility = opts.facility ?? 13;
  const severity = opts.severity ?? 6;
  const pri = facility * 8 + severity;
  const host = opts.host ?? 'wise-edge-lr';
  const app = opts.app ?? 'audit';
  const msg = JSON.stringify({
    action: entry.action,
    actor: entry.actor ?? null,
    resource: entry.resource ?? null,
    detail: entry.detail ?? null,
    hash: entry.hash,
  });
  return `<${pri}>1 ${entry.ts} ${host} ${app} - ${entry.action} - ${msg}`;
}

export function formatPayload(entry: AuditEntry, format: string | undefined): string {
  return format === 'syslog' ? formatSyslog(entry) : JSON.stringify(entry);
}
