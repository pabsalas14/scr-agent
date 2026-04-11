# FASE 3: NAVEGACIÓN Y SETTINGS - PLAN DETALLADO

**Status**: EN DESARROLLO  
**Timeline**: 6-8 horas  
**Objetivo**: Implementar navegación consistente y Settings funcional

---

## 🎯 Problema Identificado

### Navegación Inconsistente

**Situación actual**:
```
Sidebar (AppLayout.tsx)          MainDashboard.tsx
├─ Monitor Central ─────┐        TABS (internal)
├─ Proyectos           │        ├─ Monitor Central  
├─ Reportes            ├────→   ├─ Incidentes
├─ Analíticas          │        ├─ Investigaciones
├─ Incidentes          │        ├─ Reportes
├─ Investigaciones     │        ├─ Agentes IA
├─ Alertas             │        ├─ Sistema
└─ Configuración       │        ├─ Costos
                       └─       └─ Estadísticas
```

**Problema**: 
- Sidebar intenta navegar a URLs diferentes
- MainDashboard usa tabs internos en lugar de routing
- Usuario confundido sobre dónde ir para cada función
- Inconsistencia de UX

---

## ✅ SOLUCIÓN: Arquitectura de Navegación

### Opción 1: Routing Puro (RECOMENDADO)
Cada tab es una ruta separada:
```
/dashboard
/dashboard/projects
/dashboard/incidents
/dashboard/forensics
/dashboard/analyses
/dashboard/agents
/dashboard/system
/dashboard/costs
/dashboard/analytics
```

**Ventajas**: 
- ✅ URL refleja estado
- ✅ Bookmarkable
- ✅ Back button funciona correctamente
- ✅ Histórico de navegación claro

### Opción 2: Tabs Consolidados
Mantener MainDashboard con tabs pero mejorar
```
/dashboard?tab=projects
/dashboard?tab=incidents
/dashboard?tab=forensics
```

**Ventajas**:
- ✅ Cambios rápidos entre tabs
- ✅ Menor overhead de navegación

---

## 🔧 IMPLEMENTACIÓN RECOMENDADA

### Paso 1: Actualizar Router (ROUTING PURO)

```typescript
// router.tsx - Agregar rutas para cada vista
{
  path: 'dashboard',
  children: [
    { path: '', element: <Navigate to="projects" /> },
    { path: 'projects', element: <Dashboard /> },
    { path: 'incidents', element: <IncidentMonitor /> },
    { path: 'forensics', element: <ForensicsInvestigations /> },
    { path: 'analyses', element: <AnalysisMonitor /> },
    { path: 'agents', element: <AgentsMonitor /> },
    { path: 'system', element: <SystemMonitor /> },
    { path: 'costs', element: <CostsMonitor /> },
    { path: 'analytics', element: <AnalyticsDashboard /> },
  ]
}
```

### Paso 2: Actualizar Sidebar

```typescript
// Sidebar.tsx - Actualizar paths
const MENU_SECTIONS = [
  {
    section: 'INICIO',
    items: [
      { id: 'dashboard', label: 'Monitor Central', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    section: 'ANÁLISIS',
    items: [
      { id: 'projects', label: 'Proyectos', icon: Folder, path: '/dashboard/projects' },
      { id: 'analyses', label: 'Reportes', icon: FileText, path: '/dashboard/analyses' },
      { id: 'analytics', label: 'Analíticas', icon: BarChart3, path: '/dashboard/analytics' },
    ],
  },
  {
    section: 'SEGURIDAD',
    items: [
      { id: 'incidents', label: 'Incidentes', icon: Radio, path: '/dashboard/incidents' },
      { id: 'forensics', label: 'Investigaciones', icon: FileText, path: '/dashboard/forensics' },
      { id: 'alerts', label: 'Alertas', icon: ShieldAlert, path: '/dashboard/system' },
    ],
  },
];
```

### Paso 3: Eliminar MainDashboard Tabs

Reemplazar el componente MainDashboard que usa tabs con routing directo.

---

## 🔧 SETTINGS FUNCIONAL

### Problemas Actuales
1. UI existe pero no hace nada
2. No se guardan preferencias
3. Sin integración con backend

### Solución

**Backend - Crear endpoint**:
```
POST /api/v1/user-settings
GET /api/v1/user-settings
PUT /api/v1/user-settings/:id
```

