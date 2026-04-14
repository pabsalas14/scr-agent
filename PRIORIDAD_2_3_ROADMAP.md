# ROADMAP - PRIORIDAD 2 Y 3

**Status:** PRIORIDAD 2 Auditoría ✅ Completada | Fixes en progreso  
**Fecha:** 14 de abril, 2026

---

## 📊 PRIORIDAD 2 - MÓDULOS SECUNDARIOS

### ✅ VALIDADO - Todos los Módulos Funcionan

| Módulo | Status | Datos | Endpoint |
|--------|--------|-------|----------|
| **AlertsMonitor** | ✅ | 39 incidentes | `/findings/global?isIncident=true` |
| **SystemMonitor** | ✅ | CPU/RAM/Disk | `/monitoring/system-metrics` |
| **CostsMonitor** | ✅ | $0 (seed sin tokens) | `/monitoring/costs` |
| **AgentsMonitor** | ✅ | 3 agentes | `/monitoring/agents` |
| **AnalyticsDashboard** | ✅ | 50 findings, 24 CRITICAL | `/analytics/summary` |

### 🔴 BUGS ENCONTRADOS - 2 Issues

#### Bug #1: NavigationSidebar - Badge Hardcodeado (MEDIA)
- **Archivo:** `packages/frontend/src/components/Navigation/NavigationSidebar.tsx:103`
- **Problema:** `badge: 3` (hardcodeado) vs 39 (real)
- **Fix:** Hacer badge dinámico
- **Tiempo:** 30 minutos

#### Bug #2: Anomalies Routing (ALTA)
- **Archivo:** `packages/frontend/src/components/Monitoring/MainDashboard.tsx:144`
- **Problema:** case 'anomalias' → AnalyticsDashboard (incorrecto)
- **Fix:** Crear AnomaliesPage wrapper o importar correcto
- **Tiempo:** 1-2 horas (requiere crear nuevo componente)

---

## 🚀 PRIORIDAD 3 - NUEVAS FEATURES (13 features según plan original)

### Phase 0: UX Foundation (Week 1) - 🔴 CRÍTICO
```
1. Validación y Feedback Visual
   - Confirmation dialogs ✅ (parcial en PRIORIDAD 2)
   - Loading spinners ✅ (ya existen)
   - Form validation (TODO)
   - Toast notifications ✅ (ya existen)

2. Notificaciones en Tiempo Real
   - Notification center (TODO)
   - WebSocket eventos (TODO)
   - Notification preferences (TODO)

3. Búsqueda Global y Filtros Avanzados
   - Global search bar (PARCIAL)
   - Advanced filters (TODO)
   - Saved filters (TODO)

4. Análisis en Tiempo Real
   - Progress bar (TODO)
   - Real-time updates via WebSocket (TODO)
   - Execution history (TODO)
   - Cancel scan ability (TODO)
```

### Phase 1: CI/CD & Integrations (Week 1.5-2)
```
5. GitHub CI/CD Integration
   - Webhook receiver (EXISTE)
   - Auto-trigger analysis (TODO)
   - Block on critical findings (TODO)
   
6. Webhook Testing & Documentation
   - Test webhook delivery (EXISTE)
   - Event log viewer (EXISTE)
   - Payload documentation (TODO)

7. Remediation Tracking Enhanced
   - Audit trail (TODO)
   - Re-analysis after fix (TODO)
   - Verification workflow (TODO)
   - SLA tracking (TODO)
```

### Phase 2: External Integrations (Week 2-3)
```
8. Jira Integration
   - Auto-create tickets (TODO)
   - Bidirectional sync (TODO)
   - Field mapping (TODO)

9. Slack/Teams Notifications
   - Real-time alerts (TODO)
   - Status updates (TODO)
   - Configurable rules (TODO)

10. Gestión de Incidentes Enhanced
    - Assign to users (PARCIAL)
    - Comments (EXISTE)
    - SLA tracking (TODO)
    - Custom workflow states (TODO)

11. Alertas y Notificaciones Sistema
    - Custom alert rules (TODO)
    - Escalation policies (TODO)
    - Alert history (TODO)
```

### Phase 3: Compliance & Risk (Week 3-4)
```
12. Compliance Reports (OWASP/CWE/CVSS)
    - Auto-map to standards (TODO)
    - CVSS scoring (TODO)
    - Framework support (TODO)

13. Risk Management Module
    - Risk scoring (TODO)
    - Assessments (TODO)
    - Mitigation tracking (TODO)
```

---

## 📈 ESTADO GENERAL DEL PROYECTO

```
PRIORIDAD 1: ✅ COMPLETADA (100%)
├─ MainDashboard routing: ✅
├─ API calls (FindingsPanel, Comparison, Historical): ✅
├─ LibraryPage: ✅ (conectada a API)
├─ Search bar UI: ✅
└─ Seed data: ✅ (50 findings, 10 analyses, 5 projects)

PRIORIDAD 2: 🟡 EN PROGRESO (90%)
├─ Auditoría: ✅ COMPLETADA
├─ Módulos validados: ✅ 5/5
├─ Bugs identificados: 2
├─ Fixes en progreso: 1/2
└─ Validación final: PENDIENTE

PRIORIDAD 3: 🔴 NO INICIADA (0%)
└─ 13+ features por implementar
    ├─ UX Foundation (4 features)
    ├─ CI/CD & Integrations (3 features)
    ├─ External Integrations (4 features)
    ├─ Compliance & Risk (2 features)
    └─ Estimado: 6-8 semanas

TOTAL: ~80-90 horas de trabajo
```

---

## 🎯 SIGUIENTE PASO

¿Qué quieres que haga?

**Opción A:** Completar PRIORIDAD 2 (2 bugs fix + validation)
- Tiempo: 1-2 horas
- Resultado: Todos los módulos secundarios perfeccionados

**Opción B:** Comenzar PRIORIDAD 3 (UX Foundation - Phase 0)
- Tiempo: 1 semana
- Resultado: Confirmaciones, notificaciones, búsqueda avanzada

**Opción C:** Crear plan detallado de PRIORIDAD 3 sin implementar
- Tiempo: 2-3 horas
- Resultado: Arquitectura definida, listo para development

**Opción D:** Todo - Completar PRIORIDAD 2 + UX Foundation
- Tiempo: 3-4 semanas
- Resultado: Sistema profesional con todas las bases sólidas

---

*Auditoría completada: 2026-04-14 23:00 UTC*
*Sistema estable en PRIORIDAD 1, listo para PRIORIDAD 2/3*
