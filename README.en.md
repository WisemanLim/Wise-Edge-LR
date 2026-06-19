# Wise-Edge-LR

English · [한국어](./README.md)

A low-spec / edge-based **on-premise LLM/RAG system**. Replaces commercial LLM APIs (ChatGPT, Gemini) to remove per-token billing and data egress. First goal: internal Korean-document Q&A.

- Stack: `wise-dev-standard / node-next-nest` × domain `govtech` (+ `ict-saas` baseline)
- Docs: [PRD](.docs/PRD.md) · [COMPLIANCE](COMPLIANCE.md) · [AGENTS](AGENTS.md)

## 1. Architecture / Layout

```
apps/
├── web/   Next.js (App Router) UI                  :3000
│   ├── app/page.tsx        ingestion + streaming query (SSE) — a11y (skip-link/aria-live)
│   ├── app/dashboard/page.tsx  cost·audit dashboard (accessible tables/labels)
│   └── lib/a11y.ts         KWCAG 2.2 static audit (lang/alt/label/button/h1, pure)
└── api/   NestJS RAG orchestration + LLM middleware  :3001
    └── src/
        ├── app.controller.ts   GET /health
        ├── llm/                LLM backend abstraction (PRD §7)
        │   ├── llm.types.ts        LlmBackend interface (embed/generate)
        │   ├── ollama.backend.ts   on-prem Ollama (HTTP, zero egress)
        │   ├── openai-compat.backend.ts  llama.cpp/vLLM/MLX (OpenAI-compatible /v1)
        │   ├── mock.backend.ts     offline deterministic (tests)
        │   └── llm.service.ts      selects backend via LLM_BACKEND
        ├── auth/                 auth/session (JWT HS256 + external OIDC, dep-free)
        │   ├── jwt.ts            local HS256 sign/verify (node:crypto, pure)
        │   ├── oidc.ts           external IdP OIDC RS256/JWKS verify + claim mapping (pure)
        │   ├── auth.service.ts   Bearer → HS256 first, OIDC fallback → AccessContext
        │   └── auth.controller.ts POST /auth/token (dev only)
        ├── common/pii.ts         PII masking (RRN/phone/email/card, pure)
        ├── audit/                audit log (ISMS-P access log)
        │   ├── chain.ts          SHA-256 hash chain (tamper detection, pure)
        │   ├── audit.service.ts  WORM append-only JSONL + chain + PII masking + SIEM forward
        │   ├── siem.ts           external SIEM format (JSON/syslog RFC5424, pure)
        │   └── audit.controller.ts GET /audit, /audit/verify
        ├── rag/
        │   ├── loaders/          document loaders (PDF/CSV/TXT/MD/Korean)
        │   │   ├── csv.ts        CSV parser + col:value serialization (pure)
        │   │   └── loader.ts     extension dispatch (dynamic pdf-parse import)
        │   ├── chunk.ts          char-window chunking (overlap)
        │   ├── vector-store.ts   VectorStoreLike port + InMemoryVectorStore (cosine, local/test)
        │   ├── pgvector-store.ts pgvector persistence + tenant RLS (non-superuser runtime)
        │   ├── bm25.ts           BM25 lexical search (Korean tokenizer, pure)
        │   ├── hybrid.ts         RRF fusion (vector + BM25, pure)
        │   ├── acl.ts            access control filter (N2SF C/S/O + roles, pure)
        │   ├── rag.core.ts       ingest/query/queryHybrid/buildPrompt (pure fns)
        │   ├── rag.service.ts    NestJS wrapper (retrieve mode=hybrid|vector)
        │   └── rag.controller.ts /rag/documents, /rag/query (SSE)
        └── metrics/              cost/token monitoring (PRD P1-4, §5)
            ├── tokens.ts         token estimate + cloud pricing + savings (pure)
            ├── baseline.ts       savings vs cloud monthly baseline + capex payback (pure)
            ├── usage.service.ts  cumulative usage + baseline store (BASELINE_PATH)
            └── metrics.controller.ts /metrics/cost, /pricing, /baseline
```

All LLM / embedding / vector search runs inside the network — zero external egress (PRD success metric, govtech compliance).

## 2. Prerequisites

- Node **≥ 22 recommended** (verified on 20.20.1). corepack pnpm & `node:sqlite` need Node ≥22.
- pnpm (global). Do NOT re-add a `packageManager` pin (self-managed pnpm crashes on Node 20).
- (dev+) Docker — postgres (pgvector) + redis.
- (real LLM) Ollama + Korean embedding/generation models. Otherwise run/test with `LLM_BACKEND=mock`.
  - Embedding: `ollama pull bge-m3` (1024d, multilingual). Generation: `llama3.2:3b` (or qwen, etc.).
  - Note: generation-only models reject `/api/embeddings` — use an embedding model (bge-m3).

