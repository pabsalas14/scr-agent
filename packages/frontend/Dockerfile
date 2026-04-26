# Build desde la raíz del monorepo (ver docker-compose: context: .)
FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0 CI=1
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .pnpmfile.cjs ./
COPY tsconfig.json ./
COPY packages/frontend ./packages/frontend
RUN node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); if(p.scripts) delete p.scripts.prepare; fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
RUN pnpm install --frozen-lockfile

ARG VITE_API_URL=/api/v1
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN pnpm --filter @scr-agent/frontend exec vite build

FROM nginx:1.27-alpine AS production
RUN apk add --no-cache wget
RUN rm /etc/nginx/conf.d/default.conf
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
