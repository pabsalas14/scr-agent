# 🧪 Testing Guide - PHASE 2: FindingsTracker

## Quick Start - Manual Testing

### 1️⃣ Prerequisites
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- PostgreSQL connected
- Database seeded with test data

### 2️⃣ Login Test
```
URL: http://localhost:5173
Email: admin@coda.local
Password: AdminCoda2024!
Expected: ✓ Redirect to Dashboard
```

### 3️⃣ View Projects
```
Expected Results:
- ✓ See 3 projects in list
- ✓ Project 1: "SCR Bank Batch Processor" (proj-001)
- ✓ Project 2: "SCR Payment API" (proj-002)
- ✓ Project 3: "SCR Auth Module" (proj-003)
```

### 4️⃣ Select Project with Findings
```
Best Project for Testing: "SCR Payment API" (proj-002)
Why: Has 1 analysis with 3 findings
```

### 5️⃣ View Analysis
```
Project: SCR Payment API
Analysis ID: anal-002
Status: COMPLETED
Expected Findings: 3
```

### 6️⃣ View Findings in Tab "Gestor"
```
Click Tab: "🔍 Gestor"
Expected:
- ✓ FindingsTracker component loads
- ✓ KPI Cards show:
  - Total: 3
  - Críticos: 2
  - En Progreso: 0
  - Remediados: 0
- ✓ Filter inputs appear
- ✓ 3 findings grouped by status
```

### 7️⃣ Test Filters
```
Filter by Severidad:
- Select "CRITICAL"
- Expected: 2 findings shown
- Expected: "MEDIUM" finding hidden

Filter by Search:
- Type "processor"
- Expected: 2 findings shown (both from processor.ts)

Reset:
- All filters to "ALL"
- Expected: 3 findings shown again
```

### 8️⃣ View Finding Details
```
Click on any finding card
Expected:
- ✓ Modal opens with full details
- ✓ File location visible
- ✓ Severity badge shown
- ✓ Code snippet visible
- ✓ Remediation steps listed
- ✓ Confidence level shown
```

---

## 🤖 Automated Testing - API Level

### Test Script 1: Complete Flow
```bash
bash /tmp/test-phase2.sh
```

Expected Output:
```
✓ Step 1: LOGIN
✓ Step 2: GET PROJECTS (found 3)
✓ Step 3: GET PROJECT DETAILS
✓ Step 4: GET ANALYSIS
✓ Step 5: GET FINDINGS (found 3 with all fields)
```

### Test Script 2: Find Analysis with Findings
```bash
bash /tmp/find-analysis-with-findings.sh
```

Expected Output:
```
Project: SCR Payment API (proj-002)
✓ Analysis anal-002 has 3 findings!

First finding details:
{
  "id": "finding-006",
  "severity": "CRITICAL",
  "whySuspicious": "Improper TLS certificate validation..."
}
```

### Test Script 3: Comprehensive Test
```bash
bash /tmp/comprehensive-test.sh
```

Expected Output:
```
1️⃣ GET /analyses/:id (with findings)
   Status: COMPLETED
   Findings count (nested): 3

2️⃣ GET /analyses/:id/findings (all with relations)
   Findings count: 3

3️⃣ FINDINGS DETAILS
   [3 findings with all properties]

4️⃣ FIRST FINDING - FULL STRUCTURE
   {id, analysisId, file, severity, riskType, ...}
```

---

## 🔍 Manual API Testing with cURL

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coda.local","password":"AdminCoda2024!"}'
```

Expected Response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user-admin-001",
    "email": "admin@coda.local"
  }
}
```

### Get Projects
```bash
TOKEN="<token-from-login>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/projects
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "proj-002",
      "name": "SCR Payment API",
      "analyses": [{"id": "anal-002", ...}]
    }
    // ... 2 more
  ],
  "count": 3
}
```

### Get Findings
```bash
TOKEN="<token-from-login>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/analyses/anal-002/findings
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "finding-006",
      "analysisId": "anal-002",
      "file": "src/payment/processor.ts",
      "severity": "CRITICAL",
      "riskType": "OBFUSCATION",
      "confidence": 0.97,
      "whySuspicious": "Improper TLS certificate validation - SSL verification disabled",
      "remediationSteps": [
        "Enable SSL certificate validation",
        "Set rejectUnauthorized: true",
        "Implement proper certificate pinning"
      ],
      "statusHistory": null,
      "assignment": null,
      "remediation": null
    },
    // ... 2 more findings
  ]
}
```

---

## 📊 Test Data Available

