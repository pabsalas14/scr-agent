#!/bin/sh
set -e
cd /app
echo "Aplicando migraciones Prisma..."
pnpm --filter @scr-agent/backend exec prisma migrate deploy
echo "Sincronizando esquema (tablas faltantes en historial de migraciones)..."
pnpm --filter @scr-agent/backend exec prisma db push --skip-generate
cd /app/packages/backend
echo "Iniciando servidor..."
exec node dist/index.js
