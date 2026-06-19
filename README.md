# Wise-Edge-LR

[English](./README.en.md) · 한국어

저사양·Edge 기반 **온프레미스 LLM/RAG 시스템**. 상용 LLM API(ChatGPT·Gemini)를 대체해 비용·토큰 과금·데이터 외부유출을 제거한다. 1차 목표는 사내 한글 문서 Q&A.

- 스택: `wise-dev-standard / node-next-nest` × 업종 `govtech`(+`ict-saas` 베이스라인)
- 문서: [PRD](.docs/PRD.md) · [COMPLIANCE](COMPLIANCE.md) · [AGENTS](AGENTS.md)

## 1. 아키텍처 / 디렉터리

```
apps/
├── web/   Next.js(App Router) UI                 :3000
│   ├── app/page.tsx        인제스천 + 스트리밍 질의(SSE) — 접근성(skip-link/aria-live)
│   ├── app/dashboard/page.tsx  비용·감사 대시보드(접근성 표/레이블)
│   └── lib/a11y.ts         KWCAG 2.2 자동 점검(lang/alt/label/button/h1, 순수)
└── api/   NestJS RAG 오케스트레이션 + LLM 미들웨어  :3001
    └── src/
        ├── app.controller.ts   GET /health
        ├── llm/                LLM 백엔드 추상화 (PRD §7)
        │   ├── llm.types.ts        LlmBackend 인터페이스(embed/generate)
        │   ├── ollama.backend.ts   온프레미스 Ollama (HTTP, egress 0)
        │   ├── openai-compat.backend.ts  llama.cpp/vLLM/MLX (OpenAI 호환 /v1)
        │   ├── mock.backend.ts     오프라인 결정적(시험용)
        │   └── llm.service.ts      LLM_BACKEND 로 백엔드 선택
        ├── auth/                 인증/세션 (JWT HS256 + 외부 OIDC, 무의존)
        │   ├── jwt.ts            로컬 HS256 sign/verify (node:crypto, 순수)
        │   ├── oidc.ts           외부 IdP OIDC RS256/JWKS 검증 + 클레임 매핑(순수)
        │   ├── auth.service.ts   Bearer → HS256 우선, OIDC 폴백 → AccessContext(등급·역할·sub)
        │   └── auth.controller.ts POST /auth/token (dev 전용)
        ├── common/pii.ts         고유식별정보 마스킹(주민/전화/이메일/카드, 순수)
        ├── audit/                감사로그 (ISMS-P 접근로그)
        │   ├── chain.ts          SHA-256 해시체인(변조탐지, 순수)
        │   ├── audit.service.ts  WORM append-only JSONL + 체인 + PII 마스킹 + SIEM 전달
        │   ├── siem.ts           외부 SIEM 포맷(JSON/syslog RFC5424, 순수)
        │   └── audit.controller.ts GET /audit, /audit/verify
        ├── rag/
        │   ├── loaders/          문서 로더 (PDF/CSV/TXT/MD/한글)
        │   │   ├── csv.ts        CSV 파서 + 열:값 직렬화(순수)
        │   │   └── loader.ts     확장자 디스패치(pdf-parse 동적 import)
        │   ├── chunk.ts          문자 윈도우 청킹(오버랩)
        │   ├── vector-store.ts   VectorStoreLike 포트 + InMemoryVectorStore(cosine, local/test)
        │   ├── pgvector-store.ts pgvector 영속 + 테넌트 RLS(비-superuser 런타임)
        │   ├── bm25.ts           BM25 어휘 검색(한글 토큰화, 순수)
        │   ├── hybrid.ts         RRF 융합(벡터+BM25, 순수)
        │   ├── acl.ts            접근통제 필터(N2SF 등급 C/S/O + 역할, 순수)
        │   ├── rag.core.ts       ingest/query/queryHybrid/buildPrompt (순수 함수)
        │   ├── rag.service.ts    NestJS 래퍼 (retrieve mode=hybrid|vector)
        │   └── rag.controller.ts /rag/documents, /rag/query(SSE)
        └── metrics/              비용/토큰 모니터링 (PRD P1-4, §5)
            ├── tokens.ts         토큰 추정 + 상용 단가표 + 절감 환산(순수)
            ├── baseline.ts       상용 월청구 baseline 대비 절감·capex 회수(순수)
            ├── usage.service.ts  누적 사용량 + baseline 저장(BASELINE_PATH)
            └── metrics.controller.ts /metrics/cost, /pricing, /baseline
```

