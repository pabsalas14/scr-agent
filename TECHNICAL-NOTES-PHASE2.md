# 🔧 Technical Implementation Notes - PHASE 2

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ReportViewer (Main Component)                                  │
│  ├── Tabs: Resumen | Hallazgos | Gestor | Timeline | Remediation
│  │                                                               │
│  │   Tab "Gestor" renders:                                     │
│  │   └── FindingsTracker                                        │
│  │       ├── KPI Cards (Total, Críticos, etc)                 │
│  │       ├── Filters (Status, Severity, Search)               │
│  │       ├── Findings List (Grouped by Status)                │
│  │       └── Modals (FindingDetail, Remediation)              │
│  │                                                               │
│  └── Uses Services:                                            │
│      ├── apiService.obtenerReporte()                           │
│      ├── apiService.obtenerHallazgos()  ← KEY SERVICE         │
│      ├── apiService.obtenerEventosForenses()                   │
│      └── findingsService.getFindings()                         │
│          └── Wraps apiService.obtenerHallazgos()               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Routes: /api/v1/                                              │
│  ├── /auth/login                    (auth.routes)              │
│  ├── /projects                       (projects.routes)          │
│  ├── /projects/:id                   (projects.routes)          │
│  ├── /projects/:id/analyses          (projects.routes)          │
│  └── /analyses/:id                   (analyses.routes)          │
│  └── /analyses/:id/findings ← PHASE 2 MAIN ENDPOINT           │
│                                                                   │
│  GET /analyses/:id/findings                                    │
│  ├── Query Prisma:                                             │
│  │   └── prisma.finding.findMany({                             │
│  │       where: { analysisId: req.params['id'] },              │
│  │       include: {                                             │
│  │         statusHistory: { ... },                              │
│  │         assignment: { ... },                                 │
│  │         remediation: true                                    │
│  │       }                                                       │
│  │     })                                                        │
│  │                                                               │
│  └── Return:                                                    │
│      └── { success: true, data: plainFindings }                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓ Prisma ORM
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tables:                                                         │
│  ├── analyses                                                    │
│  ├── findings                                                    │
│  ├── finding_status_changes                                     │
│  ├── finding_assignments                                        │
│  ├── remediation_entries                                        │
│  └── ...                                                         │
│                                                                   │
│  anal-002 (COMPLETED Analysis)                                 │
│  ├── 3 findings                                                 │
│  │   ├── finding-006: CRITICAL OBFUSCATION                     │
│  │   ├── finding-007: CRITICAL OBFUSCATION                     │
│  │   └── finding-008: MEDIUM SUSPICIOUS                        │
│  │                                                               │
│  └── No status changes yet (statusHistory = [])                │
│  └── No assignments yet (assignment = null)                     │
│  └── No remediations yet (remediation = null)                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - Step by Step

### 1. Frontend: FindingsTracker Mounted
```typescript
// /packages/frontend/src/components/Reports/ReportViewer.tsx:410
<FindingsTracker analysisId={analysisId} />
```

### 2. React Query Initialization
```typescript
// /packages/frontend/src/components/Dashboard/FindingsTracker.tsx:106-110
const { data: findings = [], isLoading: findingsLoading, refetch } = useQuery({
  queryKey: ['findings', analysisId],
  queryFn: () => findingsService.getFindings(analysisId),
  refetchInterval: 5000,  // Polling every 5 seconds
});
```

### 3. Service Call
```typescript
// /packages/frontend/src/services/findings.service.ts:16-26
async getFindings(analysisId: string): Promise<Finding[]> {
  try {
    const response = await apiService.obtenerHallazgos(analysisId);
    return response || [];
  } catch (error) {
    console.error('Error fetching findings:', error);
    throw error;
  }
}
```

### 4. API Service
```typescript
// /packages/frontend/src/services/api.service.ts:165-170
async obtenerHallazgos(analysisId: string): Promise<Hallazgo[]> {
  const { data } = await this.client.get<ApiResponse<Hallazgo[]>>(
    `/analyses/${analysisId}/findings`
  );
  return data.data;
}
```

### 5. HTTP Request
```
GET http://localhost:3001/api/v1/analyses/anal-002/findings
Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json
```

### 6. Backend Route Handler
```typescript
// /packages/backend/src/routes/analyses.routes.ts:73-103
router.get('/:id/findings', async (req: Request, res: Response) => {
  const findings = await prisma.finding.findMany({
    where: { analysisId: req.params['id'] },
    include: {
      statusHistory: { ... },
      assignment: { ... },
      remediation: true,
    },
    orderBy: [
      { severity: 'desc' },
      { confidence: 'desc' },
    ],
  });

  const plainFindings = JSON.parse(JSON.stringify(findings));
  res.json({ success: true, data: plainFindings });
});
```

