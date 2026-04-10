# SCR Agent - Plataforma de Inteligencia Forense de Código

> **Plataforma inteligente de análisis de código diseñada para detectar patrones maliciosos, amenazas de seguridad y repositorios comprometidos.**

## 🚀 ¿Qué es SCR Agent?

SCR Agent es una **plataforma inteligente de análisis forense de código** que analiza tus repositorios para detectar amenazas de seguridad, patrones de código malicioso y riesgos potenciales de insiders.

A diferencia de las herramientas tradicionales de análisis estático, SCR Agent:
- 🔍 **Detecta anomalías de comportamiento** en commits de código a lo largo del tiempo
- 🧠 **Utiliza análisis impulsado por IA** para identificar ataques sofisticados
- 📊 **Visualiza patrones de amenazas** con dashboards interactivos
- 🎯 **Realiza seguimiento de remediaciones** desde detección hasta resolución
- 👥 **Correlaciona actividades** entre usuarios y repositorios

## ✨ Capacidades Clave

### 📈 **Detección Inteligente de Amenazas**
- Analiza cambios de código para identificar patrones maliciosos
- Detecta ataques de lógica de negocio y bypasses de validación
- Identifica indicadores de amenaza persistente en repositorios
- Reconoce patrones de colusión cuando múltiples usuarios colaboran

### 🔎 **Investigación Forense**
- Visualización completa de cronograma de todos los cambios de código
- Trazabilidad de actividad de usuarios en todos los repositorios
- Perfilado de comportamiento de autor con detección de anomalías
- Puntuación de riesgo con desglose de factores transparentes

### 📊 **Análisis Visual**
- Mapas de calor interactivos que muestran densidad de amenaza en el tiempo
- Gráficos de tendencia de riesgo rastreando la evolución de la postura de seguridad
- Mapas de riesgo resaltando áreas de código vulnerable
- Comparaciones de código lado a lado para análisis de ataques

### ✅ **Gestión de Remediación**
- Realiza seguimiento de hallazgos desde detección hasta resolución
- Monitorea el progreso y plazos de remediación
- Valida correcciones con re-análisis automático
- Comenta y colabora en hallazgos

### 📋 **Reportes Comprehensivos**
- Resúmenes ejecutivos con puntuaciones de riesgo
- Reportes técnicos detallados con evidencia
- Reportes exportables en PDF/CSV para auditorías
- Reportes de comparación mostrando mejoras

### 📝 **Pista de Auditoría Completa**
- Realiza seguimiento de todas las acciones del usuario (quién hizo qué cuándo)
- Historial de auditoría a nivel de recurso
- Dashboard de actividad en todo el sistema
- Logging listo para cumplimiento

## 🏗️ Arquitectura

**Backend:**
- API Node.js + Express
- Base de datos PostgreSQL
- Cola Redis para análisis concurrente
- Motores de análisis impulsados por IA

**Frontend:**
- Dashboard React con visualizaciones
- Monitoreo de análisis en tiempo real
- Navegador de cronograma forense
- Seguimiento de remediaciones

## 🚀 Comenzando

### Requisitos Previos
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- Git

### Instalación

```bash
# Clonar e instalar
git clone https://github.com/your-org/scr-agent.git
cd scr-agent
npm install

# Configurar backend
cd packages/backend
npm install
npx prisma migrate dev

# Configurar frontend
cd ../frontend
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servicios
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

Visita `http://localhost:5173`

## 📚 Cómo Funciona

### Fase 1: Escaneo Inteligente
- Investiga el historial git completo
- Detecta patrones maliciosos y anomalías
- Solo re-escanea commits nuevos (mejora de 70% en rendimiento)
- Sintetiza hallazgos en puntuaciones de riesgo

### Fase 2: Investigación Visual
- Vista de Cronograma: cuándo y dónde surgieron las amenazas
- Perfiles de Usuario: actividad en todos los repos
- Mapas de Calor de Riesgo: puntos calientes de amenaza
- Pista de Auditoría: historial de acciones completo

### Fase 3: Remediación y Validación
- Realiza seguimiento de correcciones y estado de finalización
- Re-analiza para confirmar que las correcciones funcionan
- Monitorea el progreso en el tiempo
- Colabora con el equipo

## 🎯 Casos de Uso

- **Equipos de Seguridad**: Detectar repos comprometidos, investigar amenazas, generar reportes de auditoría
- **DevOps**: Monitorear salud, integrar en CI/CD, validar correcciones
- **Desarrolladores**: Entender problemas de seguridad, rastrear remediaciones
- **Ejecutivos**: Monitorear tendencias de seguridad, rastrear mejoras

## 🔒 Seguridad y Privacidad

- Todo el análisis se ejecuta localmente en tu infraestructura
- Ningún código se envía a servicios externos
- Base de datos encriptada en reposo
- Pista de auditoría de todas las actividades de plataforma

## 📖 Documentación

- [Guía de Instalación](./docs/installation.md)
- [Configuración](./docs/configuration.md)
- [Referencia de API](./docs/api.md)

## 📝 Licencia

MIT

---

**SCR Agent**: *Detecta. Investiga. Remedia.*
