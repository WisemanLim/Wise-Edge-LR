import { describe, expect, it, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('record/list/size, 최신순 반환', () => {
    const a = new AuditService();
    a.record({ action: 'rag.ingest', resource: 'd1' });
    a.record({ action: 'rag.query', resource: 'd1', actor: 'O:' });
    expect(a.size()).toBe(2);
    const list = a.list(10);
    expect(list[0].action).toBe('rag.query'); // 최신 먼저
    expect(list[1].action).toBe('rag.ingest');
    expect(list[0].ts).toBeTruthy();
  });

  it('limit 적용', () => {
    const a = new AuditService();
    for (let i = 0; i < 5; i++) a.record({ action: 'x', resource: String(i) });
    expect(a.list(2).length).toBe(2);
  });

  it('detail 의 PII 는 마스킹되어 저장', () => {
    const a = new AuditService();
    a.record({ action: 'rag.query', detail: '내 번호 010-1234-5678 조회' });
    expect(a.list(1)[0].detail).toBe('내 번호 010-****-**** 조회');
  });

  it('해시체인 검증 통과', () => {
    const a = new AuditService();
    a.record({ action: 'rag.ingest', resource: 'd1' });
    a.record({ action: 'rag.query', resource: 'd1' });
    expect(a.verify()).toEqual({ ok: true });
  });

  it('변조 시 검증 실패', () => {
    const a = new AuditService();
    a.record({ action: 'rag.ingest', resource: 'd1' });
    a.record({ action: 'rag.query', resource: 'd1' });
    // 메모리상 항목 detail 변조 → 해시 불일치
    a.list(2)[1].detail = 'TAMPERED'; // list 는 reverse — 인덱스1 = 첫 항목
    expect(a.verify().ok).toBe(false);
  });

  describe('WORM 파일 영속', () => {
    const path = '/tmp/wedge-audit-test.jsonl';
    afterEach(() => {
      if (existsSync(path)) rmSync(path);
      delete process.env.AUDIT_LOG_PATH;
    });

    it('append 후 재기동 시 로드 + 체인 검증', () => {
      process.env.AUDIT_LOG_PATH = path;
      const a1 = new AuditService();
      a1.record({ action: 'rag.ingest', resource: 'd1' });
      a1.record({ action: 'rag.query', resource: 'd1' });
      // 재기동(파일에서 로드)
      const a2 = new AuditService();
      expect(a2.size()).toBe(2);
      expect(a2.verify()).toEqual({ ok: true });
      // 추가 append 도 체인 연속
      a2.record({ action: 'rag.query', resource: 'd2' });
      expect(a2.verify()).toEqual({ ok: true });
      expect(a2.size()).toBe(3);
    });
  });
});