### 7. Database Query
```sql
SELECT f.* FROM findings f
WHERE f."analysisId" = 'anal-002'
ORDER BY f.severity DESC, f.confidence DESC
```

### 8. Prisma Joins
```
For each finding:
  - LEFT JOIN finding_status_changes (statusHistory)
  - LEFT JOIN finding_assignments (assignment)
  - LEFT JOIN remediation_entries (remediation)
```

### 9. Response
```json
{
  "success": true,
  "data": [
    {
      "id": "finding-006",
      "analysisId": "anal-002",
      "file": "src/payment/processor.ts",
      "function": "processPayment",
      "lineRange": "35-42",
      "severity": "CRITICAL",
      "riskType": "OBFUSCATION",
      "confidence": 0.97,
      "codeSnippet": "...",
      "whySuspicious": "Improper TLS certificate validation",
      "remediationSteps": [...],
      "createdAt": "2026-03-25T21:18:53.227Z",
      "updatedAt": "2026-03-26T02:18:53.227Z",
      "statusHistory": [],
      "assignment": null,
      "remediation": null
    },
    // ... 2 more findings
  ]
}
```

### 10. Frontend: State Update
```typescript
// React Query caches response under key ['findings', 'anal-002']
// Component updates with new findings data
// FindingsTracker re-renders with findings list
```

### 11. Render: FindingsTracker UI
```
KPI Cards:
  Total: 3
  Críticos: 2
  En Progreso: 0
  Remediados: 0

Findings grouped by Status:
  [DETECTED] - All 3 findings (default status)
```

---

## Key Implementation Details

### Response Format Standardization

**All backend endpoints follow this format:**
```json
{
  "success": boolean,
  "data": T,
  "count"?: number,
  "error"?: string
}
```

**Example:**
```json
{
  "success": true,
  "data": [...]  // Array of findings
}
```

### Prisma Relations Configuration

**Finding model relationships:**
```prisma
model Finding {
  // ... fields ...

  // One-to-many: A finding can have many status changes
  statusHistory FindingStatusChange[]

  // One-to-one optional: A finding may have one assignment
  assignment FindingAssignment?

  // One-to-one optional: A finding may have one remediation entry
  remediation RemediationEntry?
}
```

### JSON Serialization Issue & Solution

**Problem:** Prisma objects don't serialize to JSON cleanly
```typescript
// ❌ WRONG - May have undefined/non-serializable properties
const findings = await prisma.finding.findMany({ ... });
res.json({ data: findings });  // May lose some data
```

**Solution:** Explicit serialization
```typescript
// ✅ CORRECT - Ensures clean JSON
const findings = await prisma.finding.findMany({ ... });
const plainFindings = JSON.parse(JSON.stringify(findings));
res.json({ success: true, data: plainFindings });
```

### React Query Integration

**Key Properties:**
- `queryKey`: `['findings', analysisId]` - Unique cache key
- `queryFn`: Service method that fetches data
- `refetchInterval`: 5000ms - Auto-refresh every 5 seconds
- `staleTime`: 1000 * 60 * 5 - Data stays fresh for 5 minutes

**Advantages:**
- Automatic caching
- Built-in loading/error states
- Background refetching
- Deduplication (multiple requests at same time = 1 actual request)

---

## Type Safety

### TypeScript Interfaces

**Frontend Types:**
```typescript
// /packages/frontend/src/types/findings.ts
export interface Finding {
  id: string;
  analysisId: string;
  file: string;
  function?: string;
  lineRange: string;
  severity: Severity;
  riskType: RiskType;
  confidence: number;
  codeSnippet?: string;
  whySuspicious: string;
  remediationSteps: string[];
  createdAt: string;
  updatedAt: string;

  // Relations
  assignment?: FindingAssignment;
  statusHistory?: FindingStatusChange[];
  remediation?: RemediationEntry;
}
```

**Database Types:**
```prisma
// /packages/backend/prisma/schema.prisma
model Finding {
  id         String   @id @default(cuid())
  analysisId String
  file      String  @db.VarChar(500)
  function  String? @db.VarChar(255)
  // ... etc
}
```

### Type Alignment
- ✅ Frontend types match database schema
- ✅ API responses are typed
- ✅ Service methods have return types
- ✅ No TypeScript errors in compilation

---

## Performance Considerations

### Query Optimization

