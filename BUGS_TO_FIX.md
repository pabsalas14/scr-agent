# 🔧 LISTA CRÍTICA DE BUGS Y FEATURES FALTANTES
## SCR Agent - Trabajo Pendiente

**Documento:** BUGS Y FEATURES INCOMPLETOS  
**Status:** ⚠️ REQUIERE FIXES INMEDIATOS  
**Prioridad:** CRÍTICO → ALTO → MEDIO

---

## 🔴 CRÍTICO - BLOQUEAN FUNCIONALIDAD

### 1. ASSIGNMENT PERSISTENCE BUG ⚠️ **PARCIALMENTE ARREGLADO**
**File:** `packages/frontend/src/components/Dashboard/FindingDetailModal.tsx`  
**Issue:** Cuando asignas un hallazgo a un usuario, se guarda en BD pero no persiste en la UI

**Status Actual:**
- ✅ Agregué `localAssignment` state para mantener valor persistente
- ✅ Actualicé `handleAssign()` para persistir localmente después de guardar
- ⚠️ Falta: Verificar que el endpoint backend `/findings/:id/assign` funciona

**What to Test:**
```
1. Abrir hallazgo
2. Seleccionar usuario en dropdown
3. Click "Asignar"
4. Verificar que el nombre del usuario se muestra "Asignado actualmente: [nombre]"
5. Reabrir hallazgo - debe mostrar la asignación
```

---

### 2. COMMENTS PERSISTENCE BUG ⚠️ **VERIFICAR**
**File:** `packages/frontend/src/components/Dashboard/CommentThread.tsx`  
**Service:** `packages/frontend/src/services/comments.service.ts`  
**Issue:** Comentarios no persisten en la BD

**Backend Requirements:**
- [ ] Tabla `Comment` debe existir en Prisma schema
- [ ] Endpoint `POST /findings/:id/comments` implementado
- [ ] Endpoint `GET /findings/:id/comments` implementado
- [ ] Endpoint `DELETE /findings/:id/comments/:id` implementado
- [ ] Endpoint `PUT /findings/:id/comments/:id` implementado

**Frontend Status:**
- ✅ UI completamente implementada
- ✅ Service completamente implementado
- ❌ Dependiente de endpoints backend

**Fix Effort:** 1-2 horas (backend)

---

### 3. FILTER CHIPS FEATURE MISSING ❌
**Component:** `packages/frontend/src/components/Dashboard/FindingsTracker.tsx`  
**Issue:** Código para filter chips existe pero NO ESTÁ CONECTADO A LA UI

**What's Missing:**
- [ ] Filter chips no se muestran en página de incidentes
- [ ] No hay severidad/status filters visibles
- [ ] No hay "Limpiar todo" button

**Frontend Files:**
- `/packages/frontend/src/components/Dashboard/FindingsTracker.tsx` - Tiene toda la lógica
- `/packages/frontend/src/pages/IncidentsPage.tsx` - No importa el componente correctamente

**Fix Effort:** 30 min (importar y conectar componente)

---

### 4. FALSE POSITIVE MARKING FEATURE MISSING ❌
**Issue:** No existe forma de marcar un hallazgo como "Falso Positivo"

**What's Missing:**
- [ ] Frontend: No hay botón/UI para marcar como FP
- [ ] Backend: No hay endpoint para actualizar status a FALSE_POSITIVE
- [ ] Status workflow: FALSE_POSITIVE debería estar como transición válida

**Fix Effort:** 2-3 horas

---

## 🟠 ALTO - IMPORTANTES

### 5. UNDO BUTTON INCOMPLETO ⚠️
**File:** `packages/frontend/src/components/Dashboard/FindingDetailModal.tsx` (líneas 144-165)  
**Issue:** Toast aparece pero NO HAY BOTÓN "Deshacer"

**What's Working:**
- ✅ Toast notification aparece después de cambiar status
- ✅ Mensaje: "Estado cambió a X"

**What's Missing:**
- ❌ Botón "Deshacer" en toast NO ESTÁ VISIBLE
- ❌ `toast.successWithAction()` existe pero puede no estar renderizando botón correctamente

**Fix:**
- Verificar `Toast.tsx` componente renderiza el botón cuando `action` prop existe
- Toast está siendo creado con action (línea 145-163), así que debería funcionar

**Fix Effort:** 30 min (debug + test)

---

### 6. REPORT EXPORT NOT FUNCTIONAL ❌
**Issue:** Reportes existen pero no se pueden descargar/exportar

**What's Missing:**
- [ ] Reportes no son clickeables
- [ ] No hay botón "Generar PDF"
- [ ] No hay botón "Exportar CSV"
- [ ] No hay botón "Descargar"

**Backend Requirements:**
- [ ] Endpoint `/reports/:id/export/pdf`
- [ ] Endpoint `/reports/:id/export/csv`
- [ ] Endpoint `/reports/:id/download`

**Frontend:**
- [ ] ReportViewer.tsx needs export buttons
- [ ] Integrate with backend export endpoints

**Fix Effort:** 2-3 horas

