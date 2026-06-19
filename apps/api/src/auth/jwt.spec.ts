import { describe, expect, it } from 'vitest';
import { signJwt, verifyJwt } from './jwt';

const SECRET = 'test-secret';

describe('jwt', () => {
  it('sign/verify 왕복', () => {
    const t = signJwt({ sub: 'u1', clearance: 'C', roles: ['hr'] }, SECRET);
    const p = verifyJwt(t, SECRET, 0);
    expect(p.sub).toBe('u1');
    expect(p.clearance).toBe('C');
    expect(p.roles).toEqual(['hr']);
  });

  it('변조 토큰은 거부', () => {
    const t = signJwt({ sub: 'u1' }, SECRET);
    const tampered = t.slice(0, -2) + (t.endsWith('a') ? 'b' : 'a');
    expect(() => verifyJwt(tampered, SECRET, 0)).toThrow();
  });

  it('다른 시크릿은 거부', () => {
    const t = signJwt({ sub: 'u1' }, SECRET);
    expect(() => verifyJwt(t, 'other', 0)).toThrow(/signature/);
  });

  it('만료 토큰은 거부', () => {
    const t = signJwt({ sub: 'u1', exp: 100 }, SECRET);
    expect(() => verifyJwt(t, SECRET, 200)).toThrow(/expired/);
    expect(verifyJwt(t, SECRET, 50).sub).toBe('u1');
  });

  it('형식 오류 거부', () => {
    expect(() => verifyJwt('not.a', SECRET, 0)).toThrow(/malformed/);
  });
});
