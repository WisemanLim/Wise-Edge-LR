import { createPublicKey, createVerify, KeyObject } from 'node:crypto';
import { AccessContext } from '../rag/acl';

// 외부 IdP/SSO (OIDC) ID 토큰 검증 — RS256 + JWKS. 무의존(node:crypto).
// 표준 IdP(Keycloak/Auth0/Entra)의 공개키(JWK)로 서명 검증 후 클레임을 ACL 컨텍스트로 매핑.

export interface Jwk {
  kty: string;
  n?: string;
  e?: string;
  kid?: string;
  alg?: string;
  use?: string;
}

export function jwkToKey(jwk: Jwk): KeyObject {
  return createPublicKey({ format: 'jwk', key: jwk as unknown as Record<string, unknown> });
}

export interface OidcPayload {
  sub?: string;
  exp?: number;
  iss?: string;
  aud?: string | string[];
  [k: string]: unknown;
}

export function verifyRs256(
  token: string,
  key: KeyObject,
  now = Math.floor(Date.now() / 1000),
): OidcPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const [h, p, s] = parts;
  const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
  if (header.alg !== 'RS256') throw new Error('unexpected alg');
  const v = createVerify('RSA-SHA256');
  v.update(`${h}.${p}`);
  v.end();
  if (!v.verify(key, Buffer.from(s, 'base64url'))) throw new Error('bad signature');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as OidcPayload;
  if (payload.exp != null && now >= payload.exp) throw new Error('token expired');
  return payload;
}

// 점 경로 클레임 접근 (예: 'realm_access.roles' — Keycloak)
export function getClaim(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

export interface ClaimMapConfig {
  rolesClaim?: string; // 기본 'roles'
  clearanceClaim?: string; // 기본 'clearance'
}

export function mapClaims(
  payload: OidcPayload,
  cfg: ClaimMapConfig = {},
): AccessContext & { sub?: string } {
  const rolesRaw = getClaim(payload, cfg.rolesClaim ?? 'roles');
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : undefined;
  const clRaw = getClaim(payload, cfg.clearanceClaim ?? 'clearance');
  const clearance = clRaw === 'O' || clRaw === 'S' || clRaw === 'C' ? clRaw : undefined;
  return { sub: payload.sub, roles, clearance };
}
