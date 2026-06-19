# 4차 구현 시험 시나리오 — ACL 접근통제 필터 (govtech)

대상: COMPLIANCE.md 접근통제·누출 차단, AGENTS "RAG 권한(ACL) 필터", N2SF 등급(C/S/O).
검색 결과를 사용자 인가 등급 + 역할로 필터 → 권한 없는 문서 누출 차단.
`/rag/query` body 에 `access:{clearance, roles}` 추가. 문서 metadata.acl 로 분류.

## 단위 시험 (vitest) — acl.spec
| # | 케이스 | 기대 |
|---|---|---|
| U1 | 미분류 = 공개 | true |
| U2 | 등급: 인가≥문서등급 (O<S<C) | C/C true, S/C false 등 |
| U3 | 역할: 제한역할 보유 필요 | admin/admin true, user/admin false |
| U4 | 등급+역할 동시 충족 | 매트릭스 |
| U5 | applyAcl 권한없는 문서 제거 | O→공개만, C→전부 |
| U6 | rag.core queryHybrid + ACL | O 인가 sec 제외, C 인가 sec 포함 |

## 통합 시험 (HTTP, mock)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | `access.clearance=O` 질의 | 기밀(C) 문서 제외, 공개만 |
| I2 | `access.clearance=C` 질의 | 기밀+공개 모두 |

## govtech 규제 연계 (COMPLIANCE.md)
- **크로스 누출 차단**: 인가 등급 부족 사용자에게 기밀 문서 미노출(testing_additions).
- N2SF 등급(C 기밀/S 민감/O 공개) 매핑.
- 후보 확대 후 필터→topK 로 권한 우회(상위 점수 기밀이 채우는) 방지.
