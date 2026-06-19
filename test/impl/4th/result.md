# 4차 구현 시험 결과

판정: **PASS** (2026-06-14, LLM_BACKEND=mock, Node 20.20.1)

## 단위 시험 (vitest)
```
Test Files  7 passed (7)
Tests       32 passed (32)   # 기존 26 + acl.spec 5 + rag.core ACL 1
```

## 통합 시험 (HTTP)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | `access.clearance=O` → 공개 pub 만 반환, 기밀 sec 제외 |
| I2 | PASS | `access.clearance=C` → sec(기밀)+pub 모두 반환 |

## 수정 이력
- 코드 1차 통과(추가 디버깅 없음).

## 규제 검증 (COMPLIANCE.md)
- 크로스 누출 차단: 인가 부족 사용자에게 기밀 문서 미노출 확인.
- 후보 N=max(topK*4,10) 확대 후 ACL 필터 → topK: 상위 점수 기밀이 자리 채워 권한 우회하는 문제 방지.

## 미해결 / 다음 차수
- 인증/세션 연동(현재 body.access 신뢰 — 실제는 JWT/세션에서 등급·역할 도출 필요).
- pgvector 영속화 + RLS(행단위 보안)로 DB 레벨 강제.
- 감사로그(누가 무엇을 조회) — COMPLIANCE.md 감사/로깅 의무.
- 웹 UI 검색모드/권한 컨텍스트 + KWCAG 2.2 접근성.