### Projetos
| ID | Name | Repository | Scope | Analyses |
|----|------|------------|-------|----------|
| proj-001 | SCR Bank Batch Processor | github.com/.../scr-bank-batch | REPOSITORY | 0 |
| proj-002 | SCR Payment API | github.com/.../scr-payment-api | REPOSITORY | 1 (anal-002) |
| proj-003 | SCR Auth Module | github.com/.../scr-auth-module | PULL_REQUEST | 0 |

### Analyses
| ID | Project | Status | Findings |
|----|---------|--------|----------|
| anal-002 | proj-002 | COMPLETED | 3 |

### Findings (anal-002)
| ID | File | Severity | Type | Issue |
|----|------|----------|------|-------|
| finding-006 | src/payment/processor.ts | CRITICAL | OBFUSCATION | SSL verification disabled |
| finding-007 | src/payment/encryption.ts | CRITICAL | OBFUSCATION | Weak encryption algorithm |
| finding-008 | src/payment/processor.ts | MEDIUM | SUSPICIOUS | Weak random number generation |

---

## ✅ Verification Checklist

### Backend Endpoints
- [ ] `POST /api/v1/auth/login` - Works with test credentials
- [ ] `GET /api/v1/projects` - Returns 3 projects
- [ ] `GET /api/v1/projects/:id` - Returns project with analyses
- [ ] `GET /api/v1/analyses/:id` - Returns analysis with findings
- [ ] `GET /api/v1/analyses/:id/findings` - Returns findings with relations

### Frontend Components
- [ ] LoginPage - Logs in successfully
- [ ] MainDashboard - Shows 3 projects
- [ ] ReportViewer - Loads analysis data
- [ ] FindingsTracker - Displays 3 findings
- [ ] Filters - Work correctly (status, severity, search)
- [ ] FindingDetailModal - Shows complete finding info

### Data Integrity
- [ ] Findings have all required fields
- [ ] Severity enums are correct (CRITICAL, HIGH, MEDIUM, LOW)
- [ ] RiskType enums are correct
- [ ] Remediation steps are arrays
- [ ] Timestamps are valid ISO strings

### Performance
- [ ] Login < 1 second
- [ ] Projects load < 1 second
- [ ] Findings load < 1 second
- [ ] Filters respond instantly
- [ ] No console errors

---

## 🐛 Debugging Tips

### Check Backend is Running
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok",...}
```

### Check Frontend is Running
```bash
curl http://localhost:5173
# Expected: HTML response (React app)
```

### Check Database Connection
```bash
# In backend:
npm run db:studio
# Should open Prisma Studio at http://localhost:5555
```

### Check Network Requests
```
In Browser DevTools:
1. Open Network tab
2. Login
3. Look for requests to /api/v1/*
4. Check headers for Authorization token
5. Verify response status is 200
```

### Check Console Errors
```
In Browser DevTools:
1. Open Console
2. Look for errors (red X)
3. Look for warnings (yellow ⚠)
4. Should be clean for this phase
```

### Check Token in LocalStorage
```
In Browser DevTools:
1. Application tab
2. LocalStorage
3. Look for 'auth_token' key
4. Token should be valid JWT (3 parts separated by dots)
```

---

## 🆘 Common Issues & Solutions

### Issue: "Cannot GET /api/v1/analyses/anal-002/findings"
**Solution**: Make sure backend is running on port 3001
```bash
npm run dev:backend
```

### Issue: "401 Unauthorized"
**Solution**: Check if token is in Authorization header
```bash
# Token must be: "Bearer <token>" not just "<token>"
```

### Issue: "CORS error"
**Solution**: Verify frontend port in CORS allowedOrigins in backend
```bash
# Should include http://localhost:5173
```

### Issue: "Findings showing as empty array"
**Solution**: Verify analysis ID has findings in database
```bash
# Use: bash /tmp/find-analysis-with-findings.sh
# To find analysis with actual findings
```

### Issue: "statusHistory/assignment showing as null"
**Solution**: This is expected! Findings don't have data in those tables yet
- statusHistory is null until status changes
- assignment is null until assigned to a user
- remediation is null until remediation started

---

## 📝 Test Results Template

For documenting your test run:

```markdown
# Test Run - [Date]

## Environment
- Backend: http://localhost:3001 ✓
- Frontend: http://localhost:5173 ✓
- Database: PostgreSQL ✓

## Login Test
- Email: admin@coda.local ✓
- Password: AdminCoda2024! ✓
- Result: ✓ Success

## Projects Test
- Count: 3 ✓
- Names: All correct ✓
- Result: ✓ Success

## Findings Test
- Analysis: anal-002 ✓
- Count: 3 ✓
- Severity: 2 CRITICAL, 1 MEDIUM ✓
- Result: ✓ Success

## Overall Result
✅ PHASE 2 - COMPLETE & WORKING
```

---

**Last Updated**: 2026-03-27
**Status**: Ready for Testing