---

### 7. FORENSIC EVENTS MISSING ❌
**Issue:** Página de Investigaciones está vacía ("No hay eventos que mostrar")

**Root Cause:** No hay ForensicEvent records en BD

**Fix:**
- [ ] Agregar ForensicEvent seeding a `seed-fase1.ts`
- [ ] Crear ~60-100 eventos simulados
- [ ] Distribuir entre análisis

**Fix Effort:** 1 hora

---

## 🟡 MEDIO - IMPORTANTES PERO NO CRÍTICOS

### 8. SOCKET.IO EVENTS SYNC ⚠️
**Issue:** Real-time updates via WebSocket puede no estar sincronizando correctamente

**Status:**
- ✅ Socket conexión funciona
- ⚠️ Eventos pueden no dispararse correctamente cuando otros usuarios hacen cambios

**Backend Check:**
- [ ] Namespace `/socket.io` configurado
- [ ] Eventos `finding:updated`, `comment:added`, `assignment:changed` emitidos

**Fix Effort:** 1 hora (si hay issues)

---

### 9. MULTI-STEP LOADER NOT TESTABLE ⚠️
**File:** `packages/frontend/src/components/Dashboard/NuevoProyectoModerno.tsx`  
**Status:** ✅ Código implementado pero NO TESTABLE

**Issue:** Para probar necesitamos llenar el formulario de creación de proyecto

**What's Needed:**
- [ ] Formulario debe estar visible e implementado
- [ ] Testear que progress bar funciona 0-100%
- [ ] Testear que los 3 pasos se completan

**Fix Effort:** Requires full project creation flow test

---

## 📋 BACKEND ENDPOINTS REQUIRED

### Must Exist:
```
POST    /findings/:id/assign              - Asignar hallazgo a usuario
GET     /findings/:id/comments            - Obtener comentarios
POST    /findings/:id/comments            - Crear comentario
PUT     /findings/:id/comments/:commentId - Editar comentario
DELETE  /findings/:id/comments/:commentId - Eliminar comentario
POST    /findings/:id/status              - Cambiar status de hallazgo (EXIST ✅)
POST    /reports/:id/export/pdf           - Exportar reporte PDF
POST    /reports/:id/export/csv           - Exportar reporte CSV
GET     /findings/forensics               - Obtener eventos forenses
```

---

## 🎯 FIX PRIORITY ROADMAP

### Day 1 - CRITICAL FIXES (4 hours)
1. ✅ Fix Assignment Persistence (0.5h) - PARTIALLY DONE
2. ⏳ Verify Comments Endpoints Exist (1h) - BLOCKED ON BACKEND
3. ⏳ Connect Filter Chips Component (0.5h) - READY
4. ⏳ Fix/Verify Undo Button Toast (0.5h) - VERIFY UI RENDERING
5. ⏳ Add Forensic Events to Seed (1h) - QUICK FIX

### Day 2 - HIGH PRIORITY (6 hours)
6. Implement False Positive Feature (2h)
7. Implement Report Export (2h)
8. Complete Socket.IO sync (1h)
9. Test Project Creation Flow (1h)

### Day 3 - POLISH (4 hours)
10. E2E testing all workflows
11. Performance optimization
12. Error messages improvement

---

## 🧪 TEST CHECKLIST

### Before Claiming FIXED:
```
For each feature:
[ ] Feature works in UI (user can interact)
[ ] Data saved to database
[ ] Data persists after page reload
[ ] Data persists after closing modal
[ ] Toast/confirmation message shown
[ ] Undo/revert works if applicable
[ ] Multiple items maintain separate state
[ ] No console errors
[ ] No API errors (200 OK)
```

---

## 📝 WHAT TO DO NEXT

1. **IMMEDIATE:** Check which backend endpoints actually exist
   ```bash
   grep -r "findings.*assign\|comments" packages/backend/src/routes
   ```

2. **IMMEDIATE:** Run the app and test each broken feature
   - Check browser network tab for failed requests
   - Check backend logs for missing endpoints
   - Check database for missing tables

3. **THEN:** Create backend endpoints for:
   - Comments CRUD
   - Assignment updates
   - Forensic events

4. **THEN:** Fix frontend UI issues:
   - Connect filter chips
   - Fix undo button
   - Add report export buttons

5. **FINALLY:** Re-run comprehensive E2E tests

---

## 📊 COMPLETION METRICS

When all items below are ✅, system is PRODUCTION READY:

- [x] Routing (13/13 routes)
- [x] Authentication (auto-login works)
- [ ] Assignment Persistence (PARTIAL)
- [ ] Comments System (BLOCKED)
- [ ] Filter Chips (NOT CONNECTED)
- [ ] False Positive Feature (MISSING)
- [ ] Undo Button (VERIFY)
- [ ] Report Export (MISSING)
- [ ] Forensic Events (MISSING DATA)
- [ ] Socket.IO Sync (VERIFY)

---

**Generated:** April 11, 2026  
**Last Updated:** After Fix Attempt  
**Status:** 5/10 items complete or partially complete

