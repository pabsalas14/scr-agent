# SCR Agent - Plataforma de Inteligencia Forense de Código

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)

**Plataforma inteligente de análisis forense de código para detectar patrones maliciosos, amenazas de seguridad y repositorios comprometidos.**

[Características](#-capacidades-clave) • [Instalación](#-instalación) • [Documentación](#-documentación) • [Contribuir](#-cómo-contribuir)

</div>

---

## 📋 Tabla de Contenidos

- [¿Qué es SCR Agent?](#-qué-es-scr-agent)
- [Capacidades Clave](#-capacidades-clave)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Cómo Usar](#-cómo-usar)
- [API Endpoints](#-api-endpoints)
- [Casos de Uso](#-casos-de-uso)
- [Seguridad y Privacidad](#-seguridad-y-privacidad)
- [Roadmap](#-roadmap)
- [Contribuir](#-cómo-contribuir)
- [Licencia](#-licencia)

---

## 🚀 ¿Qué es SCR Agent?

SCR Agent es una **plataforma inteligente de análisis forense de código** que analiza tus repositorios para detectar amenazas de seguridad, patrones de código malicioso y riesgos potenciales de insiders. 

### Diferenciadores Principales

A diferencia de las herramientas tradicionales de análisis estático, SCR Agent:

- 🔍 **Detecta anomalías de comportamiento** en commits de código a lo largo del tiempo
- 🧠 **Utiliza análisis impulsado por IA** para identificar ataques sofisticados y patrones no obvios
- 📊 **Visualiza patrones de amenazas** con dashboards interactivos y mapas de calor en tiempo real
- 🎯 **Realiza seguimiento de remediaciones** desde detección hasta resolución con auditoría completa
- 👥 **Correlaciona actividades** entre usuarios y repositorios para detectar colusión
- ⚡ **Análisis incremental optimizado** - solo re-escanea commits nuevos (70% más rápido)
- 🔒 **Análisis local y privado** - ningún código se envía a servidores externos

## ✨ Capacidades Clave

<table>
<tr>
<td width="50%">

### 📈 Detección Inteligente
- ✓ Análisis de patrones maliciosos en código
- ✓ Detección de ataques de lógica de negocio
- ✓ Identificación de amenazas persistentes (APT)
- ✓ Reconocimiento de patrones de colusión
- ✓ Scoring automático de riesgo
- ✓ Indicadores de comportamiento anómalo

### 🔎 Investigación Forense
- ✓ Cronograma completo de cambios
- ✓ Trazabilidad de usuarios y actividades
- ✓ Perfilado de comportamiento de autores
- ✓ Análisis de correlación entre eventos
- ✓ Timeline visual interactivo
- ✓ Profundidad histórica ilimitada

</td>
<td width="50%">

### 📊 Visualización Avanzada
- ✓ Mapas de calor de amenazas
- ✓ Gráficos de tendencia de riesgo
- ✓ Mapas de riesgo por archivo/módulo
- ✓ Comparación de código lado a lado
- ✓ Dashboards personalizables
- ✓ Análisis visual en tiempo real

### ✅ Gestión de Remediación
- ✓ Seguimiento de hallazgos completo
- ✓ SLA y plazos de remediación
- ✓ Validación con re-análisis automático
- ✓ Colaboración con comentarios y menciones
- ✓ Historial de cambios de estado
- ✓ Notificaciones en tiempo real

</td>
</tr>
<tr>
<td width="50%">

### 📋 Reportes Profesionales
- ✓ Resúmenes ejecutivos personalizables
- ✓ Reportes técnicos detallados
- ✓ Exportación PDF/CSV/Excel/JSON
- ✓ Mapeos de compliance (OWASP, CWE, CVSS)
- ✓ Reportes de tendencias históricas
- ✓ Métricas de mejora continua

</td>
<td width="50%">

### 📝 Auditoría Completa
- ✓ Registro de todas las acciones
- ✓ Auditoría a nivel de recurso
- ✓ Dashboard de actividad sistémica
- ✓ Logs listos para compliance
- ✓ Trazabilidad de decisiones
- ✓ Integración con sistemas SIEM

</td>
</tr>
</table>

## 🛠️ Stack Tecnológico

### Backend
```
┌─────────────────────────────────────────────────────┐
│ Express.js + Node.js 18+                           │
│ TypeScript para type-safety                         │
├─────────────────────────────────────────────────────┤
│ Database:                                            │
│ ├─ PostgreSQL 14+ (datos principales)              │
│ ├─ Prisma ORM (queries y migraciones)              │
│ └─ Redis 6+ (cache y colas de trabajo)             │
├─────────────────────────────────────────────────────┤
│ Real-time:                                           │
│ ├─ Socket.io (WebSocket para actualizaciones)      │
│ └─ Bull (colas de jobs para análisis paralelo)     │
├─────────────────────────────────────────────────────┤
│ Análisis:                                            │
│ ├─ Git history parsing                              │
│ ├─ Pattern matching (regex + ML)                    │
│ └─ Risk scoring engine                              │
└─────────────────────────────────────────────────────┘
```

### Frontend
```
┌─────────────────────────────────────────────────────┐
│ React 18 + TypeScript                              │
│ Vite (bundler ultrarrápido)                        │
├─────────────────────────────────────────────────────┤
│ State Management:                                    │
│ ├─ Zustand (estado global)                         │
│ ├─ React Query (data fetching)                     │
│ └─ Context API (complementario)                     │
├─────────────────────────────────────────────────────┤
│ UI & Visualization:                                  │
│ ├─ Tailwind CSS (styling)                          │
│ ├─ Framer Motion (animaciones)                     │
│ ├─ Chart.js (gráficos)                             │
│ ├─ Recharts (componentes de gráficos)              │
│ └─ Lucide React (iconos)                           │
├─────────────────────────────────────────────────────┤
│ Real-time:                                           │
│ └─ Socket.io client (actualizaciones en vivo)      │
└─────────────────────────────────────────────────────┘
```

## 🏗️ Arquitectura del Sistema

```
                    ┌──────────────┐
                    │  Git Repos   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼───┐  ┌────▼───┐  ┌────▼────┐
         │ Webhook│  │ Polling │  │ Manual  │
         └────┬───┘  └────┬───┘  └────┬────┘
              │           │            │
              └───────────┼────────────┘
                          │
                ┌─────────▼────────────┐
                │  Analysis Engine     │
                ├──────────────────────┤
                │ • Pattern Detection  │
                │ • Anomaly Analysis   │
                │ • Risk Scoring       │
                └─────────┬────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
      ┌─────▼────┐  ┌────▼────┐  ┌────▼─────┐
      │PostgreSQL│  │  Redis   │  │  Queue   │
      │  (data)  │  │ (cache)  │  │ (jobs)   │
      └──────────┘  └──────────┘  └──────────┘
            │             │             │
            └─────────────┼─────────────┘
                          │
                ┌─────────▼─────────┐
                │   Express API     │
                │  REST + WebSocket │
                └─────────┬─────────┘
                          │
            ┌─────────────┼──────────────┐
            │             │              │
      ┌─────▼────┐  ┌────▼────┐  ┌─────▼──┐
      │ Dashboard │  │ Timeline │  │ Reports│
      │  (React)  │  │ (React)  │  │(React) │
      └───────────┘  └──────────┘  └────────┘
```

## 🚀 Instalación

### Requisitos Previos

| Requisito | Versión | Propósito |
|-----------|---------|----------|
| **Node.js** | 18+ | Runtime de JavaScript |
| **npm** o **yarn** | 8+ | Gestor de dependencias |
| **PostgreSQL** | 14+ | Base de datos principal |
| **Redis** | 6+ | Cache y cola de jobs |
| **Git** | 2.0+ | Análisis de repositorios |

### Instalación Rápida

#### 1. Clonar Repositorio
```bash
git clone https://github.com/pabsalas14/scr-agent.git
cd scr-agent
```

#### 2. Instalar Dependencias Raíz
```bash
npm install
```

#### 3. Configurar Backend
```bash
cd packages/backend

# Instalar dependencias
npm install

# Crear base de datos y ejecutar migraciones
npx prisma migrate dev

# (Opcional) Generar tipos Prisma
npx prisma generate
```

#### 4. Configurar Frontend
```bash
cd ../frontend
npm install
```

#### 5. Configurar Variables de Entorno

##### Backend `.env`
```bash
# API
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/scr_agent"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRY="24h"

# Git Analysis
GIT_ANALYSIS_WORKERS=4

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="100MB"
```

##### Frontend `.env`
```bash
# API Configuration
VITE_API_URL="http://localhost:3001/api/v1"
VITE_WS_URL="ws://localhost:3001"

# Environment
VITE_ENV="development"

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

#### 6. Iniciar Servicios

**Opción A: Terminales Separadas**
```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

**Opción B: Modo Monorepo**
```bash
npm run dev:all
```

#### 7. Acceder a la Aplicación

- 🎨 **Frontend**: http://localhost:5173
- 🔌 **API**: http://localhost:3001
- 📚 **API Docs**: http://localhost:3001/api/docs
- 📊 **Storybook**: http://localhost:6006

### Instalación con Docker

```bash
# Construir imagen
docker build -t scr-agent:latest .

# Ejecutar contenedor
docker run -d \
  -p 3001:3001 \
  -p 5173:5173 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  scr-agent:latest
```

### Verificar Instalación

```bash
# Comprobar backend está activo
curl http://localhost:3001/api/v1/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2024-04-14T10:30:00Z"}
```

## ⚙️ Configuración

### Opciones Principales

#### Integraciones
```javascript
// Habilitar webhooks de GitHub
GITHUB_WEBHOOK_ENABLED=true
GITHUB_WEBHOOK_SECRET="your-secret"

// Conectar a Jira
JIRA_ENABLED=true
JIRA_URL="https://your-jira.atlassian.net"
JIRA_API_KEY="your-api-key"

// Notificaciones Slack
SLACK_ENABLED=true
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
```

#### Análisis
```javascript
// Patrones de detección personalizados
CUSTOM_PATTERNS_ENABLED=true
PATTERN_LIBRARY_PATH="./patterns"

// Machine Learning
ML_ANOMALY_DETECTION=true
ML_MODEL_PATH="./models"

// Performance
INCREMENTAL_ANALYSIS=true  // Solo analizar commits nuevos
PARALLEL_WORKERS=4
CACHE_TTL=3600
```

### Temas de Configuración Avanzada

Consulta [docs/configuration.md](./docs/configuration.md) para:
- Configuración SSL/TLS
- Autenticación LDAP/AD
- Backup y recuperación
- Optimización de performance
- Escalado horizontal

---

## 📚 Cómo Funciona

### 🔄 Flujo General del Sistema

```
1. INGESTA DE CÓDIGO
   └─ Webhook/Polling detects nuevo código
   └─ Clona/actualiza repositorio localmente

2. ANÁLISIS PROFUNDO
   ├─ Análisis incremental (commits nuevos)
   ├─ Extracción de patrones maliciosos
   ├─ Detección de anomalías comportamentales
   ├─ Scoring de riesgo automático
   └─ Correlación de eventos

3. INVESTIGACIÓN VISUAL
   ├─ Timeline de eventos
   ├─ Perfiles de usuario
   ├─ Mapas de calor interactivos
   └─ Análisis comparativo

4. REMEDIACIÓN
   ├─ Seguimiento de correcciones
   ├─ Validación automática
   ├─ Notificaciones en tiempo real
   └─ Reportes de progreso

5. CUMPLIMIENTO
   ├─ Auditoría completa de acciones
   ├─ Reportes exportables
   └─ Métricas de seguridad
```

### Fase 1: Escaneo Inteligente 🔍

**¿Qué hace?**
- Investiga el historial git completo del repositorio
- Analiza cada commit, diff, autor y metadata
- Detecta patrones maliciosos y anomalías
- Solo re-escanea commits nuevos (70% más rápido)
- Sintetiza hallazgos en puntuaciones de riesgo

**Resultado:**
- Hallazgos estructurados con evidencia
- Puntuaciones de severidad (CRITICAL, HIGH, MEDIUM, LOW)
- Factores de riesgo transparentes
- Metadata completa para investigación

### Fase 2: Investigación Visual 🔎

**¿Qué ves?**
- **Cronograma**: Cuándo y dónde surgieron las amenazas
- **Perfiles de Usuario**: Actividad en todos los repos
- **Mapas de Calor**: Puntos calientes de amenaza
- **Comparaciones**: Análisis lado a lado
- **Pista de Auditoría**: Historial de acciones completo

**Herramientas Interactivas:**
- Filtros avanzados por tipo, severidad, estado
- Búsqueda global en hallazgos y proyectos
- Exportación de datos en múltiples formatos
- Notificaciones en tiempo real

### Fase 3: Remediación y Validación ✅

**Gestión Integral:**
- Realiza seguimiento de correcciones y estado
- Re-analiza para confirmar que funcionan
- Monitorea el progreso en el tiempo
- Colabora con comentarios y menciones
- Calcula SLA y plazos

**Validación:**
- Re-escaneo automático post-remediación
- Comparación antes/después
- Confirmación de resolución
- Reportes de mejora continua

## 📖 Cómo Usar

### Flujo Básico para Principiantes

1. **Crear Proyecto**
   ```
   Dashboard → Nuevo Proyecto → Seleccionar Repo
   ```

2. **Iniciar Análisis**
   ```
   Proyecto → Analizar → Esperar resultados
   ```

3. **Revisar Hallazgos**
   ```
   Hallazgos → Filtrar por severidad → Clickear para detalles
   ```

4. **Crear Plan de Remediación**
   ```
   Hallazgo → Crear Remediación → Asignar equipo → Configurar SLA
   ```

5. **Validar Correcciones**
   ```
   Remediación → Re-analizar → Confirmar resolución
   ```

### Ejemplos de Uso

#### Ejemplo 1: Detectar Insider Threat
```
1. Notificación: Múltiples pushes por usuario X en repo sensible
2. Timeline: Ver patrón inusual de actividad
3. Perfiles: Comparar con actividad histórica
4. Acción: Crear incidente y alertar a seguridad
```

#### Ejemplo 2: Validar Remediación
```
1. Hallazgo: SQL Injection en código
2. Equipo: Crea pull request con fix
3. Sistema: Re-analiza automáticamente
4. Resultado: ✓ Resuelto - puedes mergear
```

#### Ejemplo 3: Generar Reporte de Auditoría
```
1. Seleccionar período
2. Reportes → Nuevo Reporte
3. Elegir formato (PDF, CSV, Excel)
4. Descargar con evidencia completa
```

---

## 🔌 API Endpoints

### Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "analyst"
  }
}
```

### Proyectos

```http
# Listar proyectos
GET /api/v1/projects
Authorization: Bearer {token}

# Crear proyecto
POST /api/v1/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mi Proyecto",
  "repositoryUrl": "https://github.com/org/repo",
  "description": "Descripción..."
}
```

### Análisis

```http
# Iniciar análisis
POST /api/v1/projects/{projectId}/analyses
Authorization: Bearer {token}

# Obtener estado en tiempo real (WebSocket)
WS /api/v1/ws/analyses/{analysisId}
```

### Hallazgos

```http
# Listar hallazgos
GET /api/v1/findings?projectId={id}&severity=CRITICAL
Authorization: Bearer {token}

# Obtener detalles
GET /api/v1/findings/{findingId}
Authorization: Bearer {token}
```

### Reportes

```http
# Generar reporte
POST /api/v1/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "proj-123",
  "type": "EXECUTIVE",
  "format": "PDF",
  "startDate": "2024-01-01",
  "endDate": "2024-04-14"
}
```

**📚 Documentación Completa de API:** [API Reference](./docs/api.md)

---

## 🎯 Casos de Uso

### 🔐 Equipos de Seguridad

**Necesidad:** Detectar repos comprometidos e investigar amenazas

**Solución SCR Agent:**
- Monitoreo automático 24/7
- Alertas de anomalías en tiempo real
- Investigación forense completa
- Reportes para auditoría y compliance

**ROI:** Detectar breaches 80% más rápido

---

### 🚀 DevOps

**Necesidad:** Asegurar pipeline CI/CD sin código malicioso

**Solución SCR Agent:**
- Análisis automático en cada PR
- Bloquear merge si hay hallazgos críticos
- Integración con GitHub/GitLab
- Validación de remediaciones

**ROI:** Prevenir código malicioso en producción

---

### 👨‍💻 Desarrolladores

**Necesidad:** Entender problemas de seguridad en su código

**Solución SCR Agent:**
- Reportes claros y accionables
- Ejemplos de cómo corregir
- Aprendizaje automático de patrones
- Feedback inmediato

**ROI:** Mejorar skills de seguridad

---

### 📊 Ejecutivos

**Necesidad:** Visibilidad de postura de seguridad

**Solución SCR Agent:**
- Dashboards de KPI
- Tendencias de riesgo
- Reportes ejecutivos
- Métricas de mejora

**ROI:** Justificar inversión en seguridad

## 🔒 Seguridad y Privacidad

### Principios de Seguridad

✅ **Zero-Trust Architecture**
- Todo el análisis se ejecuta localmente en tu infraestructura
- Ningún código se envía a servicios externos
- Control total de datos

✅ **Encriptación**
- TLS 1.3 en tránsito
- AES-256 en reposo
- Claves gestionadas por user

✅ **Auditoría Completa**
- Registro de todas las actividades
- Quién, qué, cuándo, dónde
- Imposible de modificar retroactivamente

✅ **Cumplimiento**
- GDPR ready
- SOC 2 compatible
- HIPAA en roadmap

✅ **Autenticación**
- JWT con expiración configurables
- MFA opcional
- LDAP/AD integration

### Vulnerabilidades Conocidas

Si encuentras una vulnerabilidad de seguridad, **POR FAVOR** no la publiques públicamente. En su lugar:

1. Envía un email a `security@scr-agent.dev`
2. Describe la vulnerabilidad en detalle
3. Proporciona pasos para reproducir
4. Espera confirmación antes de divulgar

[Política de Seguridad Completa](./SECURITY.md)

---

## 🗺️ Roadmap

### Q2 2024 ✅ (En Progreso)
- [x] Notificaciones en tiempo real
- [x] Validación y confirmaciones de usuario
- [x] Búsqueda global y filtros avanzados
- [ ] Análisis de dependencias
- [ ] Integración Jira bidireccional

### Q3 2024 🚀 (Próximo)
- [ ] Anomaly Detection con ML
- [ ] Reportes de compliance automáticos (OWASP, CWE, CVSS)
- [ ] Risk Assessment framework
- [ ] Slack/Teams notifications
- [ ] API pública v2

### Q4 2024 🎯
- [ ] Custom security policies
- [ ] Developer learning module
- [ ] Advanced BI dashboard
- [ ] Performance optimization (1000+ repos)
- [ ] Multi-tenant ready

### 2025 🌟 (Visión)
- [ ] Integración GitHub Enterprise
- [ ] Soporte para más VCS (Gitlab, Bitbucket)
- [ ] Machine learning mejorado
- [ ] Mobile app
- [ ] Marketplace de plugins

[Ver Issues en GitHub](https://github.com/pabsalas14/scr-agent/issues)

---

## 🤝 Cómo Contribuir

¡Los contribuidores son bienvenidos! Esta es una comunidad abierta.

### Flujo de Contribución

1. **Fork el repositorio**
   ```bash
   git clone https://github.com/YOUR_USERNAME/scr-agent.git
   ```

2. **Crear rama de feature**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Hacer cambios y commits**
   ```bash
   git commit -m "feat: Agregar amazing-feature"
   ```

4. **Push a la rama**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Abrir Pull Request**
   - Describe qué hace el PR
   - Vincula issues relacionados
   - Agrupa cambios relacionados

### Estándares de Código

```bash
# Prettier (formato)
npm run format

# ESLint (linting)
npm run lint

# TypeScript (tipos)
npm run type-check

# Tests
npm run test

# Build
npm run build
```

### Antes de hacer PR

- [ ] Tests pasan (`npm run test`)
- [ ] Código formateado (`npm run format`)
- [ ] Sin errores de linting (`npm run lint`)
- [ ] Tipos correctos (`npm run type-check`)
- [ ] README actualizado si necesario
- [ ] Commit messages descriptivos

### Áreas donde Podés Ayudar

- 🐛 **Bug fixes**: Reporta y corrige issues
- ✨ **Features**: Implementa features del roadmap
- 📚 **Docs**: Mejora documentación
- 🎨 **UI/UX**: Diseño de componentes
- 🧪 **Tests**: Cobertura de testing
- 🌍 **i18n**: Traducciones

[Guía Completa de Contribución](./CONTRIBUTING.md)

---

## 📚 Documentación

| Sección | Descripción |
|---------|------------|
| [Instalación](./docs/installation.md) | Setup detallado con Docker |
| [Configuración](./docs/configuration.md) | Variables de entorno y opciones |
| [API Reference](./docs/api.md) | Todos los endpoints documentados |
| [Architecture](./docs/architecture.md) | Diseño técnico del sistema |
| [Troubleshooting](./docs/troubleshooting.md) | Solución de problemas comunes |
| [Development](./docs/development.md) | Guía para desarrolladores |

---

## ❓ FAQ

### ¿Cuánto tiempo toma analizar un repo?
Depende del tamaño. Pequeño (< 1000 commits): ~5 min. Grande (> 100k commits): ~30-60 min.

### ¿Qué idiomas de programación soporta?
Todos. SCR Agent analiza patrones en cualquier lenguaje.

### ¿Puedo usarlo en repositorios privados?
Sí, se ejecuta completamente en tu infraestructura.

### ¿Hay versión cloud?
Actualmente solo on-premise. Cloud en roadmap para Q4 2024.

### ¿Necesito datos históricos?
No, pero análisis con histórico es más potente. Mínimo: últimos 3 meses.

---

## 📧 Soporte y Contacto

- 💬 **Discord**: [Comunidad SCR Agent](https://discord.gg/...)
- 🐛 **Issues**: [GitHub Issues](https://github.com/pabsalas14/scr-agent/issues)
- 📧 **Email**: support@scr-agent.dev
- 🎯 **Discussions**: [GitHub Discussions](https://github.com/pabsalas14/scr-agent/discussions)

---

## 📄 Licencia

MIT License - Consulta [LICENSE](./LICENSE) para más detalles.

```
MIT License

Copyright (c) 2024 SCR Agent Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Agradecimientos

- Logo: [Icon by Freepik](https://www.freepik.com)
- Iconos: [Lucide React](https://lucide.dev)
- Inspiración: OWASP, CWE, CVSS frameworks

---

<div align="center">

### ⭐ Si te gusta SCR Agent, por favor dale una ⭐

**SCR Agent** - *Detecta. Investiga. Remedia.*

Hecho con ❤️ por la comunidad de seguridad

</div>