**Current Query:**
```prisma
prisma.finding.findMany({
  where: { analysisId: req.params['id'] },
  include: {
    statusHistory: {
      include: { changedByUser: { select: { id, name, email } } },
      orderBy: { createdAt: 'desc' },
    },
    assignment: {
      include: { assignedUser: { select: { id, name, email } } },
    },
    remediation: true,
  },
  orderBy: [
    { severity: 'desc' },
    { confidence: 'desc' },
  ],
})
```

**Indexes:**
```prisma
@@index([analysisId])     // For WHERE clause
@@index([severity])       // For ORDER BY
@@index([riskType])       // For future filtering
```

**Expected Performance:**
- Small analyses (< 50 findings): < 50ms
- Medium analyses (50-200 findings): < 200ms
- Large analyses (200+ findings): < 500ms

### Caching Strategy

**React Query:**
- Cache key: `['findings', analysisId]`
- Stale time: 5 minutes
- Refetch interval: 5 seconds
- Memory kept indefinitely (until unmount)

**Benefits:**
- Instant UI updates on cache hit
- Automatic background refresh
- No loading spinner on cache hit

---

## Error Handling

### Frontend Error Handling
```typescript
// Service method catches and logs
catch (error) {
  console.error('Error fetching findings:', error);
  throw error;  // Rethrow for React Query to handle
}

// React Query handles:
// - isLoading: Show spinner
// - isError: Show error message
// - error: Access error details
```

### Backend Error Handling
```typescript
try {
  const findings = await prisma.finding.findMany({ ... });
  res.json({ success: true, data: plainFindings });
} catch (error) {
  logger.error(`Error obteniendo hallazgos: ${error}`);
  res.status(500).json({ error: 'Error al obtener hallazgos' });
}
```

### Network Error Handling
```typescript
// In api.service.ts interceptor
this.client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Testing Points

### Unit Tests (if added)
```typescript
// Would test:
// - FindingsTracker renders correctly
// - Filters update state
// - Service calls correct endpoint
// - Response parsing works
```

### Integration Tests (if added)
```typescript
// Would test:
// - Login → Get token
// - Use token → Call findings endpoint
// - Response has correct structure
// - Frontend consumes response correctly
```

### E2E Tests (if added)
```typescript
// Would test:
// - User logs in
// - Navigates to analysis
// - Views findings
// - Filters work
// - Can click finding details
```

---

## Potential Optimizations (PHASE 3+)

### 1. Pagination
```typescript
// Instead of loading all findings:
interface FindingsRequest {
  analysisId: string;
  skip: number;
  take: number;  // e.g., 50
}
```

### 2. Real-time Updates (WebSockets)
```typescript
// Instead of polling every 5 seconds:
socket.on('findings:updated', (findings) => {
  queryClient.setQueryData(['findings', analysisId], findings);
});
```

### 3. Filtering on Backend
```typescript
// Current: GET all findings, filter on frontend
// Future: GET /analyses/:id/findings?severity=CRITICAL
```

### 4. Caching Headers
```typescript
// Add HTTP caching:
res.set('Cache-Control', 'public, max-age=300');
```

### 5. Batch Operations
```typescript
// Update multiple findings at once:
POST /api/v1/findings/batch
{
  "ids": ["finding-006", "finding-007"],
  "action": "updateStatus",
  "status": "IN_REVIEW"
}
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Prisma client generated
- [ ] Backend compiled
- [ ] Frontend built
- [ ] Tests passing
- [ ] CORS configured for production domain
- [ ] JWT secrets strong
- [ ] Rate limiting configured
- [ ] Logging working
- [ ] Error tracking enabled

---

## Debugging Guide

### Enable Verbose Logging
```typescript
// In backend .env
DATABASE_DEBUG=true
PRISMA_DEBUG=true

// In frontend .env
VITE_DEBUG=true
```

### Check Network Tab
1. Open DevTools
2. Network tab
3. Filter by "findings"
4. Check request/response headers
5. Verify status is 200

### Check Console
```javascript
// In browser console:
localStorage.getItem('auth_token')  // Should return JWT
console.log('findings query cache:', queryClient.getQueryData(['findings', 'anal-002']))
```

### Check Backend Logs
```bash
npm run dev:backend
# Should show: GET /api/v1/analyses/anal-002/findings - 200
```

---

## Documentation References

- **Frontend**: `/packages/frontend/src/` (React + TypeScript)
- **Backend**: `/packages/backend/src/` (Express.js)
- **Database**: `/packages/backend/prisma/schema.prisma`
- **API Types**: `/packages/frontend/src/types/findings.ts`
- **Phase 1**: `PHASE-1-COMPLETE.md`
- **Phase 2**: `PHASE-2-COMPLETE.md`

---

**Last Updated**: 2026-03-27
**Status**: PHASE 2 Complete
**Next**: PHASE 3 - CRUD Operations & Lifecycle Management
