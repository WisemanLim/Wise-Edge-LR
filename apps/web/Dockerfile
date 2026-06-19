# Wise-Edge-LR web (Next.js) — dev 스텁. prod 는 루트 컨텍스트 멀티스테이지로 별도.
FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN pnpm install || true
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]