## 3. Configuration

Copy `.env.example` and fill per environment. **Never commit real secrets** (inject via Vault/Secret Manager).

| Env | DB | LLM |
|---|---|---|
| `.env.local` | sqlite `file:./local.db` | OLLAMA_BASE_URL=localhost:11434 |
| `.env.dev` | postgres (pgvector) + redis | LLM_BACKEND=ollama |
| `.env.staging` | postgres | injected |
| `.env.prod` | keys only (injected) | injected |

Key vars: `LLM_BACKEND` (ollama|mlx|llamacpp|vllm|mock), `OLLAMA_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL`, `DATABASE_URL`, `NEXT_PUBLIC_API_BASE`, `JWT_SECRET`, `AUTH_DEV_LOGIN` (local only), `LOCAL_COST_PER_M`.

**Auth**: local HS256 (`JWT_SECRET`, dev=`AUTH_DEV_LOGIN`) + external **OIDC/SSO**. With `OIDC_ISSUER`, IdP (Keycloak/Auth0/Entra) RS256 ID tokens are verified via JWKS. Claim mapping: `OIDC_ROLES_CLAIM` (e.g. `realm_access.roles`) / `OIDC_CLEARANCE_CLAIM`. JWKS via discovery or `OIDC_JWKS`. Bearer header takes priority over body.access.

**Multi-runtime**: `LLM_BACKEND=mlx|llamacpp|vllm` share one OpenAI-compatible `/v1` backend. Set `OPENAI_BASE_URL` (defaults: llamacpp/mlx `:8080/v1`, vllm `:8000/v1`); `LLM_MODEL`/`EMBEDDING_MODEL` for model names.
**Split embed/gen**: `EMBED_BACKEND` (default=LLM_BACKEND). When MLX/llama.cpp lack embeddings, mix generation=MLX + embedding=ollama(bge-m3). Verified on real servers: MLX (`mlx_lm server`) + ollama `/v1`. All three share the same `/v1` protocol.

**Vector store**: `VECTOR_STORE` (memory|pgvector), `EMBEDDING_DIM` (bge-m3=1024/mock=128), `TENANT`, `PG_APP_ROLE`/`PG_APP_PASSWORD` (non-superuser runtime role for RLS), `DATABASE_URL_APP`.
- With pgvector: bootstrap (extension/table/RLS/role) runs once as superuser (`DATABASE_URL`); CRUD runs as the non-superuser (`rag_app`) — **superuser bypasses RLS, so runtime must be non-superuser**. Tenant isolation enforced via the `app.tenant` policy (cross-tenant leak prevention).

## 4. Running

### A) Host direct (recommended, workspace-aware)
```bash
pnpm install                 # first time / dep change: --no-frozen-lockfile
make dev                     # web :3000, api :3001 (per-process PORT, Ctrl-C stops both)
make dev WEB_PORT=4000 API_PORT=4001   # override ports (web→api base auto-wired)
# or api alone with mock backend:
LLM_BACKEND=mock pnpm --filter @Wise-Edge-LR/api dev
```

### B) Datastore container (dev+)
```bash
make up      # postgres(pgvector)+redis (docker-compose + override)
# on port conflict: POSTGRES_PORT=5433 REDIS_PORT=6380 docker compose up -d
# once: psql → CREATE EXTENSION IF NOT EXISTS vector;
make down
```

### D) Real Ollama backend + pgvector (E2E)
```bash
ollama pull bge-m3      # Korean embedding (1024d). Generation: llama3.2:3b etc.
VECTOR_STORE=pgvector DATABASE_URL='postgresql://app:app@127.0.0.1:5433/app' \
  EMBEDDING_DIM=1024 LLM_BACKEND=ollama EMBEDDING_MODEL=bge-m3 LLM_MODEL=llama3.2:3b \
  PORT=3001 pnpm --filter @Wise-Edge-LR/api dev
```

### E) MLX (Apple Silicon) generation + ollama embedding (mixed E2E)
```bash
python3 -m venv .mlxvenv --system-site-packages && .mlxvenv/bin/pip install mlx-lm
.mlxvenv/bin/python -m mlx_lm server --model mlx-community/Qwen2.5-0.5B-Instruct-4bit --port 8082
LLM_BACKEND=mlx OPENAI_BASE_URL=http://localhost:8082/v1 LLM_MODEL=mlx-community/Qwen2.5-0.5B-Instruct-4bit \
  EMBED_BACKEND=ollama EMBEDDING_MODEL=bge-m3 PORT=3001 pnpm --filter @Wise-Edge-LR/api dev
# generation=MLX (local 8082), embedding=ollama bge-m3. llama.cpp/vLLM: just change OPENAI_BASE_URL.
```

