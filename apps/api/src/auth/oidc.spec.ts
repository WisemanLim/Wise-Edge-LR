import { describe, expect, it } from 'vitest';
import { createSign, generateKeyPairSync, KeyObject } from 'node:crypto';
import { getClaim, jwkToKey, mapClaims, verifyRs256 } from './oidc';

// RS256 토큰 발급 헬퍼(테스트용 IdP 시뮬레이션)
function signRs256(payload: object, priv: KeyObject): string {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'k1' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const s = createSign('RSA-SHA256');
  s.update(`${h}.${p}`);
  s.end();
  return `${h}.${p}.${s.sign(priv).toString('base64url')}`;
}

describe('oidc', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pubJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1' } as any;

  it('RS256 서명 검증 (JWK→key)', () => {
    const token = signRs256({ sub: 'u1', exp: 9999999999 }, privateKey);
    const key = jwkToKey(pubJwk);
    expect(verifyRs256(token, key, 0).sub).toBe('u1');
  });

  it('변조 토큰 거부', () => {
    const token = signRs256({ sub: 'u1' }, privateKey);
    const bad = token.slice(0, -3) + (token.endsWith('a') ? 'b' : 'a') + 'cd';
    expect(() => verifyRs256(bad, jwkToKey(pubJwk), 0)).toThrow();
  });

  it('만료 거부', () => {
    const token = signRs256({ sub: 'u1', exp: 100 }, privateKey);
    expect(() => verifyRs256(token, jwkToKey(pubJwk), 200)).toThrow(/expired/);
  });

  it('getClaim 중첩 경로', () => {
    expect(getClaim({ realm_access: { roles: ['hr'] } }, 'realm_access.roles')).toEqual(['hr']);
    expect(getClaim({ a: 1 }, 'x.y')).toBeUndefined();
  });

  it('mapClaims 표준/중첩 클레임 매핑', () => {
    expect(mapClaims({ sub: 'u', roles: ['a'], clearance: 'C' })).toEqual({
      sub: 'u',
      roles: ['a'],
      clearance: 'C',
    });
    expect(
      mapClaims({ sub: 'u', realm_access: { roles: ['hr'] }, lvl: 'S' }, {
        rolesClaim: 'realm_access.roles',
        clearanceClaim: 'lvl',
      }),
    ).toEqual({ sub: 'u', roles: ['hr'], clearance: 'S' });
  });
});
