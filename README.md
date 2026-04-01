# SCR Agent

> **Security Code Review Agent** — Auditoría automatizada de código fuente mediante agentes de IA especializados.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)

---

## ¿Qué es?

SCR Agent analiza repositorios de código en busca de vulnerabilidades de seguridad utilizando un pipeline de tres agentes de IA orquestados. Cada agente tiene un rol especializado inspirado en el sistema judicial:

```
Repositorio Git
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  Agente Inspector  (claude-sonnet-4-6)              │
│  Detecta: backdoors, inyecciones, ofuscación,       │
│  valores hardcodeados, lógica sospechosa            │
└───────────────────────┬─────────────────────────────┘
                        │ Hallazgos + archivos sospechosos
                        ▼
┌─────────────────────────────────────────────────────┐
│  Agente Detective  (claude-haiku-4-5)               │
│  Analiza historial de commits Git, construye        │
│  timeline forense, identifica patrones de autoría   │
└───────────────────────┬─────────────────────────────┘
                        │ Timeline forense
                        ▼
┌─────────────────────────────────────────────────────┐
│  Agente Fiscal  (claude-sonnet-4-6)                 │
│  Genera reporte ejecutivo con score de riesgo,      │
│  recomendaciones y pasos de remediación             │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
              Reporte + Dashboard en tiempo real
```

---

## Funcionalidades

- **Análisis automatizado** de repositorios GitHub, GitLab y Bitbucket (públicos y privados)
- **Dashboard en tiempo real** con actualizaciones via Socket.io durante el análisis
- **Gestión del ciclo de vida** de vulnerabilidades: Detectado → Revisión → Corrección → Verificado → Cerrado
- **Asignación de hallazgos** a miembros del equipo con notificaciones
- **Timeline forense** interactivo con historial de commits analizado
- **Exportación a PDF** de reportes ejecutivos
- **Multi-usuario** con roles (Admin, Analista, Desarrollador, Viewer)
- **Monitoreo de agentes** en tiempo real (métricas de CPU, RAM, costos por modelo)
- **Comentarios y menciones** en hallazgos para colaboración en equipo

---

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, TanStack Query, Socket.io-client, Framer Motion |
| **Backend** | Node.js 20, Express, TypeScript, Socket.io, BullMQ, Winston |
| **IA** | Anthropic Claude (Sonnet 4.6, Haiku 4.5) via `@anthropic-ai/sdk` |
| **Base de datos** | PostgreSQL 16 + Prisma ORM |
| **Caché** | node-cache (dev) / Redis (prod) |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Contenedores** | Docker + Nginx |

---

## Inicio rápido con Docker

### Prerequisitos

