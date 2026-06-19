# 17차 구현 시험 결과

판정: **PASS** (2026-06-18, Node 20.20.1, pdf-parse)

## 단위 시험 (vitest)
```
Test Files  19 passed (19)
Tests       89 passed (89)   # 기존 78 + csv.spec 7 + loader.spec 4
```

## 통합 시험 (HTTP, multipart)
| # | 결과 | 근거 |
|---|---|---|
| I1 | PASS | CSV → `{docId:staff.csv,chunks:1,type:csv}`, "이름: 김철수, 부서: 인사, 연차: 15" 검색 |
| I2 | PASS | TXT → `type:txt` |
| I3 | PASS | 유효 PDF(Chromium 생성) → `type:pdf`, "연차...30일" 검색 |
| I4 | PASS | 깨진 PDF → 400 "문서 파싱 실패(...bad XRef entry)" (500→400 우아 처리) |
| I5 | PASS | file 누락 → 400 "file 필드 필요" |

## 웹 UI
- 질의 콘솔 인제스천 카드에 파일 업로드 input + FormData. build ✓, KWCAG axe 4/4 PASS.

## 수정 이력
- upload 핸들러 try/catch: 로더 파싱 실패를 500→400(BadRequest)로 변환(깨진 PDF 등).
- 검증용 유효 PDF는 Chromium(page.pdf)로 생성(수제 PDF는 xref 부정확).

## 규제 검증
- 외부 egress 0: 파싱(pdf-parse/csv)·임베딩 전부 로컬. 메모리 처리(디스크 미저장).
- 업로드도 감사로그(action=rag.ingest, detail=upload <type>) 기록.

## PRD Epic 갭 해소
- Epic B(문서 로더) ✅ — PDF/CSV/TXT/MD/한글 텍스트 로더 + 업로드.
- Epic D(문서 업로드 화면) ✅ — 웹 파일 업로드 UI.
