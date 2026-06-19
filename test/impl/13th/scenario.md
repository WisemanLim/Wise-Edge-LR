# 13차 구현 시험 시나리오 — 감사 외부 WORM/SIEM 연동 (잔여 #1)

대상: 감사로그를 외부 SIEM/WORM 수집기로 비차단 전달. `SIEM_URL` 설정 시 record 마다 HTTP POST.
포맷 `SIEM_FORMAT=json|syslog`(RFC5424). 무의존(fetch). 로컬 WORM 기록은 그대로 유지.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | formatSyslog RFC5424 PRI/필드 | siem.spec |
| U2 | facility/severity 옵션 | siem.spec |
| U3 | formatPayload json/syslog 선택 | siem.spec |

## 통합 시험 (HTTP, mock SIEM 수신기 :9999)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | ingest+query → SIEM 전달 | 수신 2건 |
| I2 | syslog 포맷 | `<110>1 ... rag.query ... "hash":..` |
| I3 | 비차단 | API 응답 정상(전달 실패해도 로컬 유지) |

## govtech 규제 연계 (COMPLIANCE.md)
- ISMS-P 감사: 외부 불변 수집(SIEM/WORM)으로 내부 변조 위험 차단·중앙 모니터링.
- 해시 포함 전달 → 원본-수집본 대조 가능.
- PII 마스킹 유지(전달 페이로드도 마스킹된 detail).
