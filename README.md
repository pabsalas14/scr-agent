# SCR Agent - Revisión de Código Fuente con Arquitectura MCP

**Source Code Review (SCR) Agent** es una herramienta de seguridad de código basada en **arquitectura MCP agentica** que identifica código malicioso, realiza análisis forense y genera reportes de riesgo.

## 🎯 Características Principales

### 1. **Agente Malicia** 🚨
- Detección de código malicioso, backdoors, y funciones sospechosas
- Análisis de patrones: lógica oculta, ofuscación, inyección
- Modelo: Claude 3.5 Sonnet
- Salida: Hallazgos con severidad, riesgos y recomendaciones

### 2. **Agente Forenses** 🔍
- Investigación de historial de Git
- Timeline de cambios sospechosos
- Correlación de commits y autores
- Modelo: Claude 3.5 Haiku
- Salida: Línea de tiempo interactiva

### 3. **Agente Síntesis** 📊
- Agregación de hallazgos
- Reportes ejecutivos
- Priorización de remediación
- Modelo: Claude 3.5 Sonnet
- Salida: PDF + JSON exportable

### 4. **Frontend Interactivo** 🎨
- Dashboard de gestión de proyectos
- Visualización dinámica de timeline (D3.js)
- Visor de reportes
- Estado de agentes en tiempo real

## 🏗️ Estructura del Proyecto

```
scr-agent/
├── packages/
│   ├── backend/          # MCP Server + Agentes
│   └── frontend/         # React Dashboard
├── tools/                # Utilidades compartidas
├── docs/                 # Documentación
└── turbo.json           # Configuración de monorepo
```

## 🔒 Seguridad

Implementamos **OWASP Top 10 2021** + **Top 10 API 2023**:
- ✅ Input validation y sanitización
- ✅ CORS restrictivo y Rate limiting
- ✅ JWT con expiración
- ✅ Logging y auditoría completa
- ✅ Secrets en variables de entorno
- ✅ Dependency scanning automático

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- pnpm 10.8+
- GitHub CLI (`gh`) autenticado

### Instalación

```bash
cd scr-agent
pnpm install
```

### Desarrollo

```bash
# Ejecutar todo en modo desarrollo
pnpm dev

# Ejecutar solo backend
pnpm dev --filter=backend

# Ejecutar solo frontend
pnpm dev --filter=frontend
```

### Testing

```bash
pnpm test
pnpm test:coverage
```

## 📚 Documentación

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura detallada
- [AGENT_SPECS.md](./docs/AGENT_SPECS.md) - Especificaciones de agentes
- [API_REFERENCE.md](./docs/API_REFERENCE.md) - Referencia de API
- [TIMELINE_FORMAT.md](./docs/TIMELINE_FORMAT.md) - Formato de timeline

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- TypeScript
- Claude SDK (Anthropic)
- simple-git para operaciones de Git
- Helmet para seguridad HTTP
- Winston para logging

### Frontend
- React 19
- D3.js para visualizaciones
- Tailwind CSS
- Vite

## 📈 Roadmap

- [x] Planeamiento y diseño
- [ ] Setup inicial del monorepo
- [ ] Agente Malicia MVP
- [ ] Agente Forenses MVP
- [ ] Agente Síntesis MVP
- [ ] Frontend Dashboard
- [ ] Timeline visualization
- [ ] Integration testing
- [ ] Deployment

## 📝 Licencia

MIT

## 👥 Autores

Creado con ❤️ usando Claude Code
