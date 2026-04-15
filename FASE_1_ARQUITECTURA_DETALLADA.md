# FASE 1: AUDITORÍA ARQUITECTÓNICA DETALLADA - SCR AGENT

**Fecha de Análisis**: 2026-04-14  
**Lead QA**: Auditor de Calidad Riguroso  
**Estándar**: Cero Tolerancia a Errores - Data Parity Total

---

## **SECCIÓN 1: MAPEO FUNCIONAL EXHAUSTIVO**

### **1.1 ARQUITECTURA DEL STACK**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TIER 1: CLIENTE (Frontend)                        │
├──────────────────────────────────────────────────────────────────────────┤
│  Framework: React 19.0.0 + Vite 5.4.21                                   │
│  Package Manager: pnpm 10.8.1                                            │
│  TypeScript: 5.8.3 (Strict mode)                                         │
│  Puerto: 5173 (dev)                                                      │
│                                                                          │
│  Dependencias Críticas:                                                  │
│  • React Query 5.28.0 (async state)                                     │
│  • Zustand 5.0.12 (global state)                                        │
│  • React Router 7.13.2 (routing)                                        │
│  • Socket.io-client 4.7.2 (WebSocket real-time)                         │
│  • D3 7.8.5 + Recharts 3.8.1 (visualización)                           │
│  • Framer Motion 10.16.19 (animaciones)                                 │
│  • Tailwind CSS 3.4.1 (styling)                                         │
│  • Zod 3.22.4 (validación schemas)                                      │
└──────────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP REST + WebSocket
┌──────────────────────────────────────────────────────────────────────────┐
│                    TIER 2: API (Backend Express.js)                       │
├──────────────────────────────────────────────────────────────────────────┤
│  Framework: Express 4.18.2 + TypeScript 5.8.3                           │
│  Puerto: 3000                                                            │
│  Node.js: >= 18.19.1                                                    │
│  Package Manager: pnpm 10.8.1                                           │
│                                                                          │
│  Middleware Stack:                                                       │
│  1. helmet() - Headers de seguridad HTTP                                │
│  2. cors() - CORS habilitado para localhost:5173-5179, :5200            │
│  3. rateLimit - 10k requests/15min por IP (desarrollo)                  │
│  4. express.json() - Body limit: 10MB                                   │
│  5. cookieParser() - Manejo de cookies HttpOnly                         │
│  6. authMiddleware - JWT en header Authorization                        │
│  7. auditMiddleware - Logging de todas las acciones                     │
│                                                                          │
│  Total Rutas API: 23 grupos (129 endpoints)                             │
│  Endpoints Críticos:                                                     │
│  • /api/v1/projects/* (CRUD de proyectos)                               │
│  • /api/v1/analyses/* (Gestión análisis)                                │
│  • /api/v1/findings/* (Hallazgos)                                       │
│  • /api/v1/remediation/* (Remediaciones)                                │
│  • /api/v1/github/* (Integración GitHub)                                │
│  • [15 más...] (comentarios, notificaciones, webhooks, etc)             │
└──────────────────────────────────────────────────────────────────────────┘
                    ↓ Prisma ORM + Bull Queue
┌──────────────────────────────────────────────────────────────────────────┐
│                         TIER 3: DATOS & COLAS                            │
├──────────────────────────────────────────────────────────────────────────┤
│  Database: PostgreSQL (via Prisma 5.8.0)                                │
│  Cache: node-cache 5.1.2 (in-memory)                                    │
│  Queue: BullMQ 5.10.0 + Redis 4.6.12                                    │
│  Redis URL: redis://localhost:6379 (por defecto)                        │
│  QUEUE_NAME: "analyses_queue"                                            │
│  ANALYSIS_CONCURRENCY: 1 (procesa 1 análisis a la vez)                  │
│                                                                          │
│  Tablas Clave:                                                           │
│  • users (autenticación)                                                │
│  • projects (repositorios a analizar)                                   │
│  • analyses (ejecutiones de análisis)                                   │
│  • findings (hallazgos de seguridad)                                    │
│  • forensic_events (timeline Git)                                       │
│  • remediation_actions (gestión de fixes)                               │
│  • reports (síntesis final)                                             │
│  • analysis_jobs (tracking Bull queue)                                  │
│  [+ 12 más]                                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### **1.2 AGENTES IA (MCP - Model Context Protocol)**

#### **Inspector Agent (MALICIA)**
```
Nombre: InspectorAgentService
Modelo: claude-sonnet-4-6
Propósito: Detectar código malicioso, vulnerabilidades, backdoors

Entrada Esperada:
  {
    archivos: Array<{ path: string, content: string }>,
    contexto?: string
  }

Procesamiento:
  1. Chunking automático (max 500KB por chunk)
  2. Hash del código para caché (node-cache)
  3. Envío a Claude con prompt específico
  4. Parsing JSON response

Salida Esperada:
  {
    hallazgos: [
      {
        archivo: string,
        funcion?: string,
        rango_lineas: [number, number],  // ej: [45, 52]
        fragmento_codigo: string,
        severidad: "CRÍTICO" | "ALTO" | "MEDIO" | "BAJO",
        tipo_riesgo: "PUERTA_TRASERA" | "INYECCION" | "BOMBA_LOGICA" | 
                     "OFUSCACION" | "SOSPECHOSO" | "HARDCODED_VALUES" | "ERROR_HANDLING",
        por_que_sospechoso: string,
        confianza: float (0.0-1.0),
        pasos_remediacion: string[]
      }
    ],
    resumen: string,
    cantidad_hallazgos: number,
    tiempo_ejecucion_ms: number,
    usage: {
      input_tokens: number,
      output_tokens: number,
      model: string
    }
  }

Mapeo a BD (en analysis.worker.ts, línea 209-231):
  Finding {
    analysisId,
    severity: mapSeverity(hallazgo.severidad),      // CRITICAL|HIGH|MEDIUM|LOW
    riskType: mapRiskType(hallazgo.tipo_riesgo),    // BACKDOOR|INJECTION|...
    file: hallazgo.archivo,
    lineRange: "45-52",                              // string format
    codeSnippet: hallazgo.fragmento_codigo,
    whySuspicious: hallazgo.por_que_sospechoso,
    remediationSteps: hallazgo.pasos_remediacion,    // string[]
    confidence: hallazgo.confianza
  }

Timeouts:
  - Max 5 minutos por análisis
  - Si timeout: throw Error("Inspector Agent timeout (5 minutos)")
  - Error propagates a Bull retry (3 intentos max)

Caché:
  - CacheType.MALICIA_FINDING
  - Key: hash(código)
  - TTL: default del cacheService
```

#### **Detective Agent (FORENSES)**
```
Nombre: DetectiveAgentService
Modelo: claude-haiku-4-5-20251001
Propósito: Investigar historial Git, timeline de commits

Entrada Esperada:
  {
    hallazgos_malicia: MaliciaFinding[],
    historial_commits: CommitInfo[]
  }

CommitInfo estructura:
  {
    hash: string,
    author: string,
    email?: string,
    timestamp: Date,
    message: string,
    // ...
  }

Procesamiento:
  1. Construir prompt con hallazgos + commits
  2. Enviar a Claude Haiku
  3. Parsear JSON response
  4. Analizar patrones sospechosos

Salida Esperada:
  {
    eventos: [
      {
        timestamp: ISO8601,
        commit: string (SHA),
        autor: string,
        archivo: string,
        funcion?: string,
        accion: "AGREGADO" | "MODIFICADO" | "ELIMINADO" | "RENOMBRADO",
        mensaje_commit: string,
        resumen_cambios: string,
        nivel_riesgo: "ALTO" | "MEDIO" | "BAJO",
        indicadores_sospecha: string[]
      }
    ],
    patrones: string[],
    autores_sospechosos: string[],
    resumen_forense: string,
    tiempo_ejecucion_ms: number,
    usage: { input_tokens, output_tokens, model }
  }

Mapeo a BD (en analysis.worker.ts, línea 272-285):
  ForensicEvent {
    analysisId,
    findingId?,                            // Linked to Finding
    commitHash: evento.commit,
    commitMessage: evento.mensaje_commit,
    author: evento.autor,
    action: evento.accion,                 // enum: ADDED|MODIFIED|DELETED|RENAMED
    file: evento.archivo,
    function: evento.funcion,
    changesSummary: evento.resumen_cambios,
    riskLevel: evento.nivel_riesgo,        // Severity enum
    suspicionIndicators: evento.indicadores_sospecha,
    timestamp: new Date(evento.timestamp)
  }

Timeouts:
  - Max 3 minutos por análisis
  - Si timeout: throw Error("Detective Agent timeout (3 minutos)")
```

#### **Fiscal Agent (SÍNTESIS)**
```
Nombre: FiscalAgentService
Modelo: claude-sonnet-4-6
Propósito: Sintetizar hallazgos + timeline, generar reporte ejecutivo + risk score

Entrada Esperada:
  {
    hallazgos_malicia: MaliciaFinding[],
    linea_tiempo_forenses: EventoForense[],
    contexto_repo?: string
  }

Procesamiento:
  1. Agregar hallazgos + eventos
  2. Enviar a Claude
  3. Parsear JSON response
  4. Validar puntuación_riesgo ∈ [0, 100]

Salida Esperada:
  {
    resumen_ejecutivo: string,               // 2-3 párrafos
    desglose_severidad: {
      CRÍTICO: number,
      ALTO: number,
      MEDIO: number,
      BAJO: number
    },
    funciones_comprometidas: string[],
    linea_de_ataque: string,
    prioridad_remediacion: [
      {
        orden: number,
        accion: string,
        justificacion: string,
        urgencia: "CRÍTICA" | "ALTA" | "MEDIA"
      }
    ],
    autores_afectados: string[],
    puntuacion_riesgo: number (0-100),
    recomendacion_general: string,
    cantidad_hallazgos: number,
    tiempo_ejecucion_ms: number,
    usage: { input_tokens, output_tokens, model }
  }

Mapeo a BD (en analysis.worker.ts, línea 325-342):
  Report {
    analysisId,
    riskScore: puntuacion_riesgo,
    executiveSummary: resumen_ejecutivo,
    findingsCount: cantidad_hallazgos,
    severityBreakdown: desglose_severidad,
    compromisedFunctions: funciones_comprometidas,
    affectedAuthors: autores_afectados,
    remediationSteps: prioridad_remediacion,
    generalRecommendation: recomendacion_general,
    inputTokens: totalInput (sum de todos los agentes),
    outputTokens: totalOutput,
    model: "claude-3-5-sonnet" (hardcoded)
  }

Timeouts:
  - Max 2 minutos por análisis
  - Si timeout: throw Error("Fiscal Agent timeout (2 minutos)")

Cost Tracking:
  - Inspector input + output
  - Detective input + output
  - Fiscal input + output
  - Se suma y persiste en Report.inputTokens/outputTokens
```

### **1.3 SERVICIOS BACKEND (29 Servicios Identificados)**

| Servicio | Responsabilidad | Métodos Clave |
|----------|-----------------|-----------------|
| prisma | ORM + BD connection | findUnique, create, update, delete |
| logger | Winston logging + auditoría | info, error, warn, auditLog |
| crypto | Encriptación/desencriptación | encrypt, decrypt |
| analysis-queue | Encolado en Bull | enqueueAnalysis, cancelAnalysis |
| mcp-orchestrator | Orquestación agentes | orchestrate |
| incremental-analysis | Análisis delta | getNewCommits, shouldBeIncremental |
| findings | CRUD findings + statusHistory | getFinding, updateStatus |
| remediation | Gestión remediaciones | createRemediation, updateRemediation |
| git | Clone, pull, log, diff | cloneOrPullRepository, readFiles, getCommitHistory |
| code-diff | Análisis de diffs | generateDiff |
| socket | WebSocket real-time | emit*, on* |
| notifications | Notificaciones sistema | sendNotification, createNotification |
| report-generator | Generación PDF/JSON | generatePDF, generateJSON |
| risk-scoring | Cálculo puntuaciones | calculateRiskScore |
| cache | Caching in-memory | get, set |
| [+ 14 más] | ... | ... |

### **1.4 ESTRUCTURA DE RUTAS API (129 Endpoints)**

```
/api/v1/
├── auth/                       (6 endpoints)
│   ├── POST /login
│   ├── POST /signup
│   ├── POST /logout
│   ├── POST /refresh-token
│   └── ...
├── users/                      (8 endpoints)
│   ├── GET / - listar usuarios
│   ├── GET /:id - perfil
│   ├── PATCH /:id - actualizar
│   └── ...
├── user-settings/              (6 endpoints)
│   ├── GET / - obtener settings
│   ├── PATCH / - actualizar settings
│   ├── PATCH /github-token - validar token GitHub
│   └── ...
├── projects/                   (12 endpoints)
│   ├── GET / - listar proyectos
│   ├── GET /:id - obtener detalles
│   ├── POST / - crear proyecto
│   ├── PATCH /:id - actualizar
│   ├── DELETE /:id - eliminar
│   ├── POST /:id/analyses - iniciar análisis
│   └── ...
├── analyses/                   (8 endpoints)
│   ├── GET / - historial global
│   ├── GET /:id - estado análisis
│   ├── GET /:id/findings - hallazgos
│   ├── GET /:id/forensics - timeline
│   ├── GET /:id/report - reporte final
│   ├── POST /:id/cancel - cancelar
│   └── ...
├── findings/                   (15 endpoints)
│   ├── GET /global - todos los hallazgos
│   ├── GET /analysis/:analysisId - por análisis
│   ├── POST /:id/assign - asignar a usuario
│   ├── PATCH /:id/status - cambiar estado
│   ├── POST /:id/comment - agregar comentario
│   └── ...
├── remediation/                (8 endpoints)
│   ├── GET / - listar remediaciones
│   ├── GET /:id - obtener detalles
│   ├── POST / - crear remediación
│   ├── PATCH /:id - actualizar estado
│   ├── POST /:id/comment - agregar comentario
│   └── ...
├── reports/                    (6 endpoints)
│   ├── GET /analyses/:id - obtener reporte
│   ├── GET /analyses/:id?format=pdf - descargar PDF
│   ├── GET /analyses/:id?format=json - descargar JSON
│   └── ...
├── notifications/              (5 endpoints)
│   ├── GET / - obtener notificaciones
│   ├── PATCH /:id/read - marcar como leído
│   └── ...
├── comments/                   (6 endpoints)
│   ├── GET /finding/:id - comentarios
│   ├── POST /finding/:id - agregar comentario
│   ├── PATCH /:id - editar
│   └── ...
├── github/                     (12 endpoints)
│   ├── POST /validate - validar token
│   ├── GET /repos - listar repos usuario
│   ├── POST /webhook - webhook handler
│   └── ...
├── webhooks/                   (8 endpoints)
│   ├── GET / - listar webhooks
│   ├── POST / - crear webhook
│   ├── PATCH /:id - actualizar
│   └── ...
├── analytics/                  (10 endpoints)
│   ├── GET /trends - tendencias
│   ├── GET /risk-distribution - distribución riesgo
│   └── ...
├── monitoring/                 (12 endpoints)
│   ├── GET /health - health check
│   ├── GET /queue-status - estado Bull queue
│   └── ...
└── [6 más: search, timeline, audit, detection, code-analysis, settings]
```

---

## **SECCIÓN 2: MATRIZ DE FLUJO DE VIDA COMPLETO (ULTRA-DETALLADO)**

### **FASE 0: SETUP INICIAL**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 0.1: Usuario se registra                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: POST /api/v1/auth/signup                                      │
│ Request Body:                                                            │
│   {                                                                       │
│     "email": "user@example.com",     [VALIDACIÓN: email único, formato] │
│     "password": "secure123",         [VALIDACIÓN: >= 8 chars, complejidad]
│     "name": "John Doe"               [VALIDACIÓN: <= 255 chars]          │
│   }                                                                       │
│                                                                          │
│ Acciones BD:                                                             │
│   1. INSERT users {                                                      │
│        id: CUID (24 chars alphanumeric),                                │
│        email: unique,                                                    │
│        passwordHash: bcrypt(password, rounds=12),                       │
│        createdAt: now(),                                                │
│        updatedAt: now()                                                 │
│      }                                                                    │
│   2. INSERT user_settings {                                             │
│        userId: reference,                                                │
│        darkMode: false,                                                 │
│        autoRefresh: 10000 (ms)                                          │
│      }                                                                    │
│   3. INSERT notification_preferences {                                  │
│        userId: reference,                                                │
│        enableAssignments: true,                                         │
│        enableStatusChanges: true,                                       │
│        enableRemediations: true,                                        │
│        enableComments: true                                             │
│      }                                                                    │
│                                                                          │
│ Response 201:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "data": {                                                            │
│       "id": "user_cuid_123",                                            │
│       "email": "user@example.com",                                      │
│       "name": "John Doe",                                               │
│       "createdAt": "2026-04-14T10:30:00Z"                              │
│     },                                                                    │
│     "token": "jwt_token_here"        [HttpOnly cookie o header]         │
│   }                                                                       │
│                                                                          │
│ Validaciones Data Parity:                                               │
│   ✓ BD.users[id].email === response.email                              │
│   ✓ BD.users[id].createdAt === response.createdAt                      │
│   ✓ BD.user_settings existe con userId = id                            │
│   ✓ passwordHash != "user@example.com" (encriptado)                    │
│   ✓ BD.user_roles existe (VIEWER por defecto)                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 0.2: Usuario configura GitHub Token                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: PATCH /api/v1/user-settings/github-token                     │
│ Headers: Authorization: Bearer {token}                                  │
│ Request Body:                                                            │
│   {                                                                       │
│     "githubToken": "ghp_xxxxxxxxxxxxxxxxxxxx"                           │
│   }                                                                       │
│                                                                          │
│ Acciones:                                                                │
│   1. Descifrar token si existe uno anterior (para comparar)             │
│   2. Validar nuevo token con GitHub API:                                │
│      GET https://api.github.com/user                                    │
│      Headers: Authorization: token {githubToken}                        │
│      Si 401 → return error "Invalid token"                              │
│   3. Encriptar token con crypto.encrypt()                               │
│   4. UPDATE user_settings {                                             │
│        githubToken: encrypted,                                          │
│        githubValidatedAt: now()                                         │
│      }                                                                    │
│   5. CREATE AuditLog {                                                  │
│        userId,                                                           │
│        action: "configure_github",                                      │
│        resourceType: "user_settings",                                   │
│        details: { token_last4: "xxxx" }  [NUNCA plaintext]              │
│      }                                                                    │
│                                                                          │
│ Response 200:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "message": "GitHub token validated and saved",                      │
│     "validatedAt": "2026-04-14T10:35:00Z"                              │
│   }                                                                       │
│                                                                          │
│ Validaciones Data Parity:                                               │
│   ✓ decrypt(BD.user_settings.githubToken) === "ghp_xxx..."             │
│   ✓ BD.user_settings.githubValidatedAt != null                         │
│   ✓ GET /api/v1/user-settings NUNCA retorna githubToken plaintext      │
│   ✓ Audit log registra acción                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### **FASE 1: CREACIÓN Y CONFIGURACIÓN DE PROYECTO**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 1.1: Crear Proyecto                                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: POST /api/v1/projects                                         │
│ Headers: Authorization: Bearer {token}                                  │
│ Request Body:                                                            │
│   {                                                                       │
│     "name": "MyAPI",                   [VALIDACIÓN: 1-255 chars]         │
│     "description": "GraphQL API",      [VALIDACIÓN: <= 500 chars]        │
│     "repositoryUrl": "https://github.com/user/repo",                   │
│                                        [VALIDACIÓN: URL válida, UNIQUE]  │
│     "branch": "main",                  [VALIDACIÓN: rama válida, <= 255] │
│     "scope": "REPOSITORY",             [ENUM: REPOSITORY|ORGANIZATION]  │
│     "githubToken": "ghp_xxx"           [OPT: Token privado del proyecto] │
│   }                                                                       │
│                                                                          │
│ Validaciones Iniciales:                                                 │
│   ✓ repositoryUrl es HTTP(S) URL válida                                 │
│   ✓ repositoryUrl única en BD (constraints[repositoryUrl])              │
│   ✓ Usuario autenticado (userId != null)                                │
│   ✓ Número de proyectos del usuario < límite (ej: 100)                 │
│                                                                          │
│ Acciones BD:                                                             │
│   1. INSERT projects {                                                   │
│        id: CUID,                                                         │
│        name: "MyAPI",                                                    │
│        description: "GraphQL API",                                       │
│        repositoryUrl: "https://github.com/user/repo",                   │
│        branch: "main",                                                   │
│        scope: "REPOSITORY",                                              │
│        githubToken: encrypt(githubToken) si existe,                      │
│        userId: {userId},                                                 │
│        maxFileSizeKb: 150 (default),                                    │
│        maxTotalSizeMb: 2 (default),                                     │
│        maxDirectoryDepth: 6 (default),                                  │
│        maxCommits: 50 (default),                                        │
│        createdAt: now(),                                                │
│        updatedAt: now()                                                 │
│      }                                                                    │
│   2. CREATE AuditLog {                                                  │
│        userId,                                                           │
│        action: "create",                                                │
│        resourceType: "project",                                         │
│        resourceId: projectId,                                           │
│        details: { name, repositoryUrl }                                 │
│      }                                                                    │
│                                                                          │
│ Response 201:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "data": {                                                            │
│       "id": "project_cuid_456",                                         │
│       "name": "MyAPI",                                                   │
│       "repositoryUrl": "https://github.com/user/repo",                  │
│       "branch": "main",                                                  │
│       "createdAt": "2026-04-14T11:00:00Z",                             │
│       "userId": "user_cuid_123"                                         │
│     }                                                                     │
│   }                                                                       │
│                                                                          │
│ Validaciones Data Parity:                                               │
│   ✓ BD.projects[id].name === response.name                              │
│   ✓ BD.projects[id].repositoryUrl === request.repositoryUrl             │
│   ✓ BD.projects[id].userId === {userId autenticado}                     │
│   ✓ BD.projects[id].createdAt === response.createdAt (±1 segundo)       │
│   ✓ Si githubToken proporcionado: encriptado en BD                      │
│   ✓ AuditLog.resourceId === projectId                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 1.2: Validar Acceso a Repositorio                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: POST /api/v1/github/validate-access                          │
│ Headers: Authorization: Bearer {token}                                  │
│ Request Body:                                                            │
│   {                                                                       │
│     "projectId": "project_cuid_456"                                     │
│   }                                                                       │
│                                                                          │
│ Acciones:                                                                │
│   1. Obtener project por ID                                             │
│      Si no existe: return 404 "Project not found"                       │
│                                                                          │
│   2. Obtener GitHub token (user's token o project token)               │
│      • Si proyecto tiene githubToken: desencriptar y usar               │
│      • Si no: obtener de user_settings y desencriptar                  │
│      • Si ninguno: usar env.GITHUB_TOKEN (fallback)                    │
│                                                                          │
│   3. Ejecutar git clone con timeout 30 segundos:                        │
│      Command: git clone --depth=1 --branch={branch} \                  │
│                {repositoryUrl} {tempPath}                               │
│      Headers auth: Authorization: Bearer {token}                        │
│      Si timeout: return 408 "Repository clone timeout"                  │
│      Si error: return 400 { error: específico }                         │
│                   ej: "Invalid credentials"                             │
│                   ej: "Repository not found"                            │
│                   ej: "Branch does not exist"                           │
│                                                                          │
│   4. Calcular tamaño total:                                             │
│      totalSize = du -sb {tempPath}                                      │
│      Si totalSize > maxTotalSizeMb (2GB):                               │
│        return 413 "Repository too large"                                │
│                                                                          │
│   5. Validar rama:                                                       │
│      git branch -r | grep "origin/{branch}"                             │
│      Si no existe: return 400 "Branch not found"                        │
│                                                                          │
│   6. UPDATE projects {                                                  │
│        lastValidatedAt: now()                                           │
│      }                                                                    │
│                                                                          │
│ Response 200:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "isAccessible": true,                                               │
│     "branchExists": true,                                               │
│     "repositorySize": 156789012,    [bytes]                              │
│     "sizeInMB": 156.79,                                                 │
│     "message": "Repository accessible and validated"                    │
│   }                                                                       │
│                                                                          │
│ Validaciones Data Parity:                                               │
│   ✓ Repositorio clonea correctamente                                    │
│   ✓ Rama existe en repositorio                                          │
│   ✓ Tamaño < maxTotalSizeMb                                             │
│   ✓ lastValidatedAt actualizado en BD                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### **FASE 2: ANÁLISIS ACTIVO (El Corazón del Sistema)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 2.1: Encolar Análisis                                              │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: POST /api/v1/projects/{projectId}/analyses                    │
│ Headers: Authorization: Bearer {token}                                  │
│ Request Body:                                                            │
│   {                                                                       │
│     "isIncremental": false  [OPT: true para análisis delta]              │
│   }                                                                       │
│                                                                          │
│ Validaciones Iniciales:                                                 │
│   ✓ Project existe (Si no: 404)                                         │
│   ✓ Usuario autenticado (Si no: 401)                                    │
│   ✓ No hay análisis en progreso para este proyecto (validación)         │
│                                                                          │
│ Acciones:                                                                │
│   1. INSERT analyses {                                                   │
│        id: CUID,                                                         │
│        projectId,                                                        │
│        status: "PENDING",                                               │
│        progress: 0,                                                      │
│        errorMessage: null,                                              │
│        startedAt: null,                                                 │
│        completedAt: null,                                               │
│        createdAt: now(),                                                │
│        updatedAt: now()                                                 │
│      }                                                                    │
│      → análisysId = {nuevo id}                                           │
│                                                                          │
│   2. Encolar en Bull:                                                    │
│      queue.add('analyze', {                                             │
│        analysisId: análysisId,                                          │
│        projectId: projectId,                                            │
│        isIncremental: isIncremental                                     │
│      }, {                                                                │
│        attempts: 3,         [Reintentos automáticos]                     │
│        backoff: {                                                        │
│          type: 'exponential',                                           │
│          delay: 60000       [1 minuto base]                              │
│        },                                                                │
│        removeOnComplete: false,  [Mantener histórico]                   │
│        removeOnFail: false                                              │
│      })                                                                   │
│      → job.id = {bullJobId}                                             │
│                                                                          │
│   3. INSERT analysis_jobs {                                             │
│        analysisId,                                                       │
│        bullJobId,                                                        │
│        status: "PENDING",                                               │
│        priority: 0,                                                     │
│        attempts: 0,                                                     │
│        maxAttempts: 3,                                                  │
│        lastError: null,                                                 │
│        nextRetryAt: null,                                               │
│        createdAt: now()                                                 │
│      }                                                                    │
│                                                                          │
│   4. CREATE AuditLog {                                                  │
│        userId: (authenticated user),                                     │
│        action: "create",                                                │
│        resourceType: "analysis",                                        │
│        resourceId: analysisId,                                          │
│        details: { projectId, mode: "full" | "incremental" }            │
│      }                                                                    │
│                                                                          │
│   5. Socket emit a todos los clientes:                                  │
│      socketService.emitAnalysisStatusChanged(                           │
│        analysisId,                                                       │
│        projectId,                                                        │
│        'PENDING',                                                        │
│        0                                                                 │
│      )                                                                    │
│                                                                          │
│ Response 201:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "data": {                                                            │
│       "analysisId": "analysis_cuid_789",                                │
│       "projectId": "project_cuid_456",                                  │
│       "status": "PENDING",                                              │
│       "progress": 0,                                                     │
│       "createdAt": "2026-04-14T11:05:00Z"                              │
│     }                                                                     │
│   }                                                                       │
│                                                                          │
│ Validaciones Data Parity:                                               │
│   ✓ BD.analyses[analysisId].status === "PENDING"                        │
│   ✓ BD.analyses[analysisId].progress === 0                              │
│   ✓ BD.analysis_jobs[analysisId].bullJobId ∈ Redis                      │
│   ✓ BD.analysis_jobs[analysisId].status === "PENDING"                   │
│   ✓ Bull queue contiene job { analysisId, projectId, isIncremental }   │
│   ✓ AuditLog.resourceId === analysisId                                  │
│   ✓ Socket emit recibido por clientes suscritos                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 2.2: WORKER PROCESA - FASE 1: INSPECTOR AGENT                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Trigger: Bull Worker detecta job en queue                              │
│ Timeout Total: 5 minutos (Promise.race)                                │
│                                                                          │
│ Sub-PASO 2.2.1: Inicialización del Job                                  │
│   UPDATE analyses {                                                      │
│     status: "INSPECTOR_RUNNING",                                        │
│     progress: 10,                                                        │
│     startedAt: now()                                                    │
│   }                                                                       │
│   UPDATE analysis_jobs {                                                │
│     status: "ACTIVE",                                                    │
│     startedAt: now(),                                                   │
│     attempts: job.attemptsMade + 1                                      │
│   }                                                                       │
│   Socket emit: INSPECTOR_RUNNING (progress: 10)                        │
│                                                                          │
│ Sub-PASO 2.2.2: Clonar Repositorio                                      │
│   gitService.cloneOrPullRepository(                                     │
│     repositoryUrl,                                                       │
│     githubToken (desencriptado),                                        │
│     branch || "main"                                                    │
│   )                                                                       │
│   → localPath = "/tmp/analyses/{projectId}-{timestamp}"                 │
│                                                                          │
│   Validaciones:                                                          │
│     ✓ Clone exitoso (exit code 0)                                        │
│     ✓ Directorio existe: fs.existsSync(localPath)                       │
│     ✓ Rama existente: git branch -r | grep "origin/{branch}"            │
│                                                                          │
│ Sub-PASO 2.2.3: Leer Código Fuente (Completo o Incremental)            │
│   SI isIncremental = true:                                              │
│     1. lastCommitSha = getLastAnalysisPosition(projectId)               │
│        [De análisis anterior más reciente]                              │
│     2. repoFiles = gitService.readFilesChangedSince(                    │
│          localPath,                                                      │
│          lastCommitSha,                                                 │
│          "HEAD",                                                        │
│          {                                                               │
│            maxFileSizeKb: project.maxFileSizeKb || 150,                │
│            maxTotalSizeMb: project.maxTotalSizeMb || 2                  │
│          }                                                               │
│        )                                                                 │
│     3. SI no hay cambios desde lastCommitSha:                            │
│          UPDATE analyses { status: "COMPLETED", progress: 100,          │
│                           completedAt: now(),                           │
│                           errorMessage: "Sin cambios detectados" }      │
│          → return early (análisis termina)                              │
│                                                                          │
│   SI NO isIncremental:                                                  │
│     repoFiles = gitService.readRepositoryFiles(                         │
│       localPath,                                                        │
│       undefined,                                                        │
│       {                                                                  │
│         maxFileSizeKb: 150,                                             │
│         maxTotalSizeMb: 2,                                              │
│         maxDirectoryDepth: 6                                            │
│       }                                                                   │
│     )                                                                     │
│                                                                          │
│   Output repoFiles:                                                      │
│   {                                                                       │
│     files: [                                                             │
│       { path: "src/app.ts", content: "..." },                           │
│       { path: "src/utils.ts", content: "..." }                          │
│     ],                                                                    │
│     fileCount: number,                                                  │
│     totalSize: bytes,                                                   │
│     coverage: {                                                          │
│       scannedBytes: bytes,                                              │
│       skippedBytes: bytes,                                              │
│       skippedReason: ["File too large", ...]                            │
│     }                                                                     │
│   }                                                                       │
│                                                                          │
│ Sub-PASO 2.2.4: Ejecutar Inspector Agent                                │
│   inspectorAgent.analizarArchivos(                                      │
│     repoFiles.files,                                                    │
│     `Repositorio: {repositoryUrl}`                                      │
│   ) con TIMEOUT 5 minutos                                               │
│                                                                          │
│   Inspector internamente:                                                │
│   1. Divide archivos en chunks MAX 500KB cada uno                        │
│   2. Para cada chunk:                                                    │
│      a. Hash código para caché                                          │
│      b. Buscar en node-cache                                            │
│      c. Si cache miss:                                                  │
│         → Call Claude Sonnet 4.6                                        │
│         → max_tokens: 4096                                              │
│         → Parse JSON response                                           │
│      d. Guardar en caché                                                │
│   3. Consolidar hallazgos de todos los chunks                           │
│   4. Return MaliciaOutput {                                             │
│        hallazgos: [{...}],                                              │
│        resumen: "Se encontraron N hallazgos",                           │
│        cantidad_hallazgos: N,                                           │
│        tiempo_ejecucion_ms: duration,                                   │
│        usage: { input_tokens, output_tokens, model }                    │
│      }                                                                    │
│                                                                          │
│   SI Inspector timeout (5 min):                                          │
│     → throw Error("Inspector Agent timeout (5 minutos)")                │
│     → Bull maneja error, reintento automático                           │
│                                                                          │
│ Sub-PASO 2.2.5: Guardar Hallazgos en BD                                 │
│   UPDATE analyses { coverageSummary: repoFiles.coverage }               │
│   Socket emit: COVERAGE_REPORT { scannedBytes, skippedBytes, ... }     │
│                                                                          │
│   Para cada hallazgo de Inspector:                                       │
│   INSERT findings {                                                      │
│     analysisId,                                                          │
│     severity: mapSeverity(hallazgo.severidad),                          │
│              [CRÍTICO → CRITICAL, ALTO → HIGH, etc]                     │
│     riskType: mapRiskType(hallazgo.tipo_riesgo),                        │
│              [PUERTA_TRASERA → BACKDOOR, INYECCION → INJECTION, etc]    │
│     file: hallazgo.archivo,                                             │
│     lineRange: hallazgo.rango_lineas.join("-"),                         │
│               [ej: "45-52"]                                              │
│     codeSnippet: hallazgo.fragmento_codigo,                             │
│     whySuspicious: hallazgo.por_que_sospechoso,                         │
│     remediationSteps: hallazgo.pasos_remediacion,  [array]              │
│     confidence: hallazgo.confianza,                 [0.0-1.0]           │
│     createdAt: now(),                                                   │
│     deletedAt: null                                                     │
│   }                                                                       │
│   INSERT finding_status_changes {                                       │
│     findingId,                                                           │
│     status: "DETECTED",                                                 │
│     changedBy: "system",  [o user ID de agente]                         │
│     createdAt: now()                                                    │
│   }                                                                       │
│                                                                          │
│   También se crea Map para linkear con ForensicEvents después:          │
│   findingMap: { "archivo:funcion" → findingId }                         │
│                                                                          │
│ Post-Phase Validaciones:                                                │
│   ✓ Cada Finding tiene: file, lineRange, severity, riskType             │
│   ✓ remediationSteps no está vacío (array size >= 1)                    │
│   ✓ confidence ∈ [0.0, 1.0]                                             │
│   ✓ severity ∈ { LOW, MEDIUM, HIGH, CRITICAL }                         │
│   ✓ riskType ∈ { BACKDOOR, INJECTION, LOGIC_BOMB, ... }                │
│   ✓ findingStatusChange.status === "DETECTED"                           │
│   ✓ Socket emit recibido con cantidad de hallazgos                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 2.3: WORKER PROCESA - FASE 2: DETECTIVE AGENT                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Precondición: Inspector completó exitosamente                          │
│ Timeout: 3 minutos                                                      │
│                                                                          │
│ UPDATE analyses { status: "DETECTIVE_RUNNING", progress: 40 }           │
│ Socket emit: DETECTIVE_RUNNING (progress: 40)                          │
│                                                                          │
│ Sub-PASO 2.3.1: Obtener Historial Git                                   │
│   isIncremental = await shouldBeIncremental(projectId)                  │
│   historialGit = await getNewCommits(                                   │
│     repositoryUrl,                                                       │
│     lastCommitSha ?? undefined,                                         │
│     maxCommits || 50                                                    │
│   )                                                                       │
│                                                                          │
│   Retorna array de commits (últimos 50 o desde lastCommitSha):          │
│   [                                                                       │
│     {                                                                     │
│       hash: "abc123def456...",  [SHA-1 40 chars]                         │
│       author: "developer@example.com",                                   │
│       timestamp: Date,                                                   │
│       message: "Add authentication bypass",                              │
│       ...                                                                │
│     },                                                                    │
│     ...                                                                   │
│   ]                                                                       │
│                                                                          │
│ Sub-PASO 2.3.2: Ejecutar Detective Agent                                │
│   detectiveAgent.investigarHistorial({                                  │
│     hallazgos_malicia: maliciaOutput.hallazgos,                         │
│     historial_commits: historialGit                                     │
│   }) con TIMEOUT 3 minutos                                              │
│                                                                          │
│   Detective internamente:                                                │
│   1. Hash hallazgos + commits para caché                                │
│   2. Buscar en node-cache                                               │
│   3. Si cache miss:                                                     │
│      → Call Claude Haiku 4.5 (rápido y económico)                       │
│      → max_tokens: 2048                                                 │
│      → Parse JSON response                                              │
│   4. Analizar patrones sospechosos                                       │
│   5. Return ForensesOutput {                                            │
│        linea_tiempo: [                                                   │
│          {                                                               │
│            timestamp: "2026-03-15T10:30:00Z",                           │
│            commit: "abc123",                                            │
│            autor: "dev@example.com",                                    │
│            archivo: "src/auth.ts",                                      │
│            funcion?: "validateToken",                                   │
│            accion: "MODIFICADO",                                        │
│            mensaje_commit: "Add auth validation",                       │
│            resumen_cambios: "...",                                      │
│            nivel_riesgo: "ALTO",                                        │
│            indicadores_sospecha: ["Code obfuscation", ...]              │
│          }                                                               │
│        ],                                                                │
│        patrones: ["Introducción gradual de código ofuscado", ...],      │
│        autores_sospechosos: ["dev@example.com"],                        │
│        resumen_forense: "...",                                          │
│        tiempo_ejecucion_ms: duration,                                   │
│        usage: { input_tokens, output_tokens, model }                    │
│      }                                                                    │
│                                                                          │
│   SI Detective timeout (3 min):                                          │
│     → throw Error("Detective Agent timeout (3 minutos)")                │
│     → Bull maneja error, reintento                                      │
│                                                                          │
│ Sub-PASO 2.3.3: Guardar Eventos Forenses en BD                          │
│   Para cada evento en linea_tiempo:                                      │
│   findingId = findingMap.get(`${evento.archivo}:${evento.funcion}`)     │
│                                                                          │
│   INSERT forensic_events {                                              │
│     analysisId,                                                          │
│     findingId,  [NULLABLE - puede ser null si no hay match]             │
│     commitHash: evento.commit,                                          │
│                 [VALIDACIÓN: SHA-1 válido o 'unknown']                  │
│     commitMessage: evento.mensaje_commit,                               │
│     author: evento.autor,                                               │
│     action: evento.accion,  [ENUM: ADDED|MODIFIED|DELETED|RENAMED]     │
│     file: evento.archivo,                                               │
│     function: evento.funcion,                                           │
│     changesSummary: evento.resumen_cambios,                             │
│     riskLevel: evento.nivel_riesgo,  [Severity enum]                    │
│     suspicionIndicators: evento.indicadores_sospecha,                   │
│     timestamp: new Date(evento.timestamp),                              │
│     createdAt: now()                                                    │
│   }                                                                       │
│                                                                          │
│ Post-Phase Validaciones:                                                │
│   ✓ Cada evento tiene: commitHash, author, action, file, timestamp      │
│   ✓ commitHash es válido (SHA-1 40 chars o 'unknown')                   │
│   ✓ timestamp válido (ISO 8601 o Date)                                  │
│   ✓ action ∈ { ADDED, MODIFIED, DELETED, RENAMED }                     │
│   ✓ findingId linkea correctamente con findings                         │
│   ✓ Eventos ordenados cronológicamente                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 2.4: WORKER PROCESA - FASE 3: FISCAL AGENT                        │
├─────────────────────────────────────────────────────────────────────────┤
│ Precondición: Detective completó exitosamente                          │
│ Timeout: 2 minutos                                                      │
│                                                                          │
│ UPDATE analyses { status: "FISCAL_RUNNING", progress: 70 }              │
│ Socket emit: FISCAL_RUNNING (progress: 70)                             │
│                                                                          │
│ Sub-PASO 2.4.1: Ejecutar Fiscal Agent                                   │
│   fiscalAgent.generarReporte({                                          │
│     hallazgos_malicia: maliciaOutput.hallazgos,                         │
│     linea_tiempo_forenses: forensesOutput.linea_tiempo,                 │
│     contexto_repo: `Repositorio: {repositoryUrl}`                       │
│   }) con TIMEOUT 2 minutos                                              │
│                                                                          │
│   Fiscal internamente:                                                   │
│   1. Hash para caché                                                    │
│   2. Buscar en node-cache                                               │
│   3. Si cache miss:                                                     │
│      → Call Claude Sonnet 4.6 (modelo potente)                          │
│      → max_tokens: 4096                                                 │
│      → Parse JSON response                                              │
│   4. Return SintesisOutput {                                            │
│        resumen_ejecutivo: "..." (2-3 párrafos),                         │
│        desglose_severidad: {                                            │
│          CRÍTICO: 1,                                                     │
│          ALTO: 2,                                                        │
│          MEDIO: 0,                                                       │
│          BAJO: 0                                                         │
│        },                                                                │
│        funciones_comprometidas: ["validateToken", "authenticateUser"],  │
│        linea_de_ataque: "15-Mar: Introducción → 16-Mar: Ofuscación",   │
│        prioridad_remediacion: [                                         │
│          {                                                               │
│            orden: 1,                                                     │
│            accion: "Revertir commits abc123, def456",                    │
│            justificacion: "Código crítico comprometido",                │
│            urgencia: "CRÍTICA"                                          │
│          }                                                               │
│        ],                                                                │
│        autores_afectados: ["dev1@example.com"],                         │
│        puntuacion_riesgo: 92,  [0-100]                                  │
│        recomendacion_general: "Investigación inmediata...",             │
│        cantidad_hallazgos: 3,                                           │
│        tiempo_ejecucion_ms: duration,                                   │
│        usage: { input_tokens, output_tokens, model }                    │
│      }                                                                    │
│                                                                          │
│   SI Fiscal timeout (2 min):                                             │
│     → throw Error("Fiscal Agent timeout (2 minutos)")                   │
│     → Bull maneja error, reintento                                      │
│                                                                          │
│ Sub-PASO 2.4.2: Guardar Reporte en BD                                   │
│   totalInput = sum(inspector.usage.input_tokens +                       │
│                    detective.usage.input_tokens +                       │
│                    fiscal.usage.input_tokens)                           │
│   totalOutput = sum(inspector.usage.output_tokens +                     │
│                     detective.usage.output_tokens +                     │
│                     fiscal.usage.output_tokens)                         │
│                                                                          │
│   INSERT reports {                                                       │
│     analysisId,                                                          │
│     riskScore: puntuacion_riesgo,                                       │
│               [VALIDACIÓN: 0 <= riskScore <= 100]                        │
│     executiveSummary: resumen_ejecutivo,                                │
│     findingsCount: cantidad_hallazgos,                                  │
│                    [VALIDACIÓN: === COUNT(findings)]                     │
│     severityBreakdown: desglose_severidad,                              │
│                        [VALIDACIÓN: sum(all) === findingsCount]         │
│     compromisedFunctions: funciones_comprometidas,                      │
│     affectedAuthors: autores_afectados,                                 │
│     remediationSteps: prioridad_remediacion,                            │
│     generalRecommendation: recomendacion_general,                       │
│     inputTokens: totalInput,                                            │
│     outputTokens: totalOutput,                                          │
│     model: "claude-sonnet-4-6",                                         │
│     createdAt: now()                                                    │
│   }                                                                       │
│                                                                          │
│ Post-Phase Validaciones:                                                │
│   ✓ riskScore ∈ [0, 100] (entero)                                       │
│   ✓ findingsCount === BD.COUNT(findings WHERE analysisId)               │
│   ✓ severityBreakdown[CRÍTICO] + HIGH + MEDIUM + LOW === findingsCount  │
│   ✓ Report.createdAt <= 5 minutos desde Analysis.startedAt              │
│   ✓ inputTokens > 0 y outputTokens > 0 (costos registrados)             │
│   ✓ Report 1:1 con Analysis (UNIQUE constraint)                         │
│                                                                          │
│ Final State Update:                                                      │
│   UPDATE analyses {                                                      │
│     status: "COMPLETED",                                                │
│     progress: 100,                                                       │
│     completedAt: now(),                                                 │
│     errorMessage: null                                                  │
│   }                                                                       │
│                                                                          │
│   UPDATE analysis_jobs {                                                │
│     status: "COMPLETED",                                                │
│     completedAt: now()                                                  │
│   }                                                                       │
│                                                                          │
│   IF historialGit.length > 0:                                            │
│     lastCommit = historialGit[0]  [más reciente]                        │
│     updateLastProcessedCommit(analysisId, lastCommit.hash)              │
│                                                                          │
│   Socket emit: ANALYSIS_COMPLETED { analysisId, report, riskScore }    │
│                                                                          │
│ Total Analysis Duration Validation:                                     │
│   ✓ completedAt - startedAt <= 10 minutos (para repo < 2GB)             │
│   ✓ progress: 10 → 40 → 70 → 100 (visibilidad progresiva)               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 2.5: Manejo de Errores y Reintentos                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Si cualquier agente falla:                                               │
│                                                                          │
│ 1. Capturar excepción (línea 365):                                       │
│    catch (error) {                                                       │
│      errorMsg = error.message                                            │
│    }                                                                      │
│                                                                          │
│ 2. UPDATE analyses {                                                     │
│      status: "FAILED",                                                  │
│      errorMessage: errorMsg,                                            │
│      completedAt: now()                                                 │
│    }                                                                      │
│                                                                          │
│ 3. UPDATE analysis_jobs {                                               │
│      status: "FAILED",                                                  │
│      lastError: errorMsg,                                               │
│      completedAt: now()                                                 │
│    }                                                                      │
│                                                                          │
│ 4. Socket emit: ANALYSIS_ERROR { analysisId, error, projectId }         │
│                                                                          │
│ 5. Bull Automatic Retry Logic:                                          │
│    Intento 1: fail → espera 60000ms (1 min)                             │
│               → analysis_jobs.attempts = 1                              │
│               → analysis_jobs.nextRetryAt = now + 60s                   │
│                                                                          │
│    Intento 2: fail → espera 120000ms (2 min exponencial)                │
│               → analysis_jobs.attempts = 2                              │
│               → analysis_jobs.nextRetryAt = now + 120s                  │
│                                                                          │
│    Intento 3: fail → NO MAS REINTENTOS                                  │
│               → analysis_jobs.status = "FAILED"                         │
│               → analysis_jobs.attempts = 3 (== maxAttempts)             │
│               → analyses.status = "FAILED" (final)                      │
│                                                                          │
│ 6. errorMessage Validaciones:                                            │
│    ✓ NOT null o undefined                                               │
│    ✓ NOT "undefined" string                                             │
│    ✓ Específico (ej: "Inspector Agent timeout" not "Error")             │
│    ✓ Máx 500 caracteres (DB field TEXT)                                 │
│                                                                          │
│ 7. Usuario puede:                                                        │
│    • Ver error en GET /api/v1/analyses/:id → errorMessage               │
│    • Reintentar manualmente POST /api/v1/analyses/:id/retry             │
│    • Cancelar análisis POST /api/v1/analyses/:id/cancel                 │
│                                                                          │
│ Si cancela durante ejecución:                                            │
│   cancelAnalysis(analysisId) → actualiza analysis.status = "CANCELLED"   │
│   Si job está PENDING: Bull remove()                                    │
│   Si job está ACTIVE: marca para cancelación en next check              │
└─────────────────────────────────────────────────────────────────────────┘
```

[CONTINÚA EN LA SIGUIENTE SECCIÓN...]


### **FASE 3: GESTIÓN DE HALLAZGOS Y ASIGNACIÓN**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 3.1: Visualización de Hallazgos                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: GET /api/v1/analyses/{analysisId}/findings                    │
│ Headers: Authorization: Bearer {token}                                  │
│ Query Params:                                                            │
│   • page: 1 (optional, min 1)                                           │
│   • limit: 50 (optional, max 100)                                       │
│   • severity: CRITICAL|HIGH|MEDIUM|LOW (optional, filter)               │
│                                                                          │
│ Acciones:                                                                │
│   1. Validar analysisId existe: SELECT FROM analyses WHERE id           │
│      Si no: return 404 "Analysis not found"                             │
│                                                                          │
│   2. Calcular paginación:                                                │
│      skip = (page - 1) * limit                                          │
│      Máximo limit = 100, mínimo = 1                                     │
│                                                                          │
│   3. WHERE clause (soft deletes):                                        │
│      WHERE analysisId = {id}                                            │
│      AND deletedAt IS NULL  ← CRÍTICO: no incluir eliminados             │
│                                                                          │
│   4. SELECT findings con relaciones:                                     │
│      • statusHistory (últimas transiciones de estado)                    │
│      • assignment (usuario asignado)                                    │
│      • remediation (RemediationAction)                                  │
│                                                                          │
│   5. ORDER BY severity DESC, confidence DESC                             │
│      (mostrar primero los críticos)                                      │
│                                                                          │
│ Response 200:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "data": [                                                            │
│       {                                                                   │
│         "id": "finding_cuid_001",                                        │
│         "analysisId": "analysis_cuid_789",                              │
│         "severity": "CRITICAL",                                         │
│         "riskType": "BACKDOOR",                                         │
│         "file": "src/auth.ts",                                          │
│         "lineRange": "45-52",                                           │
│         "codeSnippet": "... 20 lines of code ...",                      │
│         "whySuspicious": "Hard-coded credentials and bypass logic",     │
│         "remediationSteps": ["Step 1", "Step 2"],                       │
│         "confidence": 0.95,                                             │
│         "statusHistory": [                                              │
│           { status: "DETECTED", changedAt: "...", changedByUser: {...} }│
│         ],                                                               │
│         "assignment": {                                                  │
│           "id": "assign_001",                                           │
│           "assignedTo": "user_456",                                     │
│           "assignedUser": { id, name, email },                          │
│           "assignedAt": "2026-04-14T12:00:00Z"                         │
│         },                                                               │
│         "remediation": {                                                │
│           "id": "rem_001",                                              │
│           "status": "IN_PROGRESS",                                      │
│           "dueDate": "2026-04-20T23:59:59Z"                             │
│         }                                                                │
│       },                                                                 │
│       ...                                                                │
│     ],                                                                    │
│     "total": 15,                                                         │
│     "page": 1,                                                           │
│     "limit": 50,                                                         │
│     "hasMore": false                                                     │
│   }                                                                       │
│                                                                          │
│ Data Parity Validations:                                                │
│   ✓ Cada finding existe en BD: BD.COUNT = response.total                 │
│   ✓ findings[0].severity = BD.findings[0].severity (exacto)             │
│   ✓ findings[0].lineRange formato "X-Y" (ej: "45-52", no "45:52")      │
│   ✓ codeSnippet exacto al almacenado (byte-to-byte si > 100 chars)      │
│   ✓ remediationSteps array idéntico al almacenado                       │
│   ✓ statusHistory[0] es el cambio más reciente (orderBy DESC)           │
│   ✓ Si assignment existe: assignedTo != null y assignedUser != null     │
│   ✓ Si remediation existe: status ∈ valid enum values                   │
│   ✓ Paginación correcta: items.length = min(limit, total - skip)        │
│   ✓ hasMore = (skip + items.length) < total                             │
│   ✓ Varianza de datos: 0% (exactitud total)                             │
│   ✓ deletedAt = null para TODOS los findings (soft delete verificado)    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 3.2: Asignar Hallazgo a Usuario                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: POST /api/v1/findings/{findingId}/assign                      │
│ Headers: Authorization: Bearer {token}                                  │
│ Request Body:                                                            │
│   {                                                                       │
│     "assignedTo": "user_cuid_456"  [ID del usuario a asignar]            │
│   }                                                                       │
│                                                                          │
│ Validaciones Iniciales:                                                 │
│   ✓ Finding existe: SELECT FROM findings WHERE id                        │
│     Si no: return 404                                                   │
│   ✓ Finding.deletedAt = null (no está soft-deleted)                     │
│     Si está borrado: return 410 "Finding no longer exists"              │
│   ✓ User existe: SELECT FROM users WHERE id = assignedTo                │
│     Si no: return 400 "User not found"                                  │
│   ✓ No existe otra asignación activa (UNIQUE constraint):               │
│     SELECT COUNT(*) FROM finding_assignments WHERE findingId            │
│     Si count > 0: return 409 "Already assigned"                         │
│                                                                          │
│ Transacción en BD:                                                       │
│   BEGIN TRANSACTION                                                      │
│     1. INSERT finding_assignments {                                     │
│          id: CUID,                                                       │
│          findingId,                                                      │
│          assignedTo,                                                     │
│          assignedAt: now()                                              │
│        }                                                                  │
│        → Constraint: UNIQUE(findingId)                                   │
│                                                                          │
│     2. INSERT finding_status_changes {                                  │
│          id: CUID,                                                       │
│          findingId,                                                      │
│          status: "IN_REVIEW",                                           │
│          changedBy: {userId autenticado},                                │
│          createdAt: now()                                               │
│        }                                                                  │
│                                                                          │
│     3. INSERT notifications {                                           │
│          id: CUID,                                                       │
│          userId: assignedTo,                                            │
│          type: "ASSIGNMENT",                                            │
│          title: "Nuevo hallazgo asignado",                              │
│          message: "Se te ha asignado un hallazgo CRITICAL...",          │
│          severity: "WARNING",                                           │
│          findingId,                                                      │
│          read: false,                                                    │
│          createdAt: now()                                               │
│        }                                                                  │
│                                                                          │
│     4. CREATE AuditLog {                                                │
│          userId: {authenticated user},                                   │
│          action: "assign",                                              │
│          resourceType: "finding",                                       │
│          resourceId: findingId,                                         │
│          details: { assignedTo, severity }                              │
│        }                                                                  │
│                                                                          │
│   COMMIT TRANSACTION                                                     │
│                                                                          │
│ Socket emit to all clients:                                             │
│   socketService.emit('finding:assigned', {                              │
│     findingId,                                                           │
│     analysisId,                                                          │
│     assignedUser: { id, name, email },                                  │
│     assignedAt: now()                                                   │
│   })                                                                      │
│                                                                          │
│ Response 201:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "data": {                                                            │
│       "assignmentId": "assign_cuid_123",                                │
│       "findingId": "finding_cuid_001",                                  │
│       "assignedTo": "user_cuid_456",                                    │
│       "assignedUser": {                                                  │
│         "id": "user_cuid_456",                                          │
│         "name": "John Doe",                                             │
│         "email": "john@example.com"                                     │
│       },                                                                  │
│       "assignedAt": "2026-04-14T12:30:00Z",                            │
│       "status": "IN_REVIEW"                                             │
│     }                                                                     │
│   }                                                                       │
│                                                                          │
│ Data Parity Validations:                                                │
│   ✓ BD.finding_assignments[assignmentId].findingId === findingId        │
│   ✓ BD.finding_assignments[assignmentId].assignedTo === assignedTo      │
│   ✓ BD.finding_assignments[findingId].count === 1 (UNIQUE valid)        │
│   ✓ BD.finding_status_changes[-1].status === "IN_REVIEW"                │
│   ✓ BD.notifications[?].type === "ASSIGNMENT"                           │
│   ✓ Socket emit recibido por clientes suscritos                         │
│   ✓ Audit log registra acción                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### **FASE 4: REMEDIACIÓN Y CIERRE**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 4.1: Crear Remediación para Hallazgo                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: POST /api/remediation                                         │
│ Headers: Authorization: Bearer {token}                                  │
│ Request Body:                                                            │
│   {                                                                       │
│     "findingId": "finding_cuid_001",                                    │
│     "title": "Fix authentication bypass",                               │
│     "description": "Remove hardcoded credentials and implement...",     │
│     "assigneeId": "user_cuid_456",      [OPT]                            │
│     "dueDate": "2026-04-20T23:59:59Z",  [OPT]                            │
│     "priority": 2                        [OPT: 0=normal, 1=high, 2=crit] │
│   }                                                                       │
│                                                                          │
│ Validaciones Iniciales:                                                 │
│   ✓ findingId existe: SELECT FROM findings WHERE id                     │
│     Si no: return 404 "Finding not found"                               │
│   ✓ Finding.deletedAt = null                                            │
│   ✓ assigneeId válido (si se proporciona): SELECT FROM users            │
│   ✓ dueDate >= hoy (si se proporciona)                                  │
│   ✓ priority ∈ [0, 1, 2]                                                 │
│                                                                          │
│ Acciones BD:                                                             │
│   1. INSERT remediation_actions {                                       │
│        id: CUID,                                                         │
│        findingId,                                                        │
│        title,                                                            │
│        description,                                                      │
│        assigneeId,                                                       │
│        dueDate,                                                          │
│        priority: priority || 0,                                         │
│        status: "PENDING",                                               │
│        evidence: null,                                                  │
│        comment: null,                                                   │
│        startedAt: null,                                                 │
│        completedAt: null,                                               │
│        verifiedAt: null,                                                │
│        createdAt: now()                                                 │
│      }                                                                    │
│      → Constraint: UNIQUE(findingId)                                    │
│                                                                          │
│   2. UPDATE findings {                                                  │
│        // NO cambiar status automáticamente (developer lo hace)         │
│      }                                                                    │
│                                                                          │
│   3. INSERT remediation_comments {  [if comment provided]               │
│        remediationId,                                                    │
│        userId: {authenticated user},                                     │
│        content: description,                                            │
│        createdAt: now()                                                 │
│      }                                                                    │
│                                                                          │
│ Response 201:                                                            │
│   {                                                                       │
│     "success": true,                                                     │
│     "data": {                                                            │
│       "id": "rem_cuid_123",                                             │
│       "findingId": "finding_cuid_001",                                  │
│       "status": "PENDING",                                              │
│       "title": "Fix authentication bypass",                             │
│       "assigneeId": "user_cuid_456",                                    │
│       "dueDate": "2026-04-20T23:59:59Z",                               │
│       "priority": 2,                                                     │
│       "createdAt": "2026-04-14T13:00:00Z"                              │
│     }                                                                     │
│   }                                                                       │
│                                                                          │
│ Data Parity Validations:                                                │
│   ✓ BD.remediation_actions[id].findingId === findingId                  │
│   ✓ BD.remediation_actions[id].status === "PENDING"                     │
│   ✓ BD.remediation_actions[findingId].count === 1 (UNIQUE)              │
│   ✓ dueDate almacenado correctamente                                    │
│   ✓ priority ∈ [0, 1, 2]                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 4.2: Actualizar Estado de Remediación (Máquina de Estados)         │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: PATCH /api/remediation/{remediationId}                        │
│ Headers: Authorization: Bearer {token}                                  │
│                                                                          │
│ === TRANSICIÓN: PENDING → IN_PROGRESS ===                               │
│ Request Body: { status: "IN_PROGRESS" }                                 │
│                                                                          │
│   Validaciones:                                                          │
│     • Remediación existe y está en PENDING                              │
│     • Transición válida (PENDING → IN_PROGRESS ✓)                       │
│                                                                          │
│   Acciones:                                                              │
│     UPDATE remediation_actions {                                        │
│       status: "IN_PROGRESS",                                            │
│       startedAt: now()                                                  │
│     }                                                                     │
│                                                                          │
│   Response: { success: true, data: { status: "IN_PROGRESS", ... } }     │
│                                                                          │
│ === TRANSICIÓN: IN_PROGRESS → COMPLETED ===                             │
│ Request Body: {                                                          │
│   status: "COMPLETED",                                                  │
│   evidence: {                                                            │
│     commitSha: "abc123def456...",  [40 chars hex, SHA-1]                │
│     prUrl: "https://github.com/user/repo/pull/123",                     │
│     description: "Removed hardcoded credentials, added..."              │
│   }                                                                       │
│ }                                                                         │
│                                                                          │
│   Validaciones:                                                          │
│     • Remediación está en IN_PROGRESS                                   │
│     • Transición válida (IN_PROGRESS → COMPLETED ✓)                     │
│     • evidence != null (obligatorio para COMPLETED)                     │
│     • commitSha es válido: /^[0-9a-f]{40}$/ (SHA-1 exacto)              │
│     • prUrl es URL válida y accesible (opcional pero recomendado)       │
│                                                                          │
│   Acciones:                                                              │
│     UPDATE remediation_actions {                                        │
│       status: "COMPLETED",                                              │
│       completedAt: now(),                                               │
│       evidence: { commitSha, prUrl, description, verifiedAt: null }     │
│     }                                                                     │
│                                                                          │
│     INSERT finding_status_changes {                                     │
│       findingId: remediation.findingId,                                 │
│       status: "CORRECTED",                                              │
│       changedBy: {authenticated user},                                  │
│       createdAt: now()                                                  │
│     }                                                                     │
│                                                                          │
│     INSERT notifications {                                              │
│       userId: (analysts),                                               │
│       type: "REMEDIATION",                                              │
│       title: "Remediación completada - Revisión requerida",             │
│       findingId: remediation.findingId                                  │
│     }                                                                     │
│                                                                          │
│   Response: { success: true, data: { status: "COMPLETED", evidence } }  │
│                                                                          │
│ === TRANSICIÓN: COMPLETED → VERIFIED (por ANALYST) ===                  │
│ Request Body: { status: "VERIFIED" }                                    │
│                                                                          │
│   Validaciones:                                                          │
│     • Remediación está en COMPLETED                                     │
│     • evidence != null (debe haberse proporcionado)                     │
│     • Transición válida (COMPLETED → VERIFIED ✓)                        │
│     • Usuario es ANALYST o ADMIN (RBAC check)                           │
│     • Commit existe en repositorio: git show {commitSha}                │
│       Si no existe: return 400 "Commit not found in repository"         │
│     • Cambios en commit afectan al archivo del Finding                  │
│       Si no: return 400 "Commit does not address this finding"          │
│                                                                          │
│   Acciones:                                                              │
│     UPDATE remediation_actions {                                        │
│       status: "VERIFIED",                                               │
│       verifiedAt: now(),                                                │
│       evidence: { ...evidence, verifiedAt: now() }                      │
│     }                                                                     │
│                                                                          │
│     UPDATE findings {                                                   │
│       deletedAt: null        ← Restaurar si fue soft-deleted             │
│     }                                                                     │
│                                                                          │
│     INSERT finding_status_changes {                                     │
│       findingId,                                                         │
│       status: "VERIFIED",                                               │
│       changedBy: {analyst user},                                        │
│       note: "Verificado por análisis manual del commit",                │
│       createdAt: now()                                                  │
│     }                                                                     │
│                                                                          │
│     INSERT notifications {                                              │
│       userId: developer,                                                │
│       type: "VERIFICATION",                                             │
│       title: "Remediación Verificada",                                  │
│       message: "Tu fix ha sido verificado y aprobado"                   │
│     }                                                                     │
│                                                                          │
│     [TRIGGER] Si todos los findings de analysis están VERIFIED:         │
│       UPDATE analyses { status: "RESOLVED" }                            │
│       Socket emit: 'analysis:resolved'                                  │
│                                                                          │
│   Response: { success: true, data: { status: "VERIFIED", verifiedAt } } │
│                                                                          │
│ === TRANSICIÓN: COMPLETED → REJECTED (por ANALYST) ===                  │
│ Request Body: {                                                          │
│   status: "REJECTED",                                                   │
│   comment: "Fix incomplete - credentials still hardcoded in line 152"   │
│ }                                                                         │
│                                                                          │
│   Validaciones:                                                          │
│     • Remediación está en COMPLETED                                     │
│     • comment != null y != empty (feedback obligatorio)                 │
│     • Transición válida (COMPLETED → REJECTED ✓)                        │
│                                                                          │
│   Acciones:                                                              │
│     UPDATE remediation_actions {                                        │
│       status: "REJECTED",                                               │
│       comment,                                                           │
│       updatedAt: now()                                                  │
│     }                                                                     │
│                                                                          │
│     INSERT finding_status_changes {                                     │
│       findingId,                                                         │
│       status: "IN_CORRECTION",  ← Retroceso automático                  │
│       changedBy: {analyst},                                             │
│       note: `Rechazado: ${comment}`,                                    │
│       createdAt: now()                                                  │
│     }                                                                     │
│                                                                          │
│     INSERT notifications {                                              │
│       userId: developer,                                                │
│       type: "REMEDIATION",                                              │
│       title: "Remediación Rechazada - Revisión Requerida",              │
│       message: `Feedback: ${comment}`                                   │
│     }                                                                     │
│                                                                          │
│   Response: { success: true, data: { status: "REJECTED", comment } }    │
│                                                                          │
│ === TRANSICIÓN: REJECTED → IN_PROGRESS (developer retoma) ===           │
│ Request Body: { status: "IN_PROGRESS" }                                 │
│   • Permite reintentos sin crear nueva RemediationAction                │
│   • startedAt se actualiza a now()                                      │
│   • El contador de intentos no existe (puede reintentar N veces)        │
│                                                                          │
│ Valid State Transitions Table:                                          │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ FROM              → TO             │ Requisitos              │     │
│   ├──────────────────────────────────────────────────────────────┤     │
│   │ PENDING           → IN_PROGRESS    │ ninguno                 │     │
│   │ IN_PROGRESS       → COMPLETED      │ evidence + commitSha    │     │
│   │ COMPLETED         → VERIFIED       │ analyst role            │     │
│   │ COMPLETED         → REJECTED       │ comment != null         │     │
│   │ REJECTED          → IN_PROGRESS    │ ninguno (reintentos)    │     │
│   │ PENDING           → (SKIP) → VERIFIED [nunca]               │     │
│   │ PENDING           → REJECTED [nunca]                        │     │
│   │ (todas las demás transiciones) [INVÁLIDAS]                  │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ Data Parity Validations (para todas las transiciones):                  │
│   ✓ BD.remediation_actions[id].status === response.status               │
│   ✓ BD.finding_status_changes[-1].status === nueva_transición           │
│   ✓ Si VERIFIED: BD.findings[id].deletedAt = null                       │
│   ✓ Si REJECTED: BD.findings[id].status = IN_CORRECTION                 │
│   ✓ Timestamps válidos (createdAt, completedAt, verifiedAt)             │
│   ✓ evidence.commitSha existe en Git (git show {sha})                    │
│   ✓ Notifications creadas apropiadamente                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 4.3: Cierre Automático de Análisis                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Trigger: Cada vez que se actualiza un finding status                    │
│                                                                          │
│ Lógica de Cierre:                                                        │
│   1. SELECT COUNT(*) FROM findings WHERE analysisId = {id}              │
│      AND deletedAt IS NULL                                              │
│      AND status NOT IN ('VERIFIED', 'FALSE_POSITIVE', 'CLOSED')        │
│                                                                          │
│   2. SI count === 0 (no hay hallazgos pendientes):                       │
│        UPDATE analyses {                                                │
│          status: "RESOLVED",                                            │
│          completedAt: now()  (si era null)                              │
│        }                                                                 │
│                                                                          │
│        INSERT audit_logs {                                              │
│          userId: "system",                                              │
│          action: "close",                                               │
│          resourceType: "analysis",                                      │
│          resourceId: analysisId,                                        │
│          details: { reason: "all_findings_resolved" }                   │
│        }                                                                 │
│                                                                          │
│        Socket emit: 'analysis:resolved' { analysisId }                  │
│                                                                          │
│   3. Frontend refleja:                                                   │
│        • "Análisis: RESUELTO"                                            │
│        • "Hallazgos pendientes: 0"                                       │
│        • Botón "Generar Reporte Final" habilitado                       │
│                                                                          │
│ No hay endpoint manual de cierre. Es automático basado en estado         │
│ de findings.                                                             │
│                                                                          │
│ Validaciones:                                                            │
│   ✓ BD.analyses[id].status === "RESOLVED" (si condición cumple)         │
│   ✓ BD.analyses[id].completedAt != null                                 │
│   ✓ Dashboard GET /api/v1/analyses/:id refleja "0 hallazgos pendientes" │
│   ✓ Socket emit recibido por clientes                                   │
│   ✓ Reporte ya existe (creado en Fiscal)                                │
│   ✓ Audit log registra cierre                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### **FASE 5: DESCARGAS Y REPORTES**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 5.1: Descargar Reporte PDF                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: GET /api/v1/analyses/{analysisId}/report?format=pdf           │
│ Headers: Authorization: Bearer {token}                                  │
│                                                                          │
│ Acciones:                                                                │
│   1. SELECT report FROM reports WHERE analysisId                        │
│      Si no existe: return 404 "Report not found"                        │
│                                                                          │
│   2. Generar PDF usando jspdf-autotable:                                │
│      - Resumen ejecutivo                                                │
│      - Tabla de hallazgos (severidad, riskType, ubicación)              │
│      - Timeline de commits                                              │
│      - Recomendaciones                                                  │
│      - Metadata (fecha, tokens, modelo)                                 │
│                                                                          │
│   3. Serializar y comprimir PDF                                         │
│                                                                          │
│ Response 200:                                                            │
│   Content-Type: application/pdf                                         │
│   Content-Disposition: attachment; filename="analysis_{id}.pdf"         │
│   Body: PDF Buffer                                                       │
│                                                                          │
│ Data Parity Validations:                                                │
│   ✓ PDF contiene exactamente los mismos datos que BD                    │
│   ✓ riskScore en PDF = BD.report.riskScore                              │
│   ✓ findingsCount en PDF = BD.COUNT(findings)                           │
│   ✓ Tabla hallazgos: misma severidad, mismo orden (DESC por severity)   │
│   ✓ Sin datos dummy o simulados                                         │
│   ✓ Fechas en PDF legibles (ISO format convertido a local)              │
│                                                                          │
│ └─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PASO 5.2: Descargar Reporte JSON                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ Endpoint: GET /api/v1/analyses/{analysisId}/report?format=json          │
│                                                                          │
│ Acciones:                                                                │
│   1. SELECT analysis + findings + forensic_events + report               │
│   2. Serializar a JSON estructura completa                              │
│   3. Retornar como attachment                                           │
│                                                                          │
│ Response 200:                                                            │
│   {                                                                       │
│     "analysis": {                                                        │
│       "id": "analysis_cuid_789",                                        │
│       "projectId": "project_cuid_456",                                  │
│       "status": "RESOLVED",                                             │
│       "findings": [                                                      │
│         { id, severity, riskType, file, ... }                           │
│       ],                                                                  │
│       "forensicEvents": [                                               │
│         { timestamp, commitHash, author, action, ... }                  │
│       ]                                                                   │
│     },                                                                    │
│     "report": {                                                          │
│       "riskScore": 85,                                                   │
│       "executiveSummary": "...",                                        │
│       "findingsCount": 3,                                               │
│       ...                                                                │
│     }                                                                     │
│   }                                                                       │
│                                                                          │
│ Data Parity Validations:                                                │
│   ✓ JSON isomórfico con BD (todos los campos presentes)                 │
│   ✓ Arrays en mismo orden (severity DESC)                               │
│   ✓ Valores numéricos exactos (no redondeados)                          │
│   ✓ Timestamps en ISO 8601 format                                       │
│   ✓ No hay datos faltantes o nulos inesperados                          │
│   ✓ Sin campos ficticio o generados                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## **SECCIÓN 3: CRITERIOS DE ACEPTACIÓN ULTRA-DETALLADOS**

### **CA 1: CREACIÓN DE PROYECTO**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 1.1: Crear proyecto con parámetros válidos                    │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: Usuario autenticado, repositoryUrl válida y única                 │
│ CUANDO: POST /api/v1/projects { name, repositoryUrl, branch }          │
│ ENTONCES:                                                                │
│   • Response HTTP 201 Created                                            │
│   • Response.success === true                                            │
│   • Response.data.id válido (CUID format: 24 chars)                     │
│   • Response.data.name === request.name (exacto)                        │
│   • Response.data.repositoryUrl === request.repositoryUrl (exacto)      │
│   • Response.data.branch === request.branch || "main"                   │
│   • Response.data.createdAt ISO 8601 válido                             │
│   • BD.projects[id].repositoryUrl UNIQUE constraint válido               │
│   • BD.projects[id].userId === autenticado.id                           │
│   • BD.projects[id].maxFileSizeKb === 150 (default)                     │
│   • BD.projects[id].maxTotalSizeMb === 2 (default)                      │
│   • BD.projects[id].maxDirectoryDepth === 6 (default)                   │
│   • BD.projects[id].maxCommits === 50 (default)                         │
│   • BD.audit_logs contiene entrada { action: "create", resourceId: id } │
│   • Varianza datos: 0% (exactitud total entre request y BD)             │
│                                                                          │
│ ESCENARIO 1.2: Rechazar repositoryUrl duplicada                         │
│   DADO: Otro proyecto existe con mismo repositoryUrl                    │
│   CUANDO: POST /api/v1/projects { repositoryUrl: "existente" }         │
│   ENTONCES:                                                              │
│     • Response HTTP 409 Conflict o 400 Bad Request                      │
│     • Response.error contiene "unique" o "duplicate"                    │
│     • BD no inserta nuevo proyecto                                       │
│     • Project count sin cambios                                          │
│                                                                          │
│ ESCENARIO 1.3: Token GitHub encriptado                                  │
│   DADO: githubToken proporcionado en request                            │
│   CUANDO: POST /api/v1/projects { githubToken: "ghp_xxx" }             │
│   ENTONCES:                                                              │
│     • BD.projects[id].githubToken != "ghp_xxx" (encriptado)             │
│     • decrypt(BD.projects[id].githubToken) === "ghp_xxx"                │
│     • GET /api/v1/projects/:id NUNCA retorna githubToken en plaintext   │
│     • Token es 256-bit AES o superior                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### **CA 2: VALIDACIÓN DE REPOSITORIO**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 2.1: Validar repo accesible                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: Project creado, repositorio público o token válido                │
│ CUANDO: POST /api/v1/github/validate-access { projectId }             │
│ ENTONCES:                                                                │
│   • Response HTTP 200 OK                                                │
│   • Response.success === true                                           │
│   • Response.isAccessible === true                                      │
│   • Response.branchExists === true                                      │
│   • Response.repositorySize > 0 (bytes)                                 │
│   • BD.projects[id].lastValidatedAt = now() (±1 segundo)                │
│   • Git clone exitoso: exit code 0                                      │
│   • Directorio temporal creado: fs.existsSync(tempPath)                 │
│   • Rama verificada: git branch -r output contiene "origin/{branch}"    │
│                                                                          │
│ ESCENARIO 2.2: Rechazar repo no accesible                               │
│   DADO: Repositorio privado sin token, o credenciales inválidas         │
│   CUANDO: POST /api/v1/github/validate-access { projectId }           │
│   ENTONCES:                                                              │
│     • Response HTTP 400 Bad Request                                      │
│     • Response.error describe problema específico:                       │
│       - "Invalid credentials" (si 401 de GitHub)                        │
│       - "Repository not found" (si 404 de GitHub)                       │
│       - "Repository too large" (si > 2GB)                               │
│     • BD.projects[id].lastValidatedAt != null (pero sigue siendo nulo)   │
│       (No se actualiza si validación falla)                             │
│                                                                          │
│ ESCENARIO 2.3: Rama no existe                                            │
│   DADO: branch especificada no existe en repositorio                    │
│   CUANDO: POST /api/v1/github/validate-access                          │
│   ENTONCES:                                                              │
│     • Response HTTP 400 Bad Request                                      │
│     • Response.error === "Branch not found"                              │
│     • Git checkout {branch} falla: exit code != 0                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### **CA 3: ENCOLA DE ANÁLISIS**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 3.1: Encolar análisis nuevo                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: Project validado, no hay análisis en progreso                     │
│ CUANDO: POST /api/v1/projects/{projectId}/analyses { }                 │
│ ENTONCES:                                                                │
│   • Response HTTP 201 Created                                            │
│   • Response.success === true                                           │
│   • Response.data.analysisId válido (CUID)                              │
│   • Response.data.status === "PENDING"                                  │
│   • Response.data.progress === 0                                        │
│   • BD.analyses[id].status === "PENDING"                                │
│   • BD.analyses[id].progress === 0                                      │
│   • BD.analyses[id].startedAt === null (aún no comenzó)                 │
│   • BD.analyses[id].completedAt === null                                │
│   • BD.analysis_jobs[analysisId].bullJobId existe en Redis              │
│   • BD.analysis_jobs[analysisId].status === "PENDING"                   │
│   • BD.analysis_jobs[analysisId].attempts === 0                         │
│   • Bull queue contiene job: { analysisId, projectId, isIncremental }  │
│   • Socket emit 'analysis:started' recibido                             │
│   • BD.audit_logs registra { action: "create", resourceType: "analysis" }│
│                                                                          │
│ ESCENARIO 3.2: Análisis incremental                                     │
│   DADO: Hay análisis anterior completado                                │
│   CUANDO: POST /api/v1/analyses { isIncremental: true }                │
│   ENTONCES:                                                              │
│     • BD.analysis_jobs[id].data.isIncremental === true                  │
│     • Worker obtiene lastCommitSha del análisis anterior                │
│     • Inspector solo procesa archivos cambiados desde esa fecha          │
│     • Si no hay cambios: analysis termina temprano con status COMPLETED  │
│     • Si hay cambios: procesa normalmente                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### **CA 4: PROCESAMIENTO INSPECTOR**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 4.1: Inspector detecta hallazgos reales                       │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: Worker comienza a procesar, repo válido                           │
│ CUANDO: Bull Worker ejecuta Inspector Agent                             │
│ ENTONCES:                                                                │
│   • BD.analyses[id].status === "INSPECTOR_RUNNING"                      │
│   • BD.analyses[id].progress === 10                                     │
│   • Inspector Agent llamada a Claude Sonnet 4.6                         │
│   • Cada Finding contiene:                                               │
│     - file: string (path válido, ej: "src/auth.ts")                     │
│     - lineRange: "X-Y" format (ej: "45-52", not "45:52")                │
│     - severity: CRITICAL|HIGH|MEDIUM|LOW (enum)                        │
│     - riskType: BACKDOOR|INJECTION|LOGIC_BOMB|OBFUSCATION|              │
│               SUSPICIOUS|ERROR_HANDLING|HARDCODED_VALUES                │
│     - codeSnippet: código real del repositorio (no ficticio)            │
│     - whySuspicious: explicación técnica específica                      │
│     - remediationSteps: array no vacío (min 1 elemento)                 │
│     - confidence: float ∈ [0.0, 1.0]                                    │
│   • Cada Finding insertado en BD con mismo contenido exacto             │
│   • Mapeo de severidad: CRÍTICO → CRITICAL, ALTO → HIGH                 │
│   • Mapeo de riskType: PUERTA_TRASERA → BACKDOOR, etc                   │
│   • BD.findings[id].analysisId === analysisId                           │
│   • BD.findings[id].deletedAt === null (nuevo)                          │
│   • BD.finding_status_changes[?].status === "DETECTED"                  │
│   • Socket emit 'inspector:complete' { cantidad_hallazgos: N }          │
│   • Varianza datos: 0% entre response y BD                              │
│                                                                          │
│ ESCENARIO 4.2: Inspector sin hallazgos                                  │
│   DADO: Código analizad es limpio, sin vulnerabilidades                │
│   CUANDO: Inspector completa                                            │
│   ENTONCES:                                                              │
│     • maliciaOutput.cantidad_hallazgos === 0                            │
│     • BD.COUNT(findings WHERE analysisId) === 0                         │
│     • Proceso continúa con Detective (hallazgos vacío)                  │
│     • Analysis no se cancela (procesa hasta Fiscal)                     │
│                                                                          │
│ ESCENARIO 4.3: Inspector timeout                                        │
│   DADO: Repositorio muy grande o API lenta                             │
│   CUANDO: Análisis dura > 5 minutos en Inspector                       │
│   ENTONCES:                                                              │
│     • Promise.race timeout: throw Error("Inspector Agent timeout")      │
│     • BD.analyses[id].status === "FAILED"                               │
│     • BD.analysis_jobs[id].status === "FAILED"                          │
│     • BD.analyses[id].errorMessage contiene "timeout"                   │
│     • Bull reintenta automáticamente (intento 1, 2, 3)                  │
│     • Si 3 reintentos fallan: status = "FAILED" (final)                 │
│     • Socket emit 'analysis:failed' { error }                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### **CA 5: HALLAZGOS Y DATA PARITY**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 5.1: Data Parity - BD vs API                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: Analysis completado, hallazgos guardados                          │
│ CUANDO: GET /api/v1/analyses/{id}/findings                             │
│ ENTONCES:                                                                │
│   • BD.COUNT(findings) === response.total                               │
│   • Cada response.data[i].id existe en BD                               │
│   • Cada response.data[i].severity === BD.findings[i].severity          │
│   • Cada response.data[i].lineRange === BD.findings[i].lineRange        │
│   • Cada response.data[i].codeSnippet === BD.findings[i].codeSnippet    │
│   • Cada response.data[i].remediationSteps array idéntico a BD          │
│   • Varianza: 0% (exactitud total byte-to-byte)                         │
│   • Orden: severity DESC, confidence DESC (validar orden)               │
│   • Si finding soft-deleted: NO aparece en respuesta                    │
│     (WHERE deletedAt IS NULL)                                           │
│                                                                          │
│ ESCENARIO 5.2: Paginación correcta                                      │
│   DADO: 150 findings en un análisis, limit=50                          │
│   CUANDO: GET /api/v1/analyses/{id}/findings?page=1&limit=50          │
│   ENTONCES:                                                              │
│     • response.data.length === 50 (exactamente limit)                    │
│     • response.total === 150 (total en BD)                              │
│     • response.page === 1                                               │
│     • response.hasMore === true (50+0 < 150)                            │
│     • skip = (1-1)*50 = 0 ✓                                             │
│                                                                          │
│   CUANDO: GET /api/v1/analyses/{id}/findings?page=3&limit=50          │
│   ENTONCES:                                                              │
│     • response.data.length === 50                                       │
│     • skip = (3-1)*50 = 100 ✓                                           │
│     • response.hasMore === true (100+50 < 150)                          │
│                                                                          │
│   CUANDO: GET /api/v1/analyses/{id}/findings?page=4&limit=50          │
│   ENTONCES:                                                              │
│     • response.data.length === 50                                       │
│     • skip = (4-1)*50 = 150 ✓                                           │
│     • response.hasMore === false (150+50 NOT < 150)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### **CA 6: REMEDIACIÓN Y MÁQUINA DE ESTADOS**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 6.1: Transición PENDING → IN_PROGRESS                         │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: RemediationAction en status PENDING                               │
│ CUANDO: PATCH /api/remediation/{id} { status: "IN_PROGRESS" }         │
│ ENTONCES:                                                                │
│   • Response HTTP 200 OK                                                │
│   • Response.data.status === "IN_PROGRESS"                              │
│   • BD.remediation_actions[id].status === "IN_PROGRESS"                 │
│   • BD.remediation_actions[id].startedAt === now() (±1 segundo)         │
│   • Transición válida (no hay restricciones)                            │
│                                                                          │
│ ESCENARIO 6.2: Transición IN_PROGRESS → COMPLETED                       │
│   DADO: RemediationAction en status IN_PROGRESS                         │
│   CUANDO: PATCH /api/remediation/{id} {                                │
│     status: "COMPLETED",                                                │
│     evidence: {                                                          │
│       commitSha: "abc123...def456", [40 chars hex]                       │
│       prUrl: "https://github.com/user/repo/pull/123"                    │
│     }                                                                     │
│   }                                                                       │
│   ENTONCES:                                                              │
│     • Response HTTP 200 OK                                              │
│     • BD.remediation_actions[id].status === "COMPLETED"                 │
│     • BD.remediation_actions[id].completedAt === now()                  │
│     • BD.remediation_actions[id].evidence !== null                      │
│     • BD.remediation_actions[id].evidence.commitSha === "abc123..."      │
│     • commitSha válido: /^[0-9a-f]{40}$/ (SHA-1)                        │
│     • prUrl válido: URL https:// a GitHub                               │
│     • BD.finding_status_changes[?].status === "CORRECTED"               │
│     • Notifications enviadas a analysts                                 │
│                                                                          │
│   SI evidence.commitSha INVÁLIDO:                                        │
│     • Response HTTP 400 Bad Request                                     │
│     • Response.error contiene "invalid commit"                          │
│     • BD sin cambios                                                     │
│                                                                          │
│ ESCENARIO 6.3: Transición COMPLETED → VERIFIED (analyst)                │
│   DADO: RemediationAction en COMPLETED, usuario es ANALYST             │
│   CUANDO: PATCH /api/remediation/{id} { status: "VERIFIED" }           │
│   ENTONCES:                                                              │
│     • Validaciones previas:                                             │
│       - commitSha existe en git: git show {sha} → exit 0                │
│       - Commit afecta archivo del finding: git show {sha} -- file        │
│         SI no afecta: return 400 "Commit doesn't address finding"       │
│     • BD.remediation_actions[id].status === "VERIFIED"                  │
│     • BD.remediation_actions[id].verifiedAt === now()                   │
│     • BD.findings[id].deletedAt === null (restaurar si soft-deleted)    │
│     • BD.finding_status_changes[?].status === "VERIFIED"                │
│     • SI todos los findings del analysis están VERIFIED:                │
│       - BD.analyses[id].status === "RESOLVED" (automático)              │
│       - Socket emit 'analysis:resolved'                                 │
│                                                                          │
│ ESCENARIO 6.4: Transición COMPLETED → REJECTED                          │
│   DADO: RemediationAction en COMPLETED, usuario es ANALYST              │
│   CUANDO: PATCH /api/remediation/{id} {                                │
│     status: "REJECTED",                                                 │
│     comment: "Fix incomplete - credentials still visible"               │
│   }                                                                       │
│   ENTONCES:                                                              │
│     • Response HTTP 200 OK                                              │
│     • BD.remediation_actions[id].status === "REJECTED"                  │
│     • BD.remediation_actions[id].comment === feedback text              │
│     • BD.finding_status_changes[?].status === "IN_CORRECTION" (rollback) │
│     • Notifications enviadas a developer con feedback                   │
│     • Developer puede reintentar: status IN_PROGRESS                    │
│                                                                          │
│ ESCENARIO 6.5: Transición REJECTED → IN_PROGRESS (reintento)            │
│   DADO: RemediationAction en REJECTED                                   │
│   CUANDO: PATCH /api/remediation/{id} { status: "IN_PROGRESS" }        │
│   ENTONCES:                                                              │
│     • BD.remediation_actions[id].status === "IN_PROGRESS"               │
│     • BD.remediation_actions[id].startedAt === now() (actualizado)      │
│     • No hay límite de reintentos (puede hacerse N veces)               │
│     • Permite correcciones iterativas                                   │
│                                                                          │
│ ESCENARIO 6.6: Transiciones INVÁLIDAS                                   │
│   CUANDO: Intento transición inválida (ej: PENDING → VERIFIED)         │
│   ENTONCES:                                                              │
│     • Response HTTP 400 Bad Request                                      │
│     • Response.error: "Invalid state transition"                        │
│     • BD sin cambios                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### **CA 7: CIERRE DE ANÁLISIS**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 7.1: Análisis se cierra automáticamente                       │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: Análisis con 3 hallazgos, todos en estado VERIFIED               │
│ CUANDO: Último finding se marca VERIFIED                                │
│ ENTONCES:                                                                │
│   • DB trigger automático verifica:                                      │
│     SELECT COUNT(*) FROM findings                                        │
│     WHERE analysisId = {id}                                              │
│     AND deletedAt IS NULL                                               │
│     AND status NOT IN ('VERIFIED', 'FALSE_POSITIVE', 'CLOSED')         │
│   • Count === 0 (no hallazgos pendientes)                               │
│   • BD.analyses[id].status === "RESOLVED" (automático)                  │
│   • BD.analyses[id].completedAt ≠ null (puede ya estar set)             │
│   • BD.audit_logs registra cierre automático                            │
│   • Socket emit 'analysis:resolved' { analysisId }                      │
│   • Frontend refleja: "Análisis: RESUELTO"                              │
│   • Frontend refleja: "Hallazgos pendientes: 0"                         │
│   • Botón "Generar Reporte Final" habilitado                            │
│                                                                          │
│ ESCENARIO 7.2: Analysis NO cierra si hay pendientes                     │
│   DADO: 3 hallazgos, 2 VERIFIED, 1 IN_CORRECTION                       │
│   CUANDO: Se actualiza estado de uno                                    │
│   ENTONCES:                                                              │
│     • BD.analyses[id].status ≠ "RESOLVED"                               │
│     • Status se mantiene en estado anterior (COMPLETED, etc)            │
│     • Socket NO emite 'analysis:resolved'                               │
│                                                                          │
│ ESCENARIO 7.3: No hay endpoint manual de cierre                         │
│   CUANDO: Intento POST /api/v1/analyses/{id}/close                     │
│   ENTONCES:                                                              │
│     • Response HTTP 404 Not Found (endpoint no existe)                   │
│     • Cierre es ÚNICAMENTE automático basado en hallazgos                │
└─────────────────────────────────────────────────────────────────────────┘
```

### **CA 8: INTEGRIDAD DE DATOS**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESCENARIO 8.1: No race conditions en asignación                         │
├─────────────────────────────────────────────────────────────────────────┤
│ DADO: Same finding, 2 requests assign a different users                 │
│ CUANDO: POST /api/v1/findings/{id}/assign { user1 } || { user2 }     │
│ PARALELO Y CASI SIMULTÁNEAMENTE                                          │
│ ENTONCES:                                                                │
│   • UNIQUE(findingId) constraint en BD previene dual asignación         │
│   • Request 1 éxito: 201 Created                                        │
│   • Request 2 fallo: 409 Conflict o 400                                 │
│   • BD.finding_assignments[findingId].count === 1 (una sola)            │
│   • Integridad referencial mantenida                                     │
│                                                                          │
│ ESCENARIO 8.2: Soft deletes previenen pérdida de datos                  │
│   DADO: Finding deleted ("eliminado")                                   │
│   CUANDO: GET /api/v1/findings                                          │
│ O         SELECT * FROM findings                                         │
│   ENTONCES:                                                              │
│     • Finding NO aparece en queries normales                             │
│       (WHERE deletedAt IS NULL implícito)                               │
│     • Pero BD.finding[id] sigue existiendo físicamente                  │
│       (deletedAt = timestamp, no es NULL)                               │
│     • Audit trail preservado para investigación                         │
│     • Si remediation se verifica: deletedAt = null (restaurar)          │
│                                                                          │
│ ESCENARIO 8.3: Referential Integrity (Cascade Deletes)                  │
│   DADO: Project eliminado                                               │
│   CUANDO: DELETE projects WHERE id = {projectId}                       │
│   ENTONCES:                                                              │
│     • Prisma onDelete: Cascade ejecuta                                  │
│     • Todos los analyses[projectId] se eliminan                         │
│     • Todos los findings[analysisId] se eliminan (soft: deletedAt set)   │
│     • Todos los remediation_actions se eliminan                         │
│     • Pero audit_logs mantiene histórico                                │
│     • BD integridad preservada                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## **SECCIÓN 4: MATRIZ DE COBERTURA TOTAL**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE COBERTURA DE FLUJOS                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ✅ FASE 0 (Setup)                    ✅ FASE 1 (Proyecto)                  │
│   ├─ Signup usuario                    ├─ Crear proyecto                   │
│   ├─ Configurar token GitHub           ├─ Validar repositorio              │
│   └─ Crear preferencias notificación    └─ Configurar límites              │
│                                                                             │
│ ✅ FASE 2 (Análisis)                 ✅ FASE 3 (Hallazgos)                │
│   ├─ Encolar análisis                  ├─ Visualizar findings              │
│   ├─ Inspector Agent                   ├─ Asignar hallazgo                 │
│   ├─ Detective Agent                   ├─ Crear remediación                │
│   ├─ Fiscal Agent                      └─ Comentar hallazgo                │
│   └─ Manejo de errores + reintentos                                        │
│                                        ✅ FASE 4 (Remediación)             │
│ ✅ FASE 5 (Reportes)                   ├─ PENDING → IN_PROGRESS            │
│   ├─ Descargar PDF                     ├─ IN_PROGRESS → COMPLETED          │
│   ├─ Descargar JSON                    ├─ COMPLETED → VERIFIED             │
│   └─ Dashboard estadísticas             ├─ COMPLETED → REJECTED             │
│                                        └─ Cierre automático                │
│                                                                             │
│ ✅ SEGURIDAD & INTEGRIDAD                                                 │
│   ├─ Tokens encriptados (GitHub, API)                                    │
│   ├─ RBAC (ADMIN, ANALYST, DEVELOPER, VIEWER)                            │
│   ├─ Soft deletes (preservar auditría)                                   │
│   ├─ Race condition prevention (UNIQUE constraints)                       │
│   ├─ Data parity validation (BD ↔ API)                                   │
│   ├─ Audit logging de todas las acciones                                 │
│   ├─ Socket.io real-time notifications                                   │
│   └─ Error handling sin 500 Internal Server Error                        │
│                                                                             │
│ ✅ CONCURRENCIA & RESILIENCIA                                             │
│   ├─ Bull queue with 3 retries (exponential backoff)                     │
│   ├─ Timeouts: Inspector 5m, Detective 3m, Fiscal 2m                     │
│   ├─ Job state persistence (AnalysisJob table)                           │
│   ├─ Análisis incremental (delta desde último commit)                    │
│   └─ Cancelación de análisis en progreso                                 │
│                                                                             │
│ ✅ DATOS & REPORTES                                                       │
│   ├─ 0% varianza entre BD y API (exactitud total)                        │
│   ├─ Caching de resultados IA (node-cache)                               │
│   ├─ PDF export con jspdf-autotable                                      │
│   ├─ JSON export isomórfico con BD                                       │
│   ├─ Cost tracking (tokens de Anthropic API)                             │
│   └─ Soft deletes en findings pero datos preservados                     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## **RESUMEN EJECUTIVO - ÁREAS CRÍTICAS IDENTIFICADAS**

**BUG DETECTADO EN ANÁLISIS INICIAL:**
- `/analyses/:id/forensics` genera "simulated events" si no hay eventos reales
  - PROBLEMA: Usando campos que no existen en schema (filePath, functionName, etc)
  - IMPACTO: Data inconsistency
  - SOLUCIÓN: Necesita corrección en analysis.routes.ts línea 219-297

**ESTADO DEL SISTEMA:**
- Arquitectura sólida con 3 agentes IA (Inspector, Detective, Fiscal)
- Máquina de estados bien definida para Findings y RemediationActions
- Manejo de errores con reintentos automáticos vía Bull
- Soft deletes preservan audit trail
- Real-time WebSocket + notifications
- PERO: Validación de Data Parity requiere verificación exhaustiva

---

**PROXIMOS PASOS:**
1. ✅ FASE 1: Arquitectura (COMPLETADO - Este documento)
2. ⏳ FASE 2: Ejecución de Pruebas E2E (Pendiente aprobación)
3. ⏳ FASE 3: Identificación de Bugs (Basada en Fase 2)
4. ⏳ FASE 4: Certificación o Bloqueo (Resultado final)

**¿Apruebas para proceder a FASE 2?**