LLM/임베딩/벡터 검색은 전부 망 내부에서 동작 — 외부 API egress 0 (PRD 성공지표, govtech 규제).

## 2. 사전 요구사항

- Node **≥ 22 권장** (현재 검증 20.20.1). corepack 최신 pnpm·`node:sqlite` 가 Node ≥22 요구.
- pnpm (전역). `packageManager` 핀은 재도입 금지(Node 20에서 자체관리 pnpm 크래시).
- (dev+) Docker — postgres(pgvector)+redis.
- (실 LLM) Ollama + 한글 임베딩/생성 모델. 없으면 `LLM_BACKEND=mock` 로 구동/시험.
  - 임베딩: `ollama pull bge-m3` (1024차원, 한글/다국어). 생성: `llama3.2:3b`(또는 qwen 등).
  - 주의: 생성전용 모델은 `/api/embeddings` 미지원 — 임베딩은 임베딩 모델(bge-m3) 사용.

## 3. 환경 설정

`.env.example` 복사 후 환경별로 채운다. **실 시크릿 커밋 금지**(Vault/Secret Manager 주입).

| 파일 | 환경 | DB | LLM | 기동 명령 |
|---|---|---|---|---|
| `.env.local` | local (기본) | sqlite `file:./local.db` | OLLAMA_BASE_URL=localhost:11434 | `make dev` |
| `.env.dev` | dev | postgres(pgvector)+redis | LLM_BACKEND=ollama, LLM_MODEL=llama3.2:3b | `ENV=dev make dev` |
| `.env.staging` | staging | postgres | 주입 | `ENV=staging make dev` |
| `.env.prod` | prod | 키 목록만(주입 전제) | 주입 | Helm/K8s (아래 참고) |

**`ENV=<환경> make <target>`** — `.env.$(ENV)` 파일을 자동으로 소싱해 API·웹 프로세스에 주입한다. 포트는 별도 오버라이드 가능.

```bash
make dev                                        # .env.local (기본, sqlite + 로컬 Ollama)
ENV=dev make dev                                # .env.dev  (postgres+redis 필요: make up)
ENV=dev make dev WEB_PORT=4000 API_PORT=4001    # 환경 + 포트 오버라이드 동시
ENV=staging make dev                            # .env.staging (staging DB 접속)
```

> **포트 우선순위**: `PORT`(API)·`NEXT_PUBLIC_API_BASE`(웹→API URL)는 Makefile 변수가 env 파일보다 우선 — 포트 충돌 없이 env 파일의 LLM/DB 설정만 가져온다.

주요 변수: `LLM_BACKEND`(ollama|mlx|llamacpp|vllm|mock), `OLLAMA_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL`, `DATABASE_URL`, `NEXT_PUBLIC_API_BASE`, `JWT_SECRET`, `AUTH_DEV_LOGIN`(local만 true), `LOCAL_COST_PER_M`.

**인증**: 로컬 HS256(`JWT_SECRET`, dev=`AUTH_DEV_LOGIN`) + 외부 **OIDC/SSO**. `OIDC_ISSUER` 설정 시 IdP(Keycloak/Auth0/Entra) RS256 ID 토큰을 JWKS 로 검증. 클레임 매핑: `OIDC_ROLES_CLAIM`(예 `realm_access.roles`)·`OIDC_CLEARANCE_CLAIM`. JWKS 는 디스커버리 또는 `OIDC_JWKS` 주입. Bearer 헤더가 body.access 보다 우선.

