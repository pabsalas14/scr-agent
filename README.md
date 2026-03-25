<div align="center">

# 🔍 SCR Agent

**Source Code Review con Arquitectura MCP Agentica**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Claude](https://img.shields.io/badge/Claude-3.5_Sonnet_&_Haiku-CC785C?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com)
[![OWASP](https://img.shields.io/badge/OWASP-Top_10_2021-000000?style=flat-square)](https://owasp.org/Top10/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*Sistema inteligente de revisión de código que detecta backdoors, código malicioso y patrones sospechosos usando múltiples agentes de IA coordinados por MCP.*

[Inicio Rápido](#-inicio-rápido) · [Arquitectura](#-arquitectura) · [Agentes](#-agentes) · [Seguridad](#-seguridad) · [API](#-api-rest)

</div>

---

## ¿Qué es SCR Agent?

SCR Agent analiza repositorios de código fuente en busca de funcionalidades maliciosas usando una arquitectura de **agentes especializados** orquestados por **MCP (Model Context Protocol)**. Cada agente tiene una responsabilidad específica y usa el modelo de IA óptimo para su tarea.

```
Repositorio Git
      │
      ▼
┌─────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│  🚨 Malicia     │───▶│  🔍 Forenses         │───▶│  📊 Síntesis     │
│  Claude Sonnet  │    │  Claude Haiku        │    │  Claude Sonnet   │
│                 │    │                      │    │                  │
│  Detecta:       │    │  Investiga:          │    │  Genera:         │
│  • Backdoors    │    │  • Historial Git     │    │  • Reporte PDF   │
│  • Inyecciones  │    │  • Timeline cambios  │    │  • Puntuación    │
│  • Ofuscación   │    │  • Autores           │    │  • Remediación   │
└─────────────────┘    └──────────────────────┘    └──────────────────┘
                                                           │
                                                           ▼
                                              Dashboard React + Timeline D3.js
```

---

## ✨ Características

| Característica | Descripción |
|---|---|
| 🚨 **Detección de malicia** | Backdoors, inyecciones SQL/código, lógica oculta, ofuscación |
| 🔍 **Análisis forense** | Línea de tiempo interactiva de cambios en Git, correlación de commits |
| 📊 **Reportes ejecutivos** | Puntuación de riesgo 0–100, priorización de remediación, exportar PDF |
| 🎨 **Timeline D3.js** | Visualización dinámica con zoom, filtros, animaciones y vista híbrida |
| ⚡ **Análisis incremental** | Solo analiza archivos cambiados; caché por hash de commit |
| 🔒 **OWASP Top 10** | Protecciones contra A01–A10 y API1–API10 integradas |
| 🌐 **Multi-plataforma Git** | GitHub, GitLab y Bitbucket |
| 🗄️ **Persistencia** | PostgreSQL + Prisma ORM con historial completo de análisis |

---

## 🏗️ Arquitectura

### Monorepo (Turbo + pnpm)

```
scr-agent/
├── packages/
│   ├── backend/                   # Node.js + Express + MCP Server
│   │   ├── src/
│   │   │   ├── agents/
│   │   │   │   ├── malicia.agent.ts        ← Claude 3.5 Sonnet
│   │   │   │   ├── forenses.agent.ts       ← Claude 3.5 Haiku
│   │   │   │   └── sintesis.agent.ts       ← Claude 3.5 Sonnet
│   │   │   ├── services/
│   │   │   │   ├── mcp-orchestrator.ts     ← Coordinador central
│   │   │   │   ├── git.service.ts          ← simple-git
│   │   │   │   ├── cache.service.ts        ← node-cache / Redis
│   │   │   │   └── logger.service.ts       ← Winston + auditoría
│   │   │   └── routes/
│   │   │       ├── projects.routes.ts
│   │   │       └── analyses.routes.ts
│   │   └── prisma/schema.prisma            ← Esquema PostgreSQL
│   │
│   └── frontend/                  # React 19 + Vite
│       └── src/
│           ├── components/
│           │   ├── Timeline/               ← D3.js + Framer Motion
│           │   ├── Dashboard/              ← Gestión de proyectos
│           │   └── Reports/                ← Visor de reportes
│           └── services/
│               └── api.service.ts          ← Cliente HTTP
│
├── turbo.json                     # Orchestración de builds
└── pnpm-workspace.yaml
```

### Stack Tecnológico

**Backend**
- **Runtime:** Node.js 18+ con TypeScript estricto
- **Framework:** Express.js con middleware OWASP
- **ORM:** Prisma 5 + PostgreSQL 16
- **IA:** Anthropic Claude SDK (`@anthropic-ai/sdk`)
- **Git:** `simple-git` para clonar, historial y diffs
- **Caché:** `node-cache` (dev) / Redis (producción)
- **Seguridad:** Helmet, express-rate-limit, bcrypt, jsonwebtoken, sanitize-html, zod
- **Logging:** Winston con auditoría de eventos

**Frontend**
- **Framework:** React 19 con Vite
- **Visualización:** D3.js v7 + Framer Motion
- **Estado:** TanStack Query + Zustand
- **Formularios:** react-hook-form + Zod
- **Estilos:** Tailwind CSS 3
- **Seguridad:** DOMPurify, CSP headers

---

## 🤖 Agentes

### Agente Malicia
> **Modelo:** Claude 3.5 Sonnet | **Caché:** 30 días por hash de código

Analiza el código en busca de patrones maliciosos:

- **Puertas traseras** — bypass de autenticación, condiciones ocultas
- **Inyección de código** — SQL, comandos, eval dinámico
- **Ofuscación** — `atob`, `String.fromCharCode`, variables `_0x...`
- **Bombas lógicas** — lógica que se activa bajo condiciones específicas
- **Error swallowing** — errores silenciados sin logging

```json
{
  "hallazgos": [{
    "archivo": "src/auth/login.ts",
    "funcion": "verificarUsuario",
    "severidad": "CRÍTICO",
    "tipo_riesgo": "PUERTA_TRASERA",
    "por_que_sospechoso": "Condicional oculto bypasea validación si password === env.MASTER_KEY",
    "confianza": 0.97,
    "pasos_remediacion": ["Remover condicional de bypass", "Auditar git history"]
  }]
}
```

### Agente Forenses
> **Modelo:** Claude 3.5 Haiku | **Caché:** 30 días por rango de commits

Investiga el historial de Git de archivos comprometidos:

- Traza cuándo y cómo se introdujo el código malicioso
- Identifica patrones de escalación (introducción gradual)
- Correlaciona commits, autores y archivos relacionados
- Construye la cadena de comprometimiento

```json
{
  "linea_tiempo": [{
    "timestamp": "2024-03-16T14:22:00Z",
    "commit": "xyz789",
    "autor": "dev@empresa.com",
    "nivel_riesgo": "CRÍTICO",
    "indicadores_sospecha": ["Código ofuscado", "Sin documentación"]
  }]
}
```

### Agente Síntesis
> **Modelo:** Claude 3.5 Sonnet | **Caché:** 7 días por análisis

Genera el reporte ejecutivo final:

- Resumen en lenguaje natural para stakeholders
- Puntuación de riesgo 0–100
- Priorización de acciones de remediación
- Identificación de autores involucrados
- Exportación PDF

---

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- pnpm 10.8+
- PostgreSQL 16+
- Cuenta Anthropic (API Key)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/pabsalas14/scr-agent.git
cd scr-agent

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/scr_agent
# ANTHROPIC_API_KEY=sk-ant-...
# JWT_SECRET=tu-secreto-aqui

# Crear base de datos
pnpm db:push

# Iniciar en modo desarrollo
pnpm dev
```

El frontend estará en `http://localhost:5173` y el backend en `http://localhost:3000`.

### Comandos disponibles

```bash
pnpm dev              # Desarrollo (backend + frontend)
pnpm build            # Build de producción
pnpm test             # Ejecutar tests
pnpm test:coverage    # Tests con cobertura
pnpm lint             # Verificar código
pnpm lint:fix         # Corregir linting
pnpm type-check       # Verificar tipos TypeScript
pnpm db:migrate       # Migraciones de BD
pnpm db:studio        # Prisma Studio (GUI de BD)
```

---

## 📡 API REST

Base URL: `http://localhost:3000/api/v1`

### Proyectos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/projects` | Listar todos los proyectos |
| `POST` | `/projects` | Crear nuevo proyecto |
| `GET` | `/projects/:id` | Obtener proyecto por ID |
| `GET` | `/projects/:id/analyses` | Historial de análisis |
| `POST` | `/projects/:id/analyses` | Iniciar nuevo análisis |

### Análisis

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/analyses/:id` | Estado del análisis (polling) |
| `GET` | `/analyses/:id/findings` | Hallazgos de Malicia |
| `GET` | `/analyses/:id/forensics` | Eventos forenses (timeline) |
| `GET` | `/analyses/:id/report` | Reporte ejecutivo |
| `GET` | `/analyses/:id/report/pdf` | Descargar PDF |

### Ejemplo de uso

```bash
# Crear proyecto
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Mi Repo", "repositoryUrl": "https://github.com/org/repo"}'

# Iniciar análisis
curl -X POST http://localhost:3000/api/v1/projects/{id}/analyses

# Polling de estado
curl http://localhost:3000/api/v1/analyses/{id}

# Obtener reporte
curl http://localhost:3000/api/v1/analyses/{id}/report
```

---

## 🔒 Seguridad

SCR Agent implementa el **OWASP Top 10 2021** y **OWASP Top 10 API 2023** de forma nativa.

### OWASP Top 10 — Aplicación

| # | Riesgo | Mitigación |
|---|--------|-----------|
| A01 | Broken Access Control | JWT + RBAC en cada endpoint |
| A02 | Cryptographic Failures | HTTPS obligatorio + Helmet headers |
| A03 | Injection | Zod validation + sanitize-html en todos los inputs |
| A04 | Insecure Design | Rate limiting + CORS estricto |
| A05 | Security Misconfiguration | Secrets en `.env`, nunca en código |
| A06 | Vulnerable Components | `pnpm audit` + Snyk en CI/CD |
| A07 | Auth Failures | bcrypt + JWT con expiración |
| A08 | Data Integrity | npm lockfile + builds reproducibles |
| A09 | Logging Failures | Winston con auditoría de todos los eventos |
| A10 | SSRF | Whitelist de dominios Git permitidos |

### OWASP Top 10 API

| # | Riesgo | Mitigación |
|---|--------|-----------|
| API1 | Broken Object Auth | Validar ownership en cada recurso |
| API4 | Resource Consumption | Rate limiting 100 req/15min |
| API7 | SSRF | Validación de URLs antes de clonar |
| API8 | Mass Assignment | Solo campos permitidos en Zod schemas |

---

## 🗄️ Base de Datos

Esquema PostgreSQL gestionado con Prisma ORM:

```
Project          Analysis         Finding
───────          ────────         ───────
id               id               id
name             projectId ──────▶ analysisId ──▶ Analysis
repositoryUrl    status           file
scope            progress         function
                 startedAt        severity: BAJO|MEDIO|ALTO|CRÍTICO
                                  riskType
                                  whySuspicious
                                  remediationSteps[]
                                  confidence

ForensicEvent    Report
─────────────    ──────
id               id
analysisId       analysisId
commitHash       executiveSummary
author           riskScore (0-100)
action           severityBreakdown (JSON)
riskLevel        remediationSteps (JSON)
timestamp        pdfContent (bytes)
```

---

## 📊 Modelos de IA

| Agente | Modelo | Por qué |
|--------|--------|---------|
| Malicia | `claude-3-5-sonnet-20241022` | Análisis profundo, detección de patrones complejos |
| Forenses | `claude-3-5-haiku-20241022` | Rápido para queries secuenciales de Git |
| Síntesis | `claude-3-5-sonnet-20241022` | Razonamiento multi-paso para reportes ejecutivos |

**Estrategia de costo:**
- Haiku para tareas deterministas y rápidas (~10x más barato)
- Sonnet para análisis que requieren razonamiento complejo
- Caché agresivo para evitar llamadas repetidas

---

## ⚡ Performance

| Operación | Tiempo esperado |
|-----------|----------------|
| Análisis completo (repo pequeño) | 15–30 segundos |
| Análisis desde caché | < 500ms |
| Render del timeline | < 100ms (60fps) |
| API response time | < 200ms |

**Estrategia de caché:**
- Hash de código fuente → resultados de Malicia (30 días)
- Rango de commits → timeline forense (30 días)
- Reporte ejecutivo → síntesis (7 días)
- Deduplicación de requests en vuelo

---

## 🗺️ Roadmap

### ✅ Fase 1 — Fundación
- [x] Monorepo Turbo + pnpm
- [x] 3 agentes especializados
- [x] Orquestador MCP
- [x] Esquema PostgreSQL

### ✅ Fase 2 — Frontend + API
- [x] Timeline D3.js interactivo
- [x] Dashboard de proyectos
- [x] ReportViewer con tabs
- [x] API REST completa

### 🚧 Fase 3 — Integración Completa
- [ ] Análisis asíncrono en background (queue)
- [ ] Guardar resultados de agentes en PostgreSQL
- [ ] Tests unitarios e integración
- [ ] Notificaciones de estado en tiempo real (SSE)

### 📋 Fase 4 — Producción
- [ ] Docker + docker-compose
- [ ] GitHub Actions CI/CD
- [ ] Autenticación JWT completa
- [ ] Deployment guide

---

## 🤝 Contribuir

```bash
# Fork el repo y clona tu fork
git clone https://github.com/tu-usuario/scr-agent.git

# Crea una rama
git checkout -b feature/mi-mejora

# Haz tus cambios (comentarios en español, OWASP siempre)
# Corre tests
pnpm test

# Push y abre un PR
git push origin feature/mi-mejora
```

### Convenciones

- **Comentarios:** Siempre en español
- **Commits:** Conventional commits en español (`feat:`, `fix:`, `docs:`)
- **Seguridad:** Todo input validado con Zod, toda URL con whitelist
- **Logging:** Todo evento relevante auditado con Winston

---

## 📄 Licencia

MIT © 2024 — Construido con [Claude Code](https://claude.ai/code)

<div align="center">

---

Hecho con ❤️ usando **Claude 3.5** · **Anthropic MCP** · **TypeScript**

</div>
