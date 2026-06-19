# 12차 구현 시험 시나리오 — 외부 IdP/SSO (OIDC)

대상: 잔여 #1. 로컬 HS256 외에 외부 IdP(Keycloak/Auth0/Entra) OIDC ID 토큰(RS256/JWKS) 검증.
표준 IdP 공개키로 서명 검증 후 클레임을 ACL 컨텍스트(등급·역할·sub)로 매핑. 무의존(node:crypto).

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | RS256 서명검증(JWK→key) | oidc.spec |
| U2 | 변조/만료 거부 | oidc.spec |
| U3 | getClaim 중첩 경로 | oidc.spec |
| U4 | mapClaims 표준/중첩(realm_access.roles, lvl) | oidc.spec |
| U5 | AuthService contextFromHeader async(HS256) | auth.service.spec |

## 통합 시험 (HTTP, OIDC_JWKS 주입)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | OIDC RS256 토큰(C, hr) query | 기밀+공개 접근 |
| I2 | 감사 actor | `oidc-user(C)` |
| I3 | 위조 토큰 | 검증 실패 → O 기본(공개만) |

## govtech 규제 연계 (COMPLIANCE.md)
- 접근통제: 외부 IdP 표준(OIDC) 연동 → 중앙 신원·SSO, 등급·역할을 서명 토큰에서 도출.
- 위변조 차단(RS256/JWKS), 책임추적성(audit actor=sub).
- 비밀(JWT_SECRET/IdP) Vault 주입. JWKS 디스커버리 또는 OIDC_JWKS 주입.