**멀티런타임**: `LLM_BACKEND=mlx|llamacpp|vllm` 는 OpenAI 호환 `/v1` 백엔드 공유. `OPENAI_BASE_URL` 로 엔드포인트 지정(기본: llamacpp/mlx `:8080/v1`, vllm `:8000/v1`). `LLM_MODEL`/`EMBEDDING_MODEL` 로 모델명.
**임베딩/생성 분리**: `EMBED_BACKEND`(기본=LLM_BACKEND). MLX/llama.cpp 가 임베딩 미제공 시 생성=MLX + 임베딩=ollama(bge-m3) 혼합. 실서버 검증: MLX(`mlx_lm server`) + ollama `/v1`(OpenAI 호환). 셋 다 동일 `/v1` 프로토콜.

**벡터 스토어**: `VECTOR_STORE`(memory|pgvector), `EMBEDDING_DIM`(임베딩 차원, bge-m3=1024/mock=128), `TENANT`, `PG_APP_ROLE`/`PG_APP_PASSWORD`(RLS용 비-superuser 런타임 역할), `DATABASE_URL_APP`(미지정 시 DATABASE_URL 역할 치환).
- pgvector 사용 시: 부트스트랩(확장/테이블/RLS/역할)은 superuser(`DATABASE_URL`)로 1회, CRUD 는 비-superuser(`rag_app`)로 → **superuser 는 RLS 우회하므로 런타임은 반드시 비-superuser**. 테넌트 격리는 `app.tenant` 정책으로 강제(크로스테넌트 누출 차단).

## 4. 실행 방법

### A) 호스트 직접 (권장, 워크스페이스 인식)
```bash
pnpm install                                    # 최초/의존성 변경 시 --no-frozen-lockfile

# --- 환경 선택 ---
make dev                                        # .env.local (기본) — sqlite + 로컬 Ollama
ENV=dev make dev                                # .env.dev  — postgres+redis (make up 선행)
ENV=dev make dev WEB_PORT=4000 API_PORT=4001    # 환경 + 포트 동시 오버라이드

# 포트만 바꿀 때 (env 파일은 기본 .env.local):
make dev WEB_PORT=4000 API_PORT=4001

# mock 백엔드로 API 단독 (Ollama 없을 때):
LLM_BACKEND=mock pnpm --filter @Wise-Edge-LR/api dev
```

### B) Datastore 컨테이너 (dev+)
```bash
make up      # postgres(pgvector)+redis 기동 (docker-compose + override)
# 포트 충돌 시: POSTGRES_PORT=5433 REDIS_PORT=6380 docker compose up -d
# 최초 1회: psql 로 CREATE EXTENSION IF NOT EXISTS vector;
make down
```

### D) 실 Ollama 백엔드 + pgvector (E2E)
```bash
ollama pull bge-m3      # 한글 임베딩(1024d). 생성은 llama3.2:3b 등
VECTOR_STORE=pgvector DATABASE_URL='postgresql://app:app@127.0.0.1:5433/app' \
  EMBEDDING_DIM=1024 LLM_BACKEND=ollama EMBEDDING_MODEL=bge-m3 LLM_MODEL=llama3.2:3b \
  PORT=3001 pnpm --filter @Wise-Edge-LR/api dev
```

