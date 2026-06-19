# 5차 구현 시험 시나리오 — 감사로그 + PII 마스킹 (govtech)

대상: COMPLIANCE.md ISMS-P 접근로그·감사 의무, testing_additions "고유식별정보 암호화·마스킹 검증".
RAG ingest/query 시 감사로그 기록. 질문 등 자유텍스트의 주민번호·전화·이메일·카드 마스킹 후 저장.
`GET /audit?limit=` 로 조회.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | maskPii 주민번호/전화/이메일/카드 | pii.spec |
| U2 | PII 없는 문장 보존, hasPii 탐지 | pii.spec |
| U3 | AuditService record/list 최신순/limit | audit.service.spec |
| U4 | detail PII 마스킹되어 저장 | audit.service.spec |

## 통합 시험 (HTTP, mock)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | ingest → query(PII 포함) → `GET /audit` | 2건 기록, action ingest/query |
| I2 | query detail 마스킹 | 질문 내 `010-1234-5678` → `010-****-****` |
| I3 | actor 기록 | `O:staff` (등급:역할) |

## govtech 규제 연계 (COMPLIANCE.md)
- 감사/로깅 의무: 누가(actor) 무엇을(resource) 조회했는지 불변 기록(인메모리 → dev+ WORM/DB).
- 고유식별정보 마스킹: 감사로그에 PII 평문 미저장.
- 데이터 외부 전송 0 유지(로컬 기록).