- Docker ≥ 24 y Docker Compose ≥ 2.20
- API Key de Anthropic ([obtener aquí](https://console.anthropic.com/))

### 1. Clonar y configurar entorno

```bash
git clone https://github.com/pabsalas14/scr-agent.git
cd scr-agent
cp packages/backend/.env.example packages/backend/.env
```

Editar `packages/backend/.env` con los valores requeridos:

```env
ANTHROPIC_API_KEY=sk-ant-...        # requerido
JWT_SECRET=cambia-esto-en-prod      # requerido
ENCRYPTION_KEY=32-chars-hex-string  # requerido (exactamente 32 caracteres)
```

### 2. Levantar servicios

```bash
docker compose up -d
```

Esto levanta:
- **PostgreSQL** en `localhost:5432`
- **Redis** en `localhost:6379`
- **Backend API** en `localhost:3001`
- **Frontend** en `localhost:80`

### 3. Ejecutar migraciones

```bash
docker compose exec backend npx prisma migrate deploy
```

### 4. Abrir la aplicación

```
http://localhost
```

Registrar un usuario en `/login` → **Registrarse**.

---

## Desarrollo local

### Prerequisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL 16 corriendo localmente

### Instalación

```bash
# Instalar dependencias (todos los paquetes)
pnpm install

# Configurar variables de entorno
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Ejecutar migraciones de base de datos
cd packages/backend && npx prisma migrate dev && cd ../..

# Iniciar en modo desarrollo (backend + frontend en paralelo)
pnpm dev
```

La app estará disponible en:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`

---

## Variables de entorno

### Backend (`packages/backend/.env`)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | URL de conexión PostgreSQL |
| `ANTHROPIC_API_KEY` | ✅ | API Key de Anthropic Claude |
| `JWT_SECRET` | ✅ | Secreto para firma de tokens JWT |
| `ENCRYPTION_KEY` | ✅ | Clave AES-256 para tokens GitHub (32 chars) |
| `JWT_EXPIRES_IN` | — | Tiempo de expiración JWT (default: `24h`) |
| `BACKEND_PORT` | — | Puerto del servidor (default: `3001`) |
| `FRONTEND_URL` | — | URL del frontend para CORS (default: `http://localhost:5173`) |
| `GITHUB_TOKEN` | — | Token GitHub global (opcional, usuarios usan el suyo) |
| `REDIS_URL` | — | URL de Redis para caché (default: node-cache en memoria) |
| `LOG_LEVEL` | — | Nivel de logging: `debug`, `info`, `warn`, `error` |
| `GIT_CACHE_DIR` | — | Directorio para cachear repos clonados |

### Frontend (`packages/frontend/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL del backend (default: `/api/v1` via proxy) |
| `VITE_SOCKET_URL` | URL de Socket.io (default: mismo origen) |

---

## API REST

Base URL: `http://localhost:3001/api/v1`

### Autenticación

```
POST /auth/register    Crear cuenta
POST /auth/login       Iniciar sesión → JWT
POST /auth/verify      Verificar token
```

### Proyectos

```
GET    /projects               Listar proyectos (?page, ?limit, ?search)
POST   /projects               Crear proyecto (valida acceso al repo)
GET    /projects/:id           Detalle del proyecto
GET    /projects/:id/analyses  Análisis del proyecto
POST   /projects/:id/analyses  Iniciar nuevo análisis
POST   /projects/:pid/analyses/:id/cancel  Cancelar análisis en curso
```

### Análisis

```
GET  /analyses/:id                Estado + hallazgos completos
GET  /analyses/:id/findings       Hallazgos (?page, ?limit)
GET  /analyses/:id/forensics      Timeline forense
GET  /analyses/:id/report         Reporte ejecutivo
GET  /analyses/:id/report/pdf     Exportar reporte PDF
POST /analyses/:id/retry          Reintentar análisis fallido
```

### Hallazgos

```
GET    /findings/analysis/:id              Hallazgos por análisis (paginable)
GET    /findings/:id                       Detalle con historial completo
PUT    /findings/:id/status                Cambiar estado
POST   /findings/:id/assign                Asignar a usuario
DELETE /findings/:id/assign                Desasignar
POST   /findings/:id/remediation           Crear/actualizar remediación
PUT    /findings/:id/remediation/verify    Verificar remediación
GET    /findings/analysis/:id/stats        Estadísticas por severidad
```

### Usuario

```
GET    /users/settings       Perfil (nombre, email, avatar, bio)
PATCH  /users/settings       Actualizar perfil
GET    /users/preferences    Preferencias de notificaciones
POST   /users/preferences    Actualizar preferencias
POST   /settings/github-token  Guardar token GitHub cifrado
DELETE /settings/github-token  Eliminar token GitHub
```

### Sistema

```
GET  /health                     Estado del servidor
GET  /monitoring/agents          Estado de agentes IA
GET  /monitoring/system-metrics  CPU, RAM, disco
GET  /monitoring/costs           Costos por modelo IA
```

---

## Pipeline de análisis

```
PENDING → INSPECTOR_RUNNING → DETECTIVE_RUNNING → FISCAL_RUNNING → COMPLETED
                                                                  ↘ FAILED
                                                                  ↘ CANCELLED
```

### Límites del análisis

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Código total por análisis | **2 MB** | Archivos pre-filtrados antes de enviar a la IA |
| Tamaño máximo por archivo | **150 KB** | Archivos más grandes se omiten automáticamente |
| Profundidad de directorios | **6 niveles** | Previene análisis de repos muy anidados |
| Historial de commits | **Últimos 50** | El Detective analiza los commits más recientes |
| Timeout total | **10 min** | Inspector: 5 min · Detective: 3 min · Fiscal: 2 min |
| Análisis simultáneos | **1** | Cola FIFO — los análisis se procesan en orden |

Directorios excluidos automáticamente: `node_modules`, `dist`, `build`, `vendor`, `test`, `coverage`, `assets`, `.git`, `.github`.

---

## Máquina de estados de hallazgos

```
DETECTED ──→ IN_REVIEW ──→ IN_CORRECTION ──→ CORRECTED ──→ VERIFIED ──→ CLOSED
    ↑              ↑              │
    │              └──────────────┘ (regresar)
    └── FALSE_POSITIVE
```

---

## Testing

```bash
# Todos los tests
pnpm test

# Backend únicamente
cd packages/backend && pnpm test

# Frontend únicamente
cd packages/frontend && pnpm test

# Con reporte de cobertura
pnpm test:coverage

# Tests E2E (Playwright)
pnpm test:e2e
```

---

## Estructura del proyecto

```
scr-agent/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── agents/          # Inspector, Detective, Fiscal
│   │   │   ├── middleware/      # Auth JWT, rate limiting
│   │   │   ├── routes/          # Endpoints REST
│   │   │   └── services/        # Prisma, Git, Cache, Socket, Logger
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Modelos de base de datos
│   │   │   └── migrations/      # Migraciones SQL versionadas
│   │   └── tests/               # Tests unitarios e integración
│   └── frontend/
│       ├── src/
│       │   ├── components/      # Dashboard, Analysis, Settings…
│       │   ├── hooks/           # useAuth, useToast, useSocketEvents
│       │   ├── services/        # Clientes HTTP y Socket.io
│       │   └── types/           # Tipos TypeScript
│       └── nginx.conf           # Config Nginx para producción
├── docker-compose.yml           # Stack completo (db, redis, api, web)
├── turbo.json                   # Configuración Turborepo
└── pnpm-workspace.yaml
```

---

## Roles y permisos

| Rol | Ver análisis | Cambiar estados | Asignar hallazgos | Administrar usuarios |
|-----|:-----------:|:---------------:|:-----------------:|:--------------------:|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Analyst** | ✅ | ✅ | ✅ | ❌ |
| **Developer** | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ |

---

## Licencia

MIT © 2024 SCR Agent