### E) MLX(Apple Silicon) 생성 + ollama 임베딩 (혼합 E2E)
```bash
python3 -m venv .mlxvenv --system-site-packages && .mlxvenv/bin/pip install mlx-lm
.mlxvenv/bin/python -m mlx_lm server --model mlx-community/Qwen2.5-0.5B-Instruct-4bit --port 8082
LLM_BACKEND=mlx OPENAI_BASE_URL=http://localhost:8082/v1 LLM_MODEL=mlx-community/Qwen2.5-0.5B-Instruct-4bit \
  EMBED_BACKEND=ollama EMBEDDING_MODEL=bge-m3 PORT=3001 pnpm --filter @Wise-Edge-LR/api dev
# 생성=MLX(로컬 8082), 임베딩=ollama bge-m3. llama.cpp/vLLM 도 OPENAI_BASE_URL 만 바꾸면 동일.
```

### C) local 멀티프로세스 (PM2)
```bash
make run     # ecosystem.config.cjs 로 web+api 데몬
make logs / make ps / make stop
```

## 5. 접속 / 포트

| 서비스 | URL | 포트 | compose 프로파일 | 비고 |
|---|---|---|---|---|
| web | http://localhost:3000 | 3000 | (호스트 dev) | 채팅 UI(`/`) + 대시보드(`/dashboard`) |
| api | http://localhost:3001 | 3001 | (호스트 dev) | NestJS REST + SSE |
| postgres(pgvector) | localhost:5432 | 5432 | default | dev+ |
| redis | localhost:6379 | 6379 | default | dev+ |

## 6. 구현된 API 예시

```bash
# 헬스
curl localhost:3001/health
# → {"status":"ok","service":"wise-edge-lr-api"}

# 인증 토큰 발급 (dev, AUTH_DEV_LOGIN=true) → 세션 등급·역할
TOK=$(curl -s -X POST localhost:3001/auth/token -H 'content-type: application/json' \
  -d '{"sub":"kim","clearance":"C","roles":["hr"]}' | jq -r .token)
# 이후 질의에 헤더로: -H "authorization: Bearer $TOK" (body.access 보다 우선)

# 문서 인제스천 (본문 텍스트). metadata.acl 로 분류 등급/역할 지정 가능
curl -X POST localhost:3001/rag/documents -H 'content-type: application/json' \
  -d '{"id":"policy","text":"연차 휴가는 입사 1년 후 15일이 부여된다.","metadata":{"acl":{"level":"O"}}}'
# → {"docId":"policy","chunks":1}

# 파일 업로드 인제스천 (PDF·CSV·TXT·MD·한글 텍스트, multipart)
curl -X POST localhost:3001/rag/documents/upload -F "file=@./staff.csv"
# → {"docId":"staff.csv","chunks":1,"type":"csv"}   # CSV 는 헤더기반 "열: 값" 직렬화
# 파싱 실패(깨진 PDF 등) → 400, file 누락 → 400

# 문서 목록
curl localhost:3001/rag/documents
# → {"backend":"mock","documents":[{"docId":"policy","chunks":1}]}

# RAG 질의 (SSE 스트리밍, 기본 하이브리드 검색)
curl -N -X POST localhost:3001/rag/query -H 'content-type: application/json' \
  -d '{"question":"연차 휴가 며칠?","topK":2}'           # mode 생략 = hybrid(BM25+벡터 RRF)
curl -N -X POST localhost:3001/rag/query -H 'content-type: application/json' \
  -d '{"question":"연차 휴가","mode":"vector"}'          # 벡터 단독(cosine)
# 접근통제(ACL): JWT 세션 등급/역할로 필터 (N2SF C/S/O). 헤더 우선, 없으면 body.access
curl -N -X POST localhost:3001/rag/query -H 'content-type: application/json' \
  -H "authorization: Bearer $TOK" -d '{"question":"연차"}'
#   → 인가 부족 시 기밀(C) 문서는 결과에서 제외(누출 차단)
# → event: sources \n data: [{...score...}]
#    data: {"token":"..."}  (반복)
#    event: done

# 비용/토큰 모니터링 (누적, 상용 대비 절감)
curl "localhost:3001/metrics/cost?model=gpt-4o"
# → {"model":"gpt-4o","totalTokens":94,"cloudCostUsd":0.00086,
#    "localCostUsd":0.000033,"savedUsd":0.000827,"savedPct":96.2,"queries":2}
curl localhost:3001/metrics/pricing      # 상용 단가표(6개 모델)

# 비용 baseline 실측 (도입 전 상용 월청구 입력 → 절감·capex 회수)
curl -X POST localhost:3001/metrics/baseline -H 'content-type: application/json' \
  -d '{"monthlyUsd":1200,"model":"gpt-4o","capexUsd":3000}'
curl localhost:3001/metrics/baseline
# → {"baselineMonthlyUsd":1200,"localMonthlyUsd":0.02,"savedMonthlyUsd":1199.98,
#    "savedPct":100,"paybackMonths":2.5}

# 감사로그 (누가/무엇을 조회, PII 마스킹됨)
curl "localhost:3001/audit?limit=5"
# → {"total":2,"entries":[{"ts":...,"action":"rag.query","actor":"O:staff",
#    "resource":"pub","detail":"내 번호 010-****-**** 연차 조회","prevHash":"..","hash":".."}, ...]}

# 감사로그 무결성 검증 (해시체인 변조탐지)
curl localhost:3001/audit/verify     # → {"ok":true}  또는 {"ok":false,"brokenAt":N}
```
> `AUDIT_LOG_PATH` 설정 시 append-only JSONL(WORM) 로 영속 + SHA-256 해시체인. 재기동 로드·변조 탐지.
> `SIEM_URL` 설정 시 record 마다 외부 SIEM/WORM 수집기로 비차단 전달(`SIEM_FORMAT=json|syslog`). 전달 실패해도 로컬 기록 유지.

