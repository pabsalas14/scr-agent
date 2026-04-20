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

### 6. ⚠️ Proyectos Muy Grandes (>1MB) No Se Pueden Analizar
- **Ubicación**: Inspector Agent `analizarArchivos()` - análisis de chunks secuencial
- **Problema**: 
  - Juice-shop tiene 1,446 chunks = 4+ horas de análisis secuencial
  - LM Studio timeout/fallo por volume de peticiones
  - qwen2.5-coder es lento (~10s por request)
  - Análisis nunca completa o falla con ECONNREFUSED
- **Impacto**: Usuarios no pueden escanear proyectos grandes (repos públicos, monorepos)
- **Prioridad**: HIGH
- **Causa Raíz**: 
  - Chunking secuencial ineficiente (1 chunk = 1 petición LLM)
  - Modelo LLM local demasiado lento
  - Sin límite de tamaño de proyecto
- **Área**: Backend - Inspector Agent, algoritmo de chunking
- **Solución Requerida**:
  - [ ] Limitar tamaño máximo de proyecto a 500KB (rechazar mayores)
  - [ ] Implementar análisis paralelo (máx 5 chunks en paralelo)
  - [ ] Mejorar compresión: remover comentarios, espacios en blanco
  - [ ] Considerar usar modelo más rápido o Anthropic para proyectos grandes
  - [ ] Implementar circuit breaker si N chunks fallan consecutivamente
- **Alternativa rápida**: Recomendar Anthropic Claude para proyectos > 500KB (10x más rápido)
- **Status (2026-04-20)**: PARCIALMENTE RESUELTO
  - ✅ Resilience strategy implementada (code compression, rate limiting, circuit breaker, health checks)
  - ✅ Timeout aumentado: 5 min → 15 min (todavía insuficiente para qwen7b)
  - ❌ Análisis falló en 10 minutos (qwen7b necesita 15-20 minutos por chunk)
  - 🔧 AJUSTE: Aumentado timeout adaptativo: 10/8/6 min → 20/18/15 min

### 7. 🔴 Progreso de Análisis Muestra 10% Incorrecto
- **Ubicación**: `/api/v1/analyses/{id}` - campo `progress`
- **Problema**: 
  - Progress está hardcodeado en worker: 10% (INSPECTOR) → 40% (DETECTIVE) → 70% (FISCAL) → 100% (COMPLETED)
  - Usuario ve 10% cuando realmente está en 1-2% (en tiempo real) o 7-8% (chunks procesados)
  - Progreso solo cambia cuando etapa cambia, no actualiza en tiempo real
- **Impacto**: Usuario no sabe progreso real del análisis, cree que está más avanzado de lo que está
- **Prioridad**: MEDIUM
- **Causa Raíz**: Worker no actualiza progress durante ejecución de etapa
- **Área**: Backend - `packages/backend/src/workers/analysis.worker.ts`
- **Solución Requerida**:
  - [ ] Calcular progreso real basado en chunks procesados
  - [ ] Actualizar DB cada N chunks (ej. cada 10 chunks)
  - [ ] Formula: (chunks_procesados / chunks_totales) * 10 + etapa_base
    - INSPECTOR: (prog_real) * 0.10
    - DETECTIVE: 10 + (prog_real) * 0.30
    - FISCAL: 40 + (prog_real) * 0.30
    - COMPLETED: 100
- **Ejemplo Real**: juice-shop en INSPECTOR
  - Chunks totales: 1500
  - Chunks procesados: 100
  - Progress real: (100/1500) * 10 = 0.67% (no 10%)
  - Progress mostrado: 10% ❌ (INCORRECTO)
  - Progress debería ser: ~0.67% ✅ (CORRECTO)

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
