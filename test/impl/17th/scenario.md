# 17차 구현 시험 시나리오 — 문서 로더 + 파일 업로드 (PRD Epic B/D 갭)

대상: PRD §3-1·§4·§7 "문서 로더(PDF/CSV/한글 문서) 업로드". 기존엔 본문 텍스트만 인제스천.
형식별 로더(CSV/TXT/MD/PDF/한글 텍스트) + multipart 업로드 API + 웹 업로드 UI.

## 단위 시험 (vitest)
| # | 케이스 | 기대 |
|---|---|---|
| U1 | parseCsv 따옴표/개행/이스케이프/빈줄 | csv.spec |
| U2 | csvToText 헤더기반 열:값 | csv.spec |
| U3 | extOf 확장자 추출 | loader.spec |
| U4 | loadDocument CSV/TXT/폴백 | loader.spec |

## 통합 시험 (HTTP, multipart)
| # | 케이스 | 기대 |
|---|---|---|
| I1 | CSV 업로드 | `{docId,chunks,type:csv}`, 열:값 직렬화 검색 |
| I2 | TXT 업로드 | `type:txt` |
| I3 | PDF 업로드(유효) | `type:pdf`, 본문 검색 |
| I4 | PDF(깨짐) | 400 우아 처리(파싱 실패) |
| I5 | file 누락 | 400 |

## 웹 UI
- 질의 콘솔 인제스천 카드에 파일 input(accept pdf/csv/txt/md...) + FormData 업로드. a11y 유지(label, role=status).

## govtech 규제 연계
- 외부 egress 0: 파싱·임베딩 전부 로컬. 업로드 파일 메모리 처리.
- 업로드도 감사로그 기록(action=rag.ingest, detail=upload <type>).