> 비용 모델: `LOCAL_COST_PER_M`(기본 0.35 $/백만토큰, 자가 HW 소유 시 0). `?model=`로 비교 대상 상용 모델 선택.

## 7. 테스트

```bash
pnpm --filter @Wise-Edge-LR/api test       # api 단위 89 (RAG/로더/비용/ACL/감사/인증/pgvector/멀티런타임)
pnpm --filter @Wise-Edge-LR/web test       # web 단위 6 (KWCAG 정적 점검)
pnpm --filter @Wise-Edge-LR/web test:a11y  # KWCAG 라이브 감사 (Playwright+axe, Chromium 필요)
make test                                   # pnpm -r test (전체)
```
시험 차수: [1st](test/impl/1st/)(코어 12) · [2nd](test/impl/2nd/)(비용 19) · [3rd](test/impl/3rd/)(하이브리드 26) · [4th](test/impl/4th/)(ACL 32) · [5th](test/impl/5th/)(감사+PII 41) · [6th](test/impl/6th/)(JWT 48) · [7th](test/impl/7th/)(pgvector+RLS 50) · [8th](test/impl/8th/)(Ollama E2E 한글) · [9th](test/impl/9th/)(웹+KWCAG 6) · [10th](test/impl/10th/)(멀티런타임 56) · [11th](test/impl/11th/)(감사 WORM 64) · [12th](test/impl/12th/)(OIDC/SSO 69) · [13th](test/impl/13th/)(SIEM 73) · [14th](test/impl/14th/)(비용 baseline 77) · [15th](test/impl/15th/)(MLX 실서버 E2E 78) · [16th](test/impl/16th/)(KWCAG 라이브 axe) · [17th](test/impl/17th/)(문서 로더/업로드 89). 환경검증: [test/dev-env](test/dev-env/).

## 8. 트러블슈팅 (실제 만난 이슈)

