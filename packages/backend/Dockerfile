# Build desde la raíz del monorepo (ver docker-compose: context: .)
FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0 CI=1
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .pnpmfile.cjs ./
COPY tsconfig.json ./
COPY packages/backend ./packages/backend
# Evitar "prepare" (husky) en imagen: no .git y sin devDependencies a veces
RUN node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); if(p.scripts) delete p.scripts.prepare; fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @scr-agent/backend exec prisma generate
RUN pnpm --filter @scr-agent/backend run build

# ─── Producción ───
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production HUSKY=0 CI=1
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .pnpmfile.cjs ./
COPY packages/backend ./packages/backend
RUN node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); if(p.scripts) delete p.scripts.prepare; fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
RUN pnpm install --frozen-lockfile --filter @scr-agent/backend --prod
RUN pnpm --filter @scr-agent/backend exec prisma generate

COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

COPY packages/backend/docker-entrypoint.sh /app/packages/backend/docker-entrypoint.sh
RUN chmod +x /app/packages/backend/docker-entrypoint.sh

RUN apk add --no-cache curl openssl

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# pnpm (corepack) en PATH para el entrypoint (migraciones)
ENV PATH="/usr/local/bin:/app/node_modules/.bin:/app/packages/backend/node_modules/.bin:$PATH"
USER appuser
WORKDIR /app/packages/backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=5 \
  CMD curl -sf http://127.0.0.1:3001/health > /dev/null || exit 1

CMD ["/app/packages/backend/docker-entrypoint.sh"]
