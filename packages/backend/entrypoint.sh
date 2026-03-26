#!/bin/sh
# Ejecutar migraciones de Prisma antes de arrancar el servidor
echo "Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

echo "Iniciando servidor..."
exec node dist/index.js
