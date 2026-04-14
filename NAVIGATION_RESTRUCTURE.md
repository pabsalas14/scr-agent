# Navigation Restructure - Fix Navigation Issues

**Status:** PLANNED  
**Date:** 2026-04-14  
**Priority:** HIGH - Affects entire UX

## Current State - Problems

### 1. Scattered Navigation (11 unorganized tabs)
```
Current TABS array:
├─ Monitor Central (dashboard)
├─ Proyectos
├─ Incidentes
├─ Investigaciones
├─ Seguridad
├─ Biblioteca
├─ Reportes
├─ Agentes IA
├─ Sistema
├─ Costos
└─ Estadísticas
```

**Issues:**
- ✗ No logical grouping or hierarchy
- ✗ Type mismatch: 'dashboard' not in Tab union type
- ✗ Mix of operational, analytical, and admin features in same level
- ✗ Difficult to find related features
- ✗ Hard to understand system structure

### 2. Cognitive Load
- Too many options at same level
- No "home" anchor point
- Admin features mixed with user features
- No clear separation of concerns

### 3. Frontend Code Issues
- Type definition mismatch (dashboard id not in type)
- No nested tab groups
- Hardcoded strings everywhere
- 11 different component imports for tab content

---

## Proposed Solution - Reorganized Navigation

### Structure: 5 Main Groups with Subgroups

```
MAIN MENU (5 primary sections)
├─ 🏠 INICIO (Home/Overview)
│  ├─ Monitor Central (dashboard overview, real-time status)
│  └─ Health Index (system health, capacity, alerts)
│
├─ 📊 ANÁLISIS (Analysis & Reporting)
│  ├─ Proyectos (project list, health, scoring)
│  ├─ Reportes (analysis history, findings summary)
│  ├─ Análisis Comparativo (two-analysis comparison)
│  └─ Histórico (trends, evolution over time)
│
├─ 🚨 SEGURIDAD (Security & Incidents)
│  ├─ Incidentes (critical findings tracker)
│  ├─ Hallazgos (detailed findings list with filters)
│  ├─ Alertas (notification rules and history)
│  ├─ Investigaciones Forenses (forensic analysis)
│  └─ Anomalías (anomaly detection results)
│
├─ 🔧 OPERACIONES (Operations & Automation)
│  ├─ Agentes IA (agent status and monitoring)
│  ├─ Sistema (system health, resources)
│  ├─ Costos (token usage, billing)
│  └─ Estadísticas (deep analytics, BI)
│
└─ ⚙️  CONFIGURACIÓN (Settings & Admin)
   ├─ Integraciones (GitHub, Jira, Slack)
   ├─ Webhooks (GitHub, custom webhooks)
   ├─ Usuarios (user management, roles)
   ├─ Preferencias (personal settings, notifications)
   └─ Biblioteca (documentation, help)
```

### Benefits
✓ Clear mental model (5 main areas)
✓ Related features grouped together
✓ Separation of concerns (analysis vs operations vs security)
✓ Admin features in own section
✓ Easier onboarding for new users
✓ Matches typical security platform layouts (Snyk, SonarQube, etc.)

---

## Implementation Plan

### Phase 1: Type Definitions & Constants
**File:** `/packages/frontend/src/types/navigation.ts` (NEW)

```typescript
// Navigation structure with proper typing
export interface TabGroup {
  groupId: 'inicio' | 'analisis' | 'seguridad' | 'operaciones' | 'configuracion';
  groupLabel: string;
  groupIcon: LucideIcon;
  tabs: TabDefinition[];
}

export interface TabDefinition {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
  component: React.ComponentType<any>;
  requiresAuth: boolean;
  roles?: string[]; // 'ADMIN', 'ANALYST', etc.
}

export type TabId = 
  | 'monitor-central'
  | 'proyectos'
  | 'incidentes'
  | 'investigaciones'
  | 'alertas'
  | 'anomalias'
  | 'reportes'
  | 'comparacion'
  | 'historico'
  | 'agentes'
  | 'sistema'
  | 'costos'
  | 'analytics'
  | 'integraciones'
  | 'webhooks'
  | 'usuarios'
  | 'preferencias'
  | 'biblioteca';
```

