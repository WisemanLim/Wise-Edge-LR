import { createHmac, timingSafeEqual } from 'node:crypto';

// 무의존 HS256 JWT (인증/세션 → ACL 등급·역할). 순수 — 외부 라이브러리 불필요.
export interface JwtPayload {
  sub?: string;
  clearance?: 'O' | 'S' | 'C';
  roles?: string[];
  exp?: number; // epoch seconds
  [k: string]: unknown;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function signJwt(payload: JwtPayload, secret: string): string {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64url(JSON.stringify(payload));
  return `${h}.${p}.${sign(`${h}.${p}`, secret)}`;
}

export function verifyJwt(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const [h, p, sig] = parts;
  const expected = sign(`${h}.${p}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('bad signature');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as JwtPayload;
  if (payload.exp != null && now >= payload.exp) throw new Error('token expired');
  return payload;
}
