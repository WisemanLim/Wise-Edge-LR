# 시험 표준 / Testing Standard — Wise-Edge-LR

test-runner 표준. 사이클: 시나리오 작성 → 시험 진행 → 오류 시 수정·재시험 → 시험결과 작성.

```
test/
├── README.md          # 이 문서
├── dev-env/           # 표준 환경 검증 (1회)
│   ├── scenario.md
│   └── logs/
└── impl/<Nth>/        # 구현마다 (implement 가 차수 생성)
```

- 러너: Vitest(unit) + Playwright(e2e). RAG 품질은 Ragas 추가 검토(PRD).
- 로그 원본은 비커밋(.gitignore: `test/**/logs/`).
- govtech 추가 시험은 `COMPLIANCE.md` 의 추가 시험 항목과 연결(KWCAG 2.2 접근성, 고유식별정보 마스킹).
