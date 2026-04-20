# 📋 Deuda Técnica - SCR Agent

## Problemas Identificados (2026-04-20)

### 1. ❌ Dashboard "Agentes IA" Vacío
- **Ubicación**: `/operaciones/agentes` → Tab "Estado"
- **Problema**: Página muestra "Agentes IA" pero no carga datos de agentes
- **Impacto**: Usuario no puede ver estado de los agentes (Inspector, Detective, Fiscal)
- **Prioridad**: MEDIUM
- **Causa Raíz**: Por investigar - API posiblemente no retorna datos
- **Área**: Frontend + Backend API `/agents/status`

### 2. ❌ Dashboard "Centro de Control" Vacío
- **Ubicación**: `/operaciones/control`
- **Problema**: KPI cards muestran 0 valores, gráficos sin datos
- **Impacto**: No se visualiza gasto, MTTD, activity ni agent fleet status
- **Prioridad**: MEDIUM
- **Causa Raíz**: Por investigar - APIs posiblemente no retornan datos
- **Área**: Frontend + Backend APIs `/analytics/metrics`, `/agents/status`
- **Nota**: CommandCenter Component podría no estar conectado correctamente

### 3. ❌ Reportes No Funciona
- **Ubicación**: Cuando se intenta acceder a detalles de un reporte
- **Problema**: Error "ID de análisis inválido" o no carga reportes
- **Impacto**: Usuario no puede ver reportes de análisis completados
- **Prioridad**: MEDIUM
- **Causa Raíz**: Por investigar - Endpoint de reportes posiblemente fallando
- **Área**: Frontend ReportViewer + Backend `/reports/{analysisId}`

### 4. ⚠️ Histórico de Análisis Solo Muestra COMPLETED
- **Ubicación**: `/analisis/historico`
- **Problema**: Solo filtra análisis COMPLETED, no muestra FAILED/CANCELLED
- **Impacto**: Usuario no ve los 19 análisis fallidos en histórico
- **Prioridad**: LOW (Rollback hecho, cambio revertido)
- **Status**: DETENIDO - Se revertió el cambio que lo causaba
- **Solución Pendiente**: Implementar correctamente para mostrar todos sin romper reportes

### 5. ❌ Token de GitHub No Se Valida Ni Se Prueba
- **Ubicación**: Configuración → Integraciones → GitHub Token
- **Problema**: Token se guarda pero no se valida ni se muestra usuario conectado
- **Impacto**: Usuario no sabe si el token es válido o si está conectado a GitHub
- **Prioridad**: HIGH
- **Causa Raíz**: No hay endpoint de validación de token GitHub
- **Área**: Frontend SettingsModule + Backend API (falta endpoint)
- **Solución Requerida**: 
  - Crear `POST /github/verify-token` endpoint
  - Llamar GitHub API `/user` para validar y obtener username
  - Mostrar "✓ Conectado como @{username}"

### 6. ⚠️ Análisis Pueden Quedar Stuck Sin Timeout Global
- **Ubicación**: Inspector Agent `analizarArchivos()` - `Promise.all()` de chunks
- **Problema**: Si un chunk de código tarda indefinidamente, Promise.all() se cuelga sin recuperación
- **Impacto**: Worker stuck esperando indefinidamente, peticiones huérfanas a LM Studio
- **Prioridad**: MEDIUM
- **Status**: PARCIALMENTE ARREGLADO - Se añadió timeout global de 35 minutos (2026-04-20)
- **Solución Pendiente**: 
  - Mejorar manejo de errores en chunks individuales
  - Implementar circuit breaker si N chunks fallan
  - Opcionalmente: ejecutar chunks en paralelo limitado con control de concurrencia

---

## Fix Stack (Completado)

✅ Timeout Protection para LLM requests (5 min per request, 30 min total)
✅ Proper Cancellation de peticiones a LM Studio cuando usuario cancela
✅ Commit 1a0b85f: LLM request timeout con Promise.race()
✅ Commit 1a0b85f: Cancellation service con AbortController

---

## Plan de Resolución

### Fase 1: Verificar Juice-Shop Scan (Hoy)
- [ ] Ejecutar escaneo de juice-shop
- [ ] Verificar que analiza correctamente
- [ ] Confirmar que hallazgos se guardan

### Fase 2: Investigar Dashboards (Próxima Sprint)
- [ ] Debug Agentes IA vacío
- [ ] Debug Centro de Control
- [ ] Debug Reportes

### Fase 3: Mejorar Histórico (Próxima Sprint)
- [ ] Mostrar FAILED/CANCELLED sin romper reportes
- [ ] Agregar mensajes de error visibles

---

**Última actualización**: 2026-04-20 15:20
**Status**: En Progress - Esperando resultado de juice-shop scan
