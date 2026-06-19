import { Injectable, Logger } from '@nestjs/common';
import { signJwt, verifyJwt, JwtPayload } from './jwt';
import { jwkToKey, Jwk, mapClaims, verifyRs256 } from './oidc';
import { AccessContext } from '../rag/acl';

export interface AuthContext extends AccessContext {
  sub?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
  private readonly oidcIssuer = process.env.OIDC_ISSUER; // 설정 시 외부 IdP 검증 활성
  private jwksCache: Jwk[] | null = null;

  // Authorization: Bearer <jwt> → AccessContext(+sub).
  // 1) 로컬 HS256(dev/세션) 우선 → 2) 실패 시 OIDC RS256(외부 IdP) 검증.
  async contextFromHeader(header?: string): Promise<AuthContext | undefined> {
    if (!header) return undefined;
    const m = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (!m) return undefined;
    const token = m[1];

    try {
      const p = verifyJwt(token, this.secret);
      return { sub: p.sub, clearance: p.clearance, roles: p.roles };
    } catch {
      // HS256 아님 → OIDC 시도
    }

    if (this.oidcIssuer) {
      try {
        const keys = await this.jwks();
        const kid = this.kidOf(token);
        const jwk = keys.find((k) => k.kid === kid) ?? keys[0];
        if (!jwk) return undefined;
        const payload = verifyRs256(token, jwkToKey(jwk));
        return mapClaims(payload, {
          rolesClaim: process.env.OIDC_ROLES_CLAIM,
          clearanceClaim: process.env.OIDC_CLEARANCE_CLAIM,
        });
      } catch (e) {
        this.logger.warn(`OIDC verify failed: ${String(e)}`);
        return undefined;
      }
    }
    return undefined;
  }

  issue(payload: JwtPayload): string {
    return signJwt(payload, this.secret);
  }

  private kidOf(token: string): string | undefined {
    try {
      const h = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
      return h.kid;
    } catch {
      return undefined;
    }
  }

  // JWKS 디스커버리 → jwks_uri → keys. 1회 캐시. 테스트는 OIDC_JWKS(JSON)로 주입 가능.
  private async jwks(): Promise<Jwk[]> {
    if (this.jwksCache) return this.jwksCache;
    if (process.env.OIDC_JWKS) {
      this.jwksCache = (JSON.parse(process.env.OIDC_JWKS) as { keys: Jwk[] }).keys;
      return this.jwksCache;
    }
    const disc = await fetch(`${this.oidcIssuer}/.well-known/openid-configuration`).then((r) => r.json());
    const jwksUri = (disc as { jwks_uri: string }).jwks_uri;
    const set = await fetch(jwksUri).then((r) => r.json());
    this.jwksCache = (set as { keys: Jwk[] }).keys;
    return this.jwksCache;
  }
}
