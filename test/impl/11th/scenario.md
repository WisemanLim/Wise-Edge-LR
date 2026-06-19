# 11차 구현 시험 시나리오 — 감사로그 WORM 영속 (#6)

대상: 사용자 지시 #6 (마지막). 인메모리 → append-only JSONL 파일 영속 + SHA-256 해시체인 변조탐지.
`AUDIT_LOG_PATH` 설정 시 파일 append. `GET /audit/verify` 로 무결성 검증.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | computeHash 결정적, canonicalPayload 고정순서 | chain.spec |
| U2 | verifyChain 정상/payload변조/prev단절 | chain.spec |
| U3 | AuditService 해시체인 verify ok | audit.service.spec |
| U4 | 메모리 변조 시 verify 실패 | audit.service.spec |
| U5 | WORM 파일 append→재기동 로드→체인 연속 | audit.service.spec |

## 통합 시험 (HTTP, AUDIT_LOG_PATH)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | ingest+query → 파일 append | JSONL 2줄, prevHash/hash 필드 |
| I2 | `/audit/verify` | `{ok:true}` |
| I3 | 파일 변조 후 재기동 | total 2 로드, `/audit/verify` `{ok:false,brokenAt:0}` |

## govtech 규제 연계 (COMPLIANCE.md)
- ISMS-P 감사/로깅 의무: WORM(append-only) + 해시체인으로 사후 변조 탐지(불변 감사).
- prod 는 외부 WORM 스토리지/SIEM 연동 권장(파일 chmod a-w 보완).
- PII 마스킹 유지(저장 평문 금지).