**Frontend - SettingsModule.tsx**:
- Cargar preferencias del usuario desde API
- Permitir cambiar:
  - Tema (dark/light)
  - Notificaciones
  - Idioma
  - Zona horaria
- Guardar cambios en backend
- Confirmación visual de éxito

**Campos a soportar**:
```typescript
interface UserSettings {
  userId: string;
  theme: 'dark' | 'light';
  language: 'es' | 'en';
  timezone: string;
  notifications: {
    email: boolean;
    desktop: boolean;
    slack: boolean;
  };
  preferences: {
    defaultView: 'list' | 'grid';
    itemsPerPage: number;
    autoRefresh: boolean;
  };
}
```

---

## 📋 TAREAS ESPECÍFICAS

### 1. Router Redesign (2 horas)

- [ ] Actualizar `router.tsx` con rutas anidadas
- [ ] Eliminar tabs de MainDashboard
- [ ] Crear navegación basada en rutas
- [ ] Testing de navegación

**Archivos a modificar**:
- `src/routes/router.tsx`
- `src/components/Monitoring/MainDashboard.tsx`
- `src/components/Sidebar.tsx`

### 2. Settings Implementation (3 horas)

- [ ] Crear backend endpoints para settings
- [ ] Actualizar SettingsModule.tsx
- [ ] Implementar guardado de preferencias
- [ ] Agregar validación
- [ ] Testing end-to-end

**Archivos a crear/modificar**:
- `src/components/Settings/SettingsModule.tsx` (MODIFY)
- `src/hooks/useUserSettings.ts` (NEW)
- `src/services/settings.service.ts` (NEW)
- Backend: `/api/v1/user-settings` endpoints

### 3. WebSocket Integration (2 horas)

- [ ] Validar que useSocketEvents funciona
- [ ] Testing de notificaciones en real-time
- [ ] Mejorar reconexión automática
- [ ] Optimizar performance

**Archivos**:
- `src/hooks/useSocketEvents.ts`
- `src/services/socket.service.ts`

### 4. Testing & Validation (1 hora)

- [ ] Testing de navegación completa
- [ ] Validar WebSocket events
- [ ] Testing de Settings guardado
- [ ] Performance testing

---

## 🚀 EJECUCIÓN

### Versión Rápida (4 horas - MVVM)
1. Actualizar router para rutas claras
2. Limpiar sidebar
3. Testing básico de navegación
4. **Resultado**: Navegación consistente y clara

### Versión Completa (8 horas - FULL)
1. Routing completo
2. Settings con API backend
3. WebSocket validado
4. Performance optimizado
5. **Resultado**: Sistema production-ready

---

## ⚙️ CONFIGURACIÓN RECOMENDADA

Dado que estamos en FASE 3 y queremos avanzar rápido hacia producción:

**RECOMENDACIÓN**: Hacer la **Versión Rápida** (4 horas) ahora, y agregar Settings completo después si el tiempo lo permite.

**Por qué**:
- ✅ Ya tenemos validación frontend (FASE 2)
- ✅ Backend está completo (FASE 1)
- ✅ Datos son reales y consistentes
- ✅ Lo importante ahora es navegación clara
- ⏰ Settings es secundario para MVP

---

## 📈 PROGRESO ESPERADO DESPUÉS DE FASE 3

```
FASE 0: UX Foundation........................ ✅ 100%
FASE 1: Datos Auténticos................... ✅ 100%
FASE 2: Validación Frontend............... ✅ 100%
FASE 3: Navegación & Settings............. 🔄 EN CURSO
  - Routing consistente..................... ✅ IN PROGRESS
  - Settings funcional...................... ⏳ PENDING
  - WebSocket validado..................... ⏳ PENDING

FASE 4: Features Avanzadas (CI/CD, etc).. ⏳ PENDING (6-8 weeks)
```

**Resultado esperado**: Sistema operacional con navegación clara y datos reales.

---

## 📍 SIGUIENTE PASO

1. Implementar **Versión Rápida** de FASE 3 (4 horas)
2. Testing completo
3. Crear PR con cambios
4. Review y merge
5. Listo para FASE 4 (Features)

---

**Estado**: 🟡 LISTO PARA IMPLEMENTAR  
**Bloques**: Ninguno  
**Dependencias**: Ninguna (FASE 1 + 2 completas)