### C) local multi-process (PM2)
```bash
make run     # web+api daemons via ecosystem.config.cjs
make logs / make ps / make stop
```

## 5. Endpoints / Ports

| Service | URL | Port | compose profile | Note |
|---|---|---|---|---|
| web | http://localhost:3000 | 3000 | (host dev) | chat UI (`/`) + dashboard (`/dashboard`) |
| api | http://localhost:3001 | 3001 | (host dev) | NestJS REST + SSE |
| postgres(pgvector) | localhost:5432 | 5432 | default | dev+ |
| redis | localhost:6379 | 6379 | default | dev+ |

## 6. Implemented API

```bash
# health
curl localhost:3001/health
# → {"status":"ok","service":"wise-edge-lr-api"}

# issue auth token (dev, AUTH_DEV_LOGIN=true) → session clearance/roles
TOK=$(curl -s -X POST localhost:3001/auth/token -H 'content-type: application/json' \
  -d '{"sub":"kim","clearance":"C","roles":["hr"]}' | jq -r .token)
# then pass header on queries: -H "authorization: Bearer $TOK" (takes priority over body.access)

# ingest raw text. metadata.acl sets classification level/roles
curl -X POST localhost:3001/rag/documents -H 'content-type: application/json' \
  -d '{"id":"policy","text":"Annual leave grants 15 days after 1 year.","metadata":{"acl":{"level":"O"}}}'
# → {"docId":"policy","chunks":1}

# file upload ingest (PDF·CSV·TXT·MD·Korean text, multipart)
curl -X POST localhost:3001/rag/documents/upload -F "file=@./staff.csv"
# → {"docId":"staff.csv","chunks":1,"type":"csv"}   # CSV serialized as header-based "col: value"
# parse failure (broken PDF) → 400, missing file → 400

# list
curl localhost:3001/rag/documents
# → {"backend":"mock","documents":[{"docId":"policy","chunks":1}]}

# RAG query (SSE streaming, default = hybrid search)
curl -N -X POST localhost:3001/rag/query -H 'content-type: application/json' \
  -d '{"question":"How many annual leave days?","topK":2}'   # no mode = hybrid (BM25+vector RRF)
curl -N -X POST localhost:3001/rag/query -H 'content-type: application/json' \
  -d '{"question":"annual leave","mode":"vector"}'           # vector only (cosine)
# access control (ACL): filter by JWT session clearance/roles (N2SF C/S/O). header first, else body.access
curl -N -X POST localhost:3001/rag/query -H 'content-type: application/json' \
  -H "authorization: Bearer $TOK" -d '{"question":"leave"}'
#   → confidential (C) docs are excluded when clearance is insufficient (leak prevention)
# → event: sources \n data: [{...score...}]
#    data: {"token":"..."}  (repeated)
#    event: done

# cost/token monitoring (cumulative, savings vs cloud)
curl "localhost:3001/metrics/cost?model=gpt-4o"
# → {"model":"gpt-4o","totalTokens":94,"cloudCostUsd":0.00086,
#    "localCostUsd":0.000033,"savedUsd":0.000827,"savedPct":96.2,"queries":2}
curl localhost:3001/metrics/pricing      # cloud pricing table (6 models)

# cost baseline (enter pre-adoption cloud monthly bill → savings + capex payback)
curl -X POST localhost:3001/metrics/baseline -H 'content-type: application/json' \
  -d '{"monthlyUsd":1200,"model":"gpt-4o","capexUsd":3000}'
curl localhost:3001/metrics/baseline
# → {"baselineMonthlyUsd":1200,"localMonthlyUsd":0.02,"savedMonthlyUsd":1199.98,
#    "savedPct":100,"paybackMonths":2.5}

# audit log (who queried what, PII masked)
curl "localhost:3001/audit?limit=5"
# → {"total":2,"entries":[{"ts":...,"action":"rag.query","actor":"O:staff",
#    "resource":"pub","detail":"my number 010-****-**** ...","prevHash":"..","hash":".."}, ...]}

# audit integrity check (hash-chain tamper detection)
curl localhost:3001/audit/verify     # → {"ok":true}  or {"ok":false,"brokenAt":N}
```
> With `AUDIT_LOG_PATH` set, logs persist to append-only JSONL (WORM) + SHA-256 hash chain. Reloads on restart, detects tampering.
> With `SIEM_URL` set, each record is forwarded to an external SIEM/WORM collector non-blockingly (`SIEM_FORMAT=json|syslog`). Local record is kept even if forwarding fails.

> Cost model: `LOCAL_COST_PER_M` (default 0.35 $/1M tokens, 0 if HW owned). `?model=` picks the cloud baseline.

