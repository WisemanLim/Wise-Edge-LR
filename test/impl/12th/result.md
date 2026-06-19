# 12차 구현 시험 결과

판정: **PASS** (2026-06-14, Node 20.20.1)

## 단위 시험 (vitest)
```
Test Files  15 passed (15)
Tests       69 passed (69)   # 기존 64 + oidc.spec 5 (auth.service.spec async 전환)
```

## 통합 시험 (HTTP, OIDC_ISSUER + OIDC_JWKS 주입)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | OIDC RS256 토큰(realm_access.roles=hr, lvl=C) query → `['sec','pub']`(기밀 접근) |
| I2 | PASS | 감사 actor `oidc-user(C)` |
| I3 | PASS | 위조 토큰(`...XX`) → 검증 실패 → O 기본 → `['pub']`(공개만) |

## 수정 이력
- `contextFromHeader` 동기→비동기(OIDC JWKS 검증). rag.controller await, auth.service.spec await 전환. 회귀 없음.

## 규제 검증 (COMPLIANCE.md)
- 외부 IdP 표준 OIDC(SSO) 연동: 중앙 신원, 등급·역할을 서명 토큰(RS256)에서 도출 → 위변조 차단.
- 클레임 매핑 설정화(OIDC_ROLES_CLAIM/CLEARANCE_CLAIM) — Keycloak realm_access.roles 등 호환.
- JWKS 디스커버리 또는 OIDC_JWKS 주입. 비밀 Vault 주입.

## 잔여 (사용자 지시 5개 중)
- 각 런타임 실서버 추론 E2E (llama.cpp/vLLM/MLX 서버 기동 필요).
- KWCAG 수동 33항목 라이브 감사 (axe/Playwright/스크린리더).
- 감사 외부 WORM/SIEM 연동 (syslog/HTTP forwarder).
- 비용 baseline 실측 (상용 월청구 입력·저장).