### Phase 2: Navigation Data Structure
**Update MainDashboard.tsx**

```typescript
const NAV_GROUPS: TabGroup[] = [
  {
    groupId: 'inicio',
    groupLabel: '🏠 INICIO',
    groupIcon: Home,
    tabs: [
      { id: 'monitor-central', label: 'Monitor Central', icon: Activity, ... },
    ]
  },
  {
    groupId: 'analisis',
    groupLabel: '📊 ANÁLISIS',
    groupIcon: TrendingUp,
    tabs: [
      { id: 'proyectos', label: 'Proyectos', icon: Shield, ... },
      { id: 'reportes', label: 'Reportes', icon: FileText, ... },
      { id: 'comparacion', label: 'Comparación', icon: BarChart3, ... },
      { id: 'historico', label: 'Histórico', icon: History, ... },
    ]
  },
  // ... more groups
];
```

### Phase 3: UI Components
**Components to update/create:**
- `NavigationSidebar.tsx` (NEW) - Vertical nav with group headers
- `NavigationBreadcrumb.tsx` (NEW) - Shows: Group > Current Tab
- `TabGroupHeader.tsx` (NEW) - Collapsible group headers
- Update `MainDashboard.tsx` - Use new structure

**Styling:**
- Group headers: subtle background, icon + text
- Tabs under groups: indented, highlight current
- Active group: expanded, current tab highlighted
- Inactive groups: collapsible, can collapse/expand

### Phase 4: Testing & Validation
- ✓ All 18+ tabs accessible
- ✓ No duplicate IDs
- ✓ Type safety (no more 'dashboard' missing from union)
- ✓ Navigation works with URL params
- ✓ Breadcrumb shows correct path
- ✓ Mobile responsive (sidebar collapses)

---

## Migration Path

**Step 1:** Create types and constants (new files)
**Step 2:** Create new NavigationSidebar component
**Step 3:** Update MainDashboard to use new structure
**Step 4:** Test all tabs, update links, fix bugs
**Step 5:** Remove old navigation code

---

## Files to Modify

```
NEW FILES:
- /packages/frontend/src/types/navigation.ts
- /packages/frontend/src/components/Navigation/NavigationSidebar.tsx
- /packages/frontend/src/components/Navigation/TabGroupHeader.tsx
- /packages/frontend/src/components/Navigation/NavigationBreadcrumb.tsx

MODIFIED FILES:
- /packages/frontend/src/components/Monitoring/MainDashboard.tsx
- /packages/frontend/src/types/api.ts (if needed)
```

---

## Success Criteria

- [x] Clear grouping of related features (5 main groups)
- [x] No type errors (all TabId values properly typed)
- [x] All 18 tabs accessible through new navigation
- [x] Navigation matches security platform conventions
- [x] URL navigation still works (?tab=...)
- [x] Mobile responsive
- [x] Breadcrumb shows current location
- [x] Logout and user profile accessible
- [x] Settings easily findable (in 5️⃣ CONFIGURACIÓN group)

---

## Before/After Examples

**Before:** "Where is the Webhook Manager?"  
→ User has to scan 11 items, doesn't know it's under Settings

**After:** "Settings are in CONFIGURACIÓN (5th menu)"  
→ User finds Webhooks in Integraciones submenu immediately

---

## Timeline
- **Phase 1-2:** 1 hour (types + constants)
- **Phase 3:** 1.5 hours (components + styling)
- **Phase 4:** 1 hour (testing + validation)
- **Total:** ~3.5 hours

---

## Additional Improvements (Post-Navigation)
1. Collapse/expand groups on demand
2. Search across all tabs
3. Favorites (star tabs to pin to top)
4. Keyboard shortcuts for navigation (Cmd/Ctrl + K)
5. Navigation tree in footer (legal, privacy, etc.)