| 증상 | 원인 | 해결 |
|---|---|---|
| `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` (pnpm install) | `packageManager:"pnpm@N"` 핀 → 자체관리 pnpm 이 Node ≥22 요구 | 핀 제거(전역 pnpm) 또는 Node 22 |
| `ERR_PNPM_OUTDATED_LOCKFILE` | 의존성 추가 후 락 불일치 | `pnpm install --no-frozen-lockfile` |
| `nest start`: TS2307 `Cannot find module 'express'` | `@types/express` 미설치 | Response 대신 구조적 타입 사용(현 코드 반영) |
| `make dev`: Couldn't find `app`/no tsconfig | scaffold 가 소스 스텁만 제공 | 부트스트랩 소스 생성(현 코드) |
| ollama `server does not support embeddings` | 생성전용 모델로 임베딩 호출 | 임베딩 모델(bge-m3) 사용 |
| pg `expected N dimensions, not M` | named volume 의 옛 dim 테이블 잔존 | `DROP TABLE chunks` 후 재부팅(EMBEDDING_DIM 일치) |
| `vector.control not found` / 5432 점유 | 다른 컨테이너가 5432 선점 | `POSTGRES_PORT=5433` 로 분리 기동, 127.0.0.1 사용 |

## 9. 다음 단계 (PRD 잔여)

- pgvector 어댑터로 InMemoryVectorStore 교체(dev+ 영속).
- Ollama 실백엔드 E2E + 한글 임베딩/생성 모델 선정(PRD Open Q).
- ~~비용/토큰 모니터링 API(P1)~~ ✅ 2차 — 웹 대시보드 화면 + baseline 실측 잔여.
- ~~하이브리드 검색(BM25+벡터 RRF)~~ ✅ 3차 — 재랭킹(reranker) 추가 검토.
- ~~ACL 접근통제 필터(N2SF C/S/O)~~ ✅ 4차 — 인증/세션 연동(JWT→등급·역할) 잔여.
- ~~감사로그 + PII 마스킹(ISMS-P)~~ ✅ 5차 — 영속/WORM 보관 잔여.
- ~~인증/세션(JWT→actor·등급)~~ ✅ 6차 — 외부 IdP/SSO 연동, 토큰 갱신 잔여.
- ~~(#2) pgvector 영속화 + RLS~~ ✅ 7차 — 멀티테넌트 풀 분기·임베딩 차원 마이그레이션 잔여.
- ~~(#3) Ollama 실백엔드 E2E + 한글 모델~~ ✅ 8차 (bge-m3 1024 + llama3.2:3b).
- ~~(#4) 웹 UI 대시보드 + **KWCAG 2.2 접근성**~~ ✅ 9차(자동 항목) — 수동 33항목(대비·스크린리더) 라이브 감사 잔여.
- ~~(#5) 멀티런타임(MLX/llama.cpp/vLLM)~~ ✅ 10차 (OpenAI 호환 백엔드) — 각 실서버 추론 E2E 잔여.
- ~~(#6) 감사 WORM 영속~~ ✅ 11차 (append-only + 해시체인) — 외부 WORM/SIEM 연동 잔여.

**사용자 지시 6항목 전부 완료** ✅ (JWT·pgvector+RLS·Ollama E2E·웹+KWCAG·멀티런타임·감사 WORM)

후속 잔여:
- ~~외부 IdP/SSO(OIDC)~~ ✅ 12차 (RS256/JWKS).
- ~~감사 외부 WORM/SIEM 연동~~ ✅ 13차 (HTTP forwarder, json/syslog).
- ~~비용 baseline 실측~~ ✅ 14차 (월청구 입력→절감·capex 회수).
- ~~각 런타임 실서버 추론 E2E~~ ✅ 15차 (MLX Apple Silicon + ollama /v1 실추론).
- ~~KWCAG 수동 33항목 라이브 감사~~ ✅ 16차 (Playwright+axe 자동 항목 통과) — 스크린리더 실청취 등 수동 항목은 정기 점검.

**모든 후속 잔여 항목 완료** ✅ (OIDC·SIEM·비용baseline·실서버 E2E·KWCAG 라이브)

---
_스캐폴딩: wise-dev-standard / node-next-nest. 표준 갱신: `/wise-dev-standard:standardize`._
