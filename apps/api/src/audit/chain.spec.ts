import { describe, expect, it } from 'vitest';
import { canonicalPayload, computeHash, GENESIS, verifyChain } from './chain';

describe('chain', () => {
  it('computeHash 결정적', () => {
    expect(computeHash(GENESIS, 'x')).toBe(computeHash(GENESIS, 'x'));
    expect(computeHash(GENESIS, 'x')).not.toBe(computeHash(GENESIS, 'y'));
  });

  it('canonicalPayload 고정 키 순서', () => {
    const p = canonicalPayload({ ts: 't', action: 'a' });
    expect(p).toBe('{"ts":"t","action":"a","actor":null,"resource":null,"detail":null}');
  });

  it('정상 체인 검증 통과', () => {
    const e1 = { ts: 't1', action: 'a' };
    const p1 = canonicalPayload(e1);
    const h1 = computeHash(GENESIS, p1);
    const e2 = { ts: 't2', action: 'b' };
    const p2 = canonicalPayload(e2);
    const h2 = computeHash(h1, p2);
    const items = [
      { prevHash: GENESIS, hash: h1, payload: p1 },
      { prevHash: h1, hash: h2, payload: p2 },
    ];
    expect(verifyChain(items)).toEqual({ ok: true });
  });

  it('payload 변조 탐지', () => {
    const p1 = canonicalPayload({ ts: 't1', action: 'a' });
    const h1 = computeHash(GENESIS, p1);
    const tampered = [{ prevHash: GENESIS, hash: h1, payload: canonicalPayload({ ts: 't1', action: 'HACKED' }) }];
    expect(verifyChain(tampered).ok).toBe(false);
    expect(verifyChain(tampered).brokenAt).toBe(0);
  });

  it('prevHash 단절 탐지', () => {
    const p1 = canonicalPayload({ ts: 't1', action: 'a' });
    const h1 = computeHash(GENESIS, p1);
    const p2 = canonicalPayload({ ts: 't2', action: 'b' });
    const h2 = computeHash(h1, p2);
    const broken = [
      { prevHash: GENESIS, hash: h1, payload: p1 },
      { prevHash: 'WRONG', hash: h2, payload: p2 },
    ];
    expect(verifyChain(broken)).toEqual({ ok: false, brokenAt: 1 });
  });
});