## 7. Tests

```bash
pnpm --filter @Wise-Edge-LR/api test       # api 89 units (RAG/loaders/cost/ACL/audit/auth/pgvector/multi-runtime)
pnpm --filter @Wise-Edge-LR/web test       # web 6 units (KWCAG static checks)
pnpm --filter @Wise-Edge-LR/web test:a11y  # KWCAG live audit (Playwright+axe, needs Chromium)
make test                                   # pnpm -r test (all)
```
Iterations: [1st](test/impl/1st/) (core, 12) · [2nd](test/impl/2nd/) (cost, 19) · [3rd](test/impl/3rd/) (hybrid, 26) · [4th](test/impl/4th/) (ACL, 32) · [5th](test/impl/5th/) (audit+PII, 41) · [6th](test/impl/6th/) (JWT, 48) · [7th](test/impl/7th/) (pgvector+RLS, 50) · [8th](test/impl/8th/) (Ollama E2E Korean) · [9th](test/impl/9th/) (web+KWCAG, 6) · [10th](test/impl/10th/) (multi-runtime, 56) · [11th](test/impl/11th/) (audit WORM, 64) · [12th](test/impl/12th/) (OIDC/SSO, 69) · [13th](test/impl/13th/) (SIEM, 73) · [14th](test/impl/14th/) (cost baseline, 77) · [15th](test/impl/15th/) (MLX real-server E2E, 78) · [16th](test/impl/16th/) (KWCAG live axe) · [17th](test/impl/17th/) (loaders/upload, 89). Env check: [test/dev-env](test/dev-env/).

## 8. Troubleshooting (issues actually hit)

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` (pnpm install) | `packageManager:"pnpm@N"` pin → self-managed pnpm needs Node ≥22 | remove pin (global pnpm) or Node 22 |
| `ERR_PNPM_OUTDATED_LOCKFILE` | lock out of date after dep add | `pnpm install --no-frozen-lockfile` |
| `nest start`: TS2307 `Cannot find module 'express'` | `@types/express` not installed | structural type instead of Response (current code) |
| `make dev`: Couldn't find `app`/no tsconfig | scaffold ships only stubs | bootstrap sources generated (current code) |

## 9. Next steps (remaining PRD)

- Replace InMemoryVectorStore with a pgvector adapter (dev+ persistence).
- Ollama real-backend E2E + pick Korean embedding/generation models (PRD open question).
- ~~Cost/token monitoring API (P1)~~ ✅ iter 2 — remaining: web dashboard + real baseline.
- ~~Hybrid search (BM25 + vector RRF)~~ ✅ iter 3 — consider adding a reranker.
- ~~ACL access control filter (N2SF C/S/O)~~ ✅ iter 4 — wire auth/session (JWT→clearance/roles).
- ~~Audit log + PII masking (ISMS-P)~~ ✅ iter 5 — persistent/WORM storage remaining.
- ~~Auth/session (JWT→actor·clearance)~~ ✅ iter 6 — external IdP/SSO, token refresh remaining.
- ~~(#2) pgvector persistence + RLS~~ ✅ iter 7 — multi-tenant pool routing & dim migration remaining.
- ~~(#3) Ollama real-backend E2E + Korean models~~ ✅ iter 8 (bge-m3 1024 + llama3.2:3b).
- ~~(#4) Web UI dashboard + **KWCAG 2.2**~~ ✅ iter 9 (automated checks) — manual 33-item live audit remaining.
- ~~(#5) MLX/llama.cpp/vLLM backends~~ ✅ iter 10 (OpenAI-compatible backend) — per-server inference E2E remaining.
- ~~(#6) audit WORM~~ ✅ iter 11 (append-only + hash chain) — external WORM/SIEM remaining.

**All 6 requested items complete** ✅ (JWT · pgvector+RLS · Ollama E2E · web+KWCAG · multi-runtime · audit WORM)

Follow-ups:
- ~~External IdP/SSO (OIDC)~~ ✅ iter 12 (RS256/JWKS).
- ~~External WORM/SIEM forwarding~~ ✅ iter 13 (HTTP forwarder, json/syslog).
- ~~Cost baseline~~ ✅ iter 14 (monthly bill → savings + capex payback).
- ~~Per-server inference E2E~~ ✅ iter 15 (MLX Apple Silicon + ollama /v1 real inference).
- ~~KWCAG manual 33-item live audit~~ ✅ iter 16 (Playwright+axe automated checks pass) — screen-reader listening etc. via periodic manual review.

**All follow-up items complete** ✅ (OIDC · SIEM · cost baseline · real-server E2E · KWCAG live)

---
_Scaffolded by wise-dev-standard / node-next-nest. Refresh standard: `/wise-dev-standard:standardize`._
