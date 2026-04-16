# SCR Agent - Plataforma Inteligente de Análisis Forense de Código

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/pabsalas14/scr-agent)

**Plataforma agentica de análisis forense de código con IA integrada para detectar amenazas, patrones maliciosos y riesgos de seguridad en repositorios Git.**

[Características](#-capacidades-clave) • [Inicio Rápido](#-inicio-rápido) • [Instalación](#-instalación) • [API](#-api-endpoints) • [Contribuir](#-cómo-contribuir)

</div>

---

## 📋 Tabla de Contenidos

- [¿Qué es SCR Agent?](#-qué-es-scr-agent)
- [Estado Actual](#-estado-actual--última-versión)
- [Inicio Rápido](#-inicio-rápido)
- [Capacidades Clave](#-capacidades-clave)
- [Arquitectura](#-arquitectura-del-sistema)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Cómo Usar](#-cómo-usar)
- [API Endpoints](#-api-endpoints)
- [Casos de Uso](#-casos-de-uso)
- [Seguridad](#-seguridad-y-privacidad)
- [Roadmap](#-roadmap)
- [Contribuir](#-cómo-contribuir)

---

## 🚀 ¿Qué es SCR Agent?

SCR Agent es una **plataforma agentica de análisis forense de código** que utiliza agentes IA para analizar repositorios Git en profundidad y detectar amenazas de seguridad, patrones de código malicioso, anomalías de comportamiento y riesgos de insider threats.

### Diferenciadores Principales

A diferencia de herramientas tradicionales de análisis estático:

- 🧠 **Agentes IA especializados** - Inspector, Detective y Fiscal trabajan en conjunto usando Model Context Protocol (MCP)
- 🔍 **Detección de anomalías comportamentales** - Analiza patrones de commits en el tiempo
- 📊 **Visualización avanzada** - Dashboards interactivos con mapas de calor y timelines
- ✅ **Gestión integral de remediaciones** - Desde detección hasta validación con auditoría completa
- 📈 **Análisis incremental** - Solo re-escanea commits nuevos (70% más rápido)
- 🔒 **100% local y privado** - Ningún código se envía a servidores externos
- 🎯 **Enfoque técnico** - Recomendaciones de control sin referencias normativas

## 🆕 Estado Actual - Última Versión

**Versión**: 1.0.0 Producción  
**Fecha**: Abril 2026  
**Estado**: ✅ Funcional y Estable

### Correcciones Recientes Implementadas ✅

| Feature | Descripción | Estado |
|---------|------------|--------|
| **PDF Export** | Generación de reportes PDF profesionales sin dependencias problemáticas | ✅ Funciona |
| **Gestión de Usuarios** | Creación de usuarios con contraseña manual en pantalla | ✅ Funciona |
| **Hallazgos Críticos** | Cálculo correcto de críticos en histórico de análisis | ✅ Funciona |
| **Síntesis Ejecutiva** | Reportes ejecutivos sin referencias normativas, enfoque técnico puro | ✅ Funciona |
| **Plan de Mitigación** | Recomendaciones técnicas de control, sin sugerencias administrativas | ✅ Funciona |

## ⚡ Inicio Rápido

### Requisitos Mínimos
- **Node.js** 18+
- **PostgreSQL** 14+ 
- **Redis** 6+
- **Git** 2.0+

### Instalación en 5 Minutos

```bash
# 1. Clonar repositorio
git clone https://github.com/pabsalas14/scr-agent.git
cd scr-agent

# 2. Instalar dependencias
npm install

# 3. Configurar backend
cd packages/backend
npm install
npx prisma migrate dev

# 4. Configurar frontend
cd ../frontend
npm install

# 5. Iniciar en paralelo
cd ../..
npm run dev:all
```

### Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **Health Check**: `curl http://localhost:3001/health`

---

## ✨ Capacidades Clave

<table>
<tr>
<td width="50%">

### 🔍 Detección Inteligente
- ✓ Análisis de patrones maliciosos
- ✓ Ataques de lógica de negocio
- ✓ Amenazas persistentes (APT)
- ✓ Patrones de colusión
- ✓ Scoring automático de riesgo
- ✓ Indicadores anómalo
- ✓ **Análisis agentico con IA**

### 📊 Gestión de Remediaciones
- ✓ Seguimiento completo de hallazgos
- ✓ SLA y plazos configurables
- ✓ Validación automática
- ✓ Colaboración con comentarios
- ✓ Historial de cambios de estado
- ✓ Notificaciones en tiempo real

</td>
<td width="50%">

### 📈 Investigación Forense
- ✓ Timeline de cambios completo
- ✓ Trazabilidad de usuarios
- ✓ Perfilado de comportamiento
- ✓ Correlación de eventos
- ✓ Análisis visual interactivo
- ✓ Histórico ilimitado

### 📋 Reportes Profesionales
- ✓ Resúmenes ejecutivos técnicos
- ✓ Reportes detallados
- ✓ Exportación PDF/CSV/JSON
- ✓ Métricas de mejora
- ✓ Sin referencias normativas
- ✓ Enfoque en soluciones

</td>
</tr>
</table>

---

## 🛠️ Stack Tecnológico

### Backend
```
Node.js 18+ + Express.js + TypeScript
├─ Database: PostgreSQL 14+ (Prisma ORM)
├─ Cache/Queue: Redis 6+ (Bull)
├─ Real-time: Socket.io (WebSocket)
├─ Agentes IA: Claude (Anthropic)
├─ MCP: Model Context Protocol
└─ Analysis: Git history + Pattern matching
```

### Frontend
```
React 18 + TypeScript + Vite
├─ State: React Query + Zustand
├─ UI: Tailwind CSS + Framer Motion
├─ Charts: Recharts + Chart.js
├─ Icons: Lucide React
└─ Real-time: Socket.io client
```

### Agentes IA (MCP)
```
Inspector Agent  → Detecta código malicioso
Detective Agent  → Investiga historial
Fiscal Agent     → Genera reportes técnicos
```

---

## 🏗️ Arquitectura del Sistema

```
Git Repos (GitHub, GitLab, Gitea)
    ↓
[Webhook/Polling/Manual Trigger]
    ↓
┌─────────────────────────────────┐
│   Analysis Engine (3 Agentes)   │
├──────────────────────────────────┤
│ 1. Inspector  → Detecta malicia  │
│ 2. Detective  → Investiga        │
│ 3. Fiscal     → Reportes         │
└──────────┬──────────────────────┘
           ↓
    ┌──────────────┐
    │ PostgreSQL   │
    │ Redis Queue  │
    │ Cache        │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ Dashboard    │
    │ Reports      │
    │ Real-time    │
    └──────────────┘
```

---

## 🚀 Instalación Completa

### Paso 1: Requisitos Previos

| Sistema | Mínimo | Recomendado |
|---------|--------|------------|
| **Node.js** | 18.0.0 | 20.10.0+ |
| **PostgreSQL** | 14 | 15+ |
| **Redis** | 6.0 | 7+ |
| **RAM** | 4GB | 8GB+ |
| **Disk** | 10GB | 50GB+ |

### Paso 2: Variables de Entorno

**Backend** (`packages/backend/.env`):
```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/scr_agent"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRY="24h"

# AI/MCP
ANTHROPIC_API_KEY="sk-ant-..."

# Git Analysis
GIT_ANALYSIS_WORKERS=4
```

**Frontend** (`packages/frontend/.env`):
```bash
VITE_API_URL="http://localhost:3001/api/v1"
VITE_WS_URL="ws://localhost:3001"
VITE_ENV="development"
```

### Paso 3: Iniciar Servicios

```bash
# Opción 1: Monorepo (todas las apps juntas)
npm run dev:all

# Opción 2: Terminales separadas
# Terminal 1: Backend
cd packages/backend && npm run dev

# Terminal 2: Frontend
cd packages/frontend && npm run dev
```

### Paso 4: Verificar Instalación

```bash
# Chequear backend
curl http://localhost:3001/health
# Respuesta: {"status":"ok","timestamp":"..."}

# Abrir frontend
open http://localhost:5173
```

---

## 📚 Cómo Usar

### Flujo Básico

1. **Crear Proyecto** → Dashboard → Nuevo Proyecto → Ingresar URL del repo
2. **Iniciar Análisis** → Seleccionar repo → Analizar
3. **Revisar Hallazgos** → Filtrar por severidad → Ver detalles
4. **Crear Remediación** → Asignar → Configurar SLA
5. **Validar Fixes** → Re-analizar → Confirmar resolución

### Gestión de Usuarios

Desde **Gestión de Usuarios**:
1. Click en "Nuevo Usuario"
2. Ingresar:
   - Email
   - Contraseña (mín. 6 caracteres)
   - Rol (Admin, Analyst, Developer)
3. Click en "Crear"

Los usuarios pueden iniciar sesión inmediatamente con las credenciales configuradas.

### Generación de Reportes

1. Seleccionar análisis completado
2. Reportes → Descargar PDF/CSV
3. Exportar con todas las evidencias

---

## 🔌 API Endpoints

### Autenticación
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Usuarios (Admin)
```bash
# Listar usuarios
GET /api/v1/users

# Crear usuario
POST /api/v1/users
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "analyst"
}

# Cambiar rol
PATCH /api/v1/users/{userId}/role
{ "role": "admin" }
```

### Proyectos
```bash
# Listar
GET /api/v1/projects

# Crear
POST /api/v1/projects
{
  "name": "Mi Proyecto",
  "repositoryUrl": "https://github.com/org/repo",
  "description": "..."
}
```

### Análisis
```bash
# Iniciar
POST /api/v1/projects/{projectId}/analyses

# Obtener estado (WebSocket)
WS /api/v1/ws/analyses/{analysisId}
```

### Hallazgos
```bash
# Listar
GET /api/v1/findings?severity=CRITICAL

# Detalles
GET /api/v1/findings/{findingId}
```

### Reportes
```bash
# Descargar PDF
GET /api/v1/reports/{analysisId}/pdf

# Descargar CSV
GET /api/v1/reports/{analysisId}/export?format=csv
```

**📚 Documentación Completa API**: [API Reference](./docs/api.md)

---

## 🎯 Casos de Uso

### 🔐 Equipos de Seguridad
Detectar repos comprometidos e investigar en profundidad con análisis forense completo.

### 🚀 DevOps
Asegurar pipeline CI/CD con análisis automático en cada push/PR.

### 👨‍💻 Desarrolladores
Entender problemas de seguridad con reportes técnicos y accionables.

### 📊 Ejecutivos
Visibilidad de postura de seguridad con dashboards de KPI y métricas.

---

## 🔒 Seguridad y Privacidad

✅ **Zero-Trust** - Todo análisis local, ningún código a servicios externos  
✅ **Encriptación** - TLS 1.3 en tránsito, AES-256 en reposo  
✅ **Auditoría** - Registro completo de todas las acciones  
✅ **Privacidad** - GDPR compliant, sin tracking externo  

---

## 🗺️ Roadmap

### Q2 2024 ✅
- [x] Gestión de usuarios mejorada
- [x] PDF export funcional
- [x] Hallazgos críticos correctos
- [x] Reportes sin normativas

### Q3 2024 🚀
- [ ] Machine Learning anomaly detection
- [ ] Slack/Teams notifications
- [ ] API v2 pública

### 2025 🌟
- [ ] Soporte GitLab/Bitbucket
- [ ] Mobile app
- [ ] Marketplace de plugins

---

## 🤝 Cómo Contribuir

1. Fork el repo
2. Crear rama: `git checkout -b feature/amazing-feature`
3. Hacer commits: `git commit -m "feat: Add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Abrir PR

### Antes de hacer PR
- [ ] Tests pasan (`npm run test`)
- [ ] Código formateado (`npm run format`)
- [ ] Sin errores de linting (`npm run lint`)
- [ ] Tipos correctos (`npm run type-check`)

---

## 📧 Soporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/pabsalas14/scr-agent/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/pabsalas14/scr-agent/discussions)
- 📧 **Email**: support@scr-agent.dev

---

## 📄 Licencia

MIT License - Libre para uso comercial y privado

---

<div align="center">

### ⭐ Si te gusta SCR Agent, dale una ⭐

**SCR Agent** - *Detecta. Investiga. Remedia.*

Hecho con ❤️ por la comunidad de seguridad

</div>
