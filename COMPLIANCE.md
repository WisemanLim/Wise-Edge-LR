# COMPLIANCE — 공공행정·공공SI (GovTech, KSIC O)

> 자동 생성. 근거: `domains/govtech.yaml` (+ `ict-saas.yaml` 베이스라인) + KSIC 통합표.
> 규제는 변하므로 References 로 재확인. ict-saas(J) 가 항상 베이스, govtech(O) 가 델타.

## 분류 / Classification
- KSIC **O** (공공행정·국방·사회보장) · ISIC O / NACE O / NAICS 92
- 베이스라인: KSIC **J** (정보통신·SaaS) · NAICS 51

## 한국 규제 (1순위)

| 규제 | 시행/버전 | 영향 |
|---|---|---|
| 전자정부법 | — | 표준화·상호운용·재사용 가능 공공SW 의무 |
| 전자정부 표준프레임워크(eGovFrame) | v4.3 (JDK17) | 공공사업 사실상 표준, 모던 스택도 정합 필요 |
| CSAP(클라우드 보안인증) | 2026 완화 | N2SF 등급제 전환, 2026부터 보안적합성 검증으로 진입 |
| 정보시스템 구축·운영 지침(MOIS 2025-1) | 2025-01-02 | 구축·운영·보안·조달 규칙 |
| 개인정보보호법(PIPA) | — | 주민 PII(주민번호/주소) 처리·접근로그·최소수집 |
| 공공데이터법 | — | 오픈 API/데이터셋 공개 요구 |
| 웹접근성 / KWCAG 2.2 | 2022-12-28 개정 | 접근성 인증 필수(디지털포용법·차별금지법) |
| (베이스) 정보통신망법 §47 / ISMS-P | 3년 주기 | 정보보호 의무, 접근로그·변경관리·암호화 증적 |
| (베이스) 개인정보 유출통지 PIPA §32-2 | — | PII 동의·최소화·유출통지 |

## 국제 기준
- WCAG 2.1/2.2 (ARIA, 대비, 키보드, 스크린리더)
- FedRAMP-analog → CSAP/N2SF (데이터 등급별 인가)
- (베이스) SOC 2 Type II, ISO/IEC 27001, GDPR

## 데이터 등급 / Data Classes

| 데이터 | 등급 | 비고 |
|---|---|---|
| 행정정보 | 규제대상 | N2SF 등급(C/S/O) |
| 주민 PII(주민번호/주소) | 규제대상 | PIPA |
| 사회보장/급여 데이터 | 규제대상 | 민감 |
| 국방 관련 기밀 | 규제대상 | N2SF C 등급 |
| (베이스) 테넌트/사내 문서 | 민감 | RLS/스키마 격리 |
| (베이스) 감사로그/텔레메트리 | 내부 | SOC2/ISO 보관·삭제정책 |

> **규제대상 데이터는 비-프로덕션(dev/staging/test)에 실데이터 반입 금지.** 합성/마스킹 데이터만 사용.

## 인프라 패턴
- 망분리 → N2SF 등급(C/S/O) 분리, 온프렘·프라이빗 공공클라우드
- CSAP 인증 공공클라우드(2026 완화), 감사/로깅 의무
- PaaS-TA / Cloud Foundry 공공 워크로드
- (베이스) 멀티테넌트 격리(RLS/스키마/DB-per-tenant), OTel 관측성, 시크릿 관리
- **본 시스템 특수**: LLM/임베딩·벡터DB 전부 망 내부 구동, 외부 API egress 0 (PRD 성공지표)

## 개발환경 특수 요구
- 접근성 테스트(KWCAG 2.2/WCAG 자동+수동 스크린리더)
- eGovFrame 호환·버전 정합 점검, 내부 Maven/Nexus 미러
- 망분리 dev 제약(격리 dev/build), 보안적합성 검증 준비

## 추가 시험 (test/ 반영)
- KWCAG 2.2 33항목 접근성 자동 점검 + 스크린리더 수동
- 주민번호 등 고유식별정보 암호화·마스킹 검증
- 공공데이터 오픈 API 스키마/응답 적합성
- (베이스) 크로스테넌트 데이터 누출 차단(RLS), OpenAPI 계약 적합성, 감사로그 보관기간 경과 삭제 증명

## 주의 — 스택 정합성
- govtech는 eGovFrame(Spring/Java)가 사실상 공공조달 표준. 본 프로젝트는 node-next-nest 채택 →
  **공공 납품/조달이면 eGovFrame 정합 또는 예외 승인 필요**. 순수 온프레미스 사내 시스템이면 무방.

## 출처 / References
- https://www.egovframe.go.kr/wiki/doku.php?id=egovframework:dev4.3:gettingstarted
- https://github.com/eGovFramework
- https://zdnet.co.kr/view/?no=20250124164856 (N2SF 국가망보안체계)
- https://www.etnews.com/20251212000235 (CSAP 2026 완화)
- https://a11ykr.github.io/kwcag22/ (KWCAG 2.2)
- https://www.krds.go.kr/html/site/utility/utility_04.html (KRDS)
- https://isms-p.or.kr (ISMS-P) · https://isms.kisa.or.kr/main/csap/notice/ (CSAP)
