import { describe, expect, it, beforeEach } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  beforeEach(() => {
    process.env.JWT_SECRET = 'svc-secret';
    auth = new AuthService();
  });

  it('발급 토큰을 헤더에서 컨텍스트로 복원', async () => {
    const token = auth.issue({ sub: 'kim', clearance: 'S', roles: ['hr'] });
    const ctx = await auth.contextFromHeader(`Bearer ${token}`);
    expect(ctx).toBeDefined();
    expect(ctx?.sub).toBe('kim');
    expect(ctx?.clearance).toBe('S');
    expect(ctx?.roles).toEqual(['hr']);
  });

  it('헤더 없음/형식 오류/위조는 undefined', async () => {
    expect(await auth.contextFromHeader(undefined)).toBeUndefined();
    expect(await auth.contextFromHeader('Basic xyz')).toBeUndefined();
    expect(await auth.contextFromHeader('Bearer not.a.jwt')).toBeUndefined();
  });
});
