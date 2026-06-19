# 6차 구현 시험 시나리오 — 인증/세션 (JWT → actor·등급)

대상: 사용자 지시 #1. JWT(HS256) 세션 → ACL 인가 등급·역할의 신뢰 출처.
`Authorization: Bearer <jwt>` 가 body.access 보다 우선. 감사 actor 를 JWT sub 로.
dev 토큰 발급 `POST /auth/token`(AUTH_DEV_LOGIN=true). 무의존 — node:crypto HMAC.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | signJwt/verifyJwt 왕복 | jwt.spec |
| U2 | 변조/다른시크릿/만료/형식오류 거부 | jwt.spec |
| U3 | AuthService 토큰→컨텍스트 복원 | auth.service.spec |
| U4 | 헤더 없음/형식오류/위조 → undefined | auth.service.spec |

## 통합 시험 (HTTP, mock)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | `POST /auth/token` clearance=C | JWT 발급 |
| I2 | Bearer C 토큰으로 query | 기밀(C)+공개 모두 반환 |
| I3 | 무토큰 query | O 기본 → 기밀 제외 |
| I4 | 감사 actor | 토큰=`kim(C)`, 무토큰=`O:` |

## govtech 규제 연계 (COMPLIANCE.md)
- 접근통제: 등급·역할을 클라이언트 신뢰(body) 대신 **서명된 JWT** 에서 도출 → 위변조 차단.
- 감사로그 actor 를 인증 주체(sub)로 기록 → 책임추적성.
- dev 토큰 발급은 AUTH_DEV_LOGIN 게이트(prod 비활성). 시크릿 Vault 주입.
