# Wise-Edge-LR — node-next-nest (정적 템플릿 / static scaffold template)
.PHONY: dev test build deploy up down run stop restart logs ps
ENV ?= local
PM ?= pnpm exec pm2          # local 프로세스 매니저 / PM2 (베어메탈 재사용 가능)
WEB_PORT ?= 3000             # 웹 포트 / web port (override: make dev WEB_PORT=4000)
API_PORT ?= 3001             # API 포트 / api port (override: make dev API_PORT=4001)
LLM_MODEL ?= llama3.2:3b
EMBED_MODEL ?= bge-m3

up:    ## datastore 만 / infra only (pnpm 워크스페이스 앱은 호스트 실행 권장)
	docker compose up -d
down:  ; docker compose down --remove-orphans
dev:   ## 호스트 직접 실행 — ENV=local|dev|staging make dev  (WEB_PORT/API_PORT 오버라이드 가능)
	@trap 'kill 0' EXIT; \
	if [ -f ".env.$(ENV)" ]; then set -a; . "./.env.$(ENV)"; set +a; fi; \
	PORT=$(API_PORT) LLM_MODEL=$${LLM_MODEL:-$(LLM_MODEL)} EMBEDDING_MODEL=$${EMBEDDING_MODEL:-$(EMBED_MODEL)} pnpm --filter @Wise-Edge-LR/api dev & \
	PORT=$(WEB_PORT) NEXT_PUBLIC_API_BASE=http://localhost:$(API_PORT) pnpm --filter @Wise-Edge-LR/web dev & \
	wait
test:  ; pnpm -r test
build: ; pnpm -r build
deploy:; helm upgrade --install Wise-Edge-LR ./deploy/helm

## --- local 멀티프로세스 (PM2, 백그라운드 데몬) / local multi-process ---
run:     ## web+api 데몬 기동 / start managed processes
	$(PM) start ecosystem.config.cjs
stop:    ## 중지·삭제 / stop & delete
	$(PM) delete ecosystem.config.cjs || true
restart: ; $(PM) restart ecosystem.config.cjs
logs:    ## 통합 로그 추적 / tail logs
	$(PM) logs
ps:      ## 상태 / status
	$(PM) ls
