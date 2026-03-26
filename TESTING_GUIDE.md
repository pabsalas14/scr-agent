# SCR Agent - Testing Guide

This document provides a comprehensive testing suite to validate the entire SCR Agent flow.

## System Architecture Overview

```
Frontend (5200) → Backend API (3001) → PostgreSQL
                     ↓
                  3 Agents (MCP):
                  - Inspector (Code Analysis)
                  - Detective (Git Forensics)
                  - Fiscal (Synthesis & Reporting)
```

## Prerequisites

- Backend running on port 3001
- Frontend running on port 5200
- Database connected (PostgreSQL)
- GitHub token for private repos (optional but recommended)

## Phase 1: Authentication & Initial Setup

### Test 1.1: Login Flow
```
Objective: Validate user authentication

Steps:
1. Navigate to http://localhost:5200
2. See login form with:
   - Email input
   - Password input
   - Login button
3. Enter credentials:
   - Email: admin@coda.local (default)
   - Password: AdminCoda2024!
4. Click Login
5. Verify: Dashboard loads with "Proyectos" heading
6. Verify: User avatar appears in header with logout option
```

**Validations:**
- ✅ JWT token stored in localStorage
- ✅ Authorization header added to API calls
- ✅ Redirect to dashboard on success
- ✅ Error message on invalid credentials

### Test 1.2: Theme Toggle
```
Objective: Validate dark mode functionality

Steps:
1. From dashboard, click theme toggle (Moon/Sun icon in header)
2. Verify: Page changes to dark mode (black backgrounds, white text)
3. Check all components:
   - Header: Dark theme applied
   - Cards: Dark backgrounds with proper contrast
   - Text: White/light gray on dark
   - Inputs: Dark theme compatible
4. Click toggle again → Light mode
5. Verify: Theme persists on page refresh
```

**Validations:**
- ✅ Theme persists in localStorage
- ✅ CSS variables switch (--color-bg-primary, etc.)
- ✅ All components respect theme
- ✅ Contrast is WCAG AA compliant

---

## Phase 2: Project Management

### Test 2.1: Create REPOSITORY Scope Project
```
Objective: Create project with full repository analysis scope

Steps:
1. Click "Nuevo Proyecto" button
2. Modal appears with form:
   - Nombre del proyecto
   - URL del repositorio
   - Descripción (optional)
   - Alcance (3 radio buttons)
3. Fill form:
   - Nombre: "SCR Bank - Analysis"
   - URL: https://github.com/pabsalas14/scr-bank-20-batch-processor
   - Descripción: "Security analysis of batch processor"
   - Scope: ✓ REPOSITORY (📁 Repositorio completo)
4. Click "Crear Proyecto"
5. Verify:
   - Modal closes
   - Project appears in dashboard
   - Card shows: name, URL, description, 0 analyses
```

**Validations:**
- ✅ Form validation (required fields)
- ✅ URL format validation (GitHub/GitLab/Bitbucket)
- ✅ Scope selection required
- ✅ Project saved to database
- ✅ Card displays correct scope icon (📁)

### Test 2.2: Create PULL_REQUEST Scope Project
```
Objective: Create project for specific PR analysis

Steps:
1. Click "Nuevo Proyecto"
2. Fill form:
   - Nombre: "PR Analysis Test"
   - URL: https://github.com/pabsalas14/scr-bank-20-batch-processor/pull/1
   - Scope: ✓ PULL_REQUEST (📌 Pull Request específico)
3. Create project
4. Verify: Scope icon shows 📌 (PR indicator)
```

**Validations:**
- ✅ PR URL format recognized
- ✅ Scope radio button works
- ✅ Correct icon displayed (📌)

### Test 2.3: Create ORGANIZATION Scope Project
```
Objective: Create project for organization-wide analysis

Steps:
1. Click "Nuevo Proyecto"
2. Fill form:
   - Nombre: "Organization Security Audit"
   - URL: https://github.com/pabsalas14
   - Scope: ✓ ORGANIZATION (🏢 Organización completa)
3. Create project
4. Verify: Scope icon shows 🏢 (org indicator)
```

**Validations:**
- ✅ Organization URL format accepted
- ✅ Scope icon correct (🏢)
- ✅ Can differentiate org from repo URL

---

## Phase 3: GitHub Configuration

### Test 3.1: Configure GitHub Token
```
Objective: Save and validate GitHub token for private repos

Steps:
1. Click avatar in header → Settings
2. Settings modal opens with tabs: API Key | GitHub | Preferencias
3. Click "GitHub" tab
4. See section:
   - Status: "Sin GitHub Token configurado" (gray)
   - Input field: "GitHub Personal Access Token"
   - Placeholder: "ghp_..."
5. Generate GitHub token:
   - Go to github.com → Settings → Developer settings → Personal access tokens
   - Create new token with scopes: repo, read:org
   - Copy token
6. Paste token in settings modal
7. Click "Validar Token"
8. Wait for validation...
9. Verify:
   - Status changes to green: "✓ GitHub Token válido"
   - Input disabled
   - "Eliminar" button appears
   - Toast notification: "Token válido y guardado"
```

**Validations:**
- ✅ Token validated against GitHub API
- ✅ Success/error feedback clear
- ✅ Token persists on page reload
- ✅ Token not exposed in UI (masked in storage)
- ✅ Only valid tokens accepted

### Test 3.2: Delete GitHub Token
```
Steps:
1. From GitHub tab, click "Eliminar" button
2. Modal appears: "¿Estás seguro de que quieres eliminar el GitHub token?"
3. Click confirm
4. Verify:
   - Status returns to "Sin GitHub Token"
   - Input becomes editable again
   - "Eliminar" button disappears
   - Toast: "GitHub token eliminado"
```

---

## Phase 4: Analysis Execution

### Test 4.1: Start Analysis & Monitor Progress
```
Objective: Initiate analysis and observe status transitions

Steps:
1. From dashboard, find "SCR Bank - Analysis" project card
2. See info:
   - 0 análisis
   - "Analizar" button (blue, with play icon)
3. Click "Analizar"
4. ReportViewer page loads with:
   - Header: Project name + Back/PDF buttons
   - Progress bar: [Inspector ⏳] [Detective ⏹] [Fiscal ⏹]
   - Status badge: "INSPECTOR_RUNNING"
   - (No tabs visible yet)
5. Wait 10-20 seconds...
6. Verify: Progress updates:
   - [Inspector ✓] [Detective ⏳] [Fiscal ⏹]
   - Status: "DETECTIVE_RUNNING"
7. Wait another 10-15 seconds...
8. Verify: Progress completes:
   - [Inspector ✓] [Detective ✓] [Fiscal ✓]
   - Status: "COMPLETADO"
   - Tabs appear: Resumen | Hallazgos | Timeline | Remediación
```

**Validations:**
- ✅ Analysis status transitions correctly
- ✅ Progress bar updates in real-time
- ✅ Frontend polling works (every 2-3 seconds)
- ✅ Agents execute in sequence (Inspector → Detective → Fiscal)
- ✅ Report generation visible in real-time

### Test 4.2: Agent Execution Details
```
Objective: Verify each agent executes properly

INSPECTOR PHASE (should see):
- Scans code for malicious patterns
- Identifies vulnerabilities
- Detects secrets
- Creates hallazgos (findings)

DETECTIVE PHASE (should see):
- Analyzes Git history
- Finds who introduced vulnerable code
- When it was introduced (commit date)
- Creates timeline events with author info

FISCAL PHASE (should see):
- Synthesizes findings
- Calculates risk score (0-100)
- Generates executive summary
- Creates remediation steps
- Computes token usage for costs
```

---

## Phase 5: Report Analysis

### Test 5.1: Resumen Tab
```
Objective: Validate executive summary display

Verify elements visible:
1. Gauge de Riesgo (0-100 circle):
   - Number in center
   - Color indicates severity:
     * Green (0-30): Low Risk
     * Yellow (30-70): Medium Risk
     * Orange (70-85): High Risk
     * Red (85-100): Critical Risk
   - Label below: "Riesgo BAJO/MEDIO/ALTO/CRÍTICO"

2. Stats Cards (4 cards in grid):
   - "Hallazgos": Count of findings
   - "Puntuación": Risk score /100
   - "Funciones": Number of affected functions
   - "Autores": Number of affected authors

3. Resumen Ejecutivo (text):
   - 2-3 paragraphs describing overall security posture
   - Should mention findings and severity

4. Desglose por Severidad (bar chart):
   - Severity badges: 🔴 Crítico, 🟠 Alto, 🟡 Medio, 🟢 Bajo
   - Progress bar showing distribution
   - Count for each severity
```

**Validations:**
- ✅ Gauge color matches risk level
- ✅ Stats numbers are accurate
- ✅ Summary is generated by Fiscal agent
- ✅ Severity breakdown adds up to total findings
- ✅ Dark mode colors appropriate

### Test 5.2: Hallazgos Tab
```
Objective: Validate findings list display

Verify elements for each finding card:
1. Severity badge (colored):
   - CRITICAL (red), HIGH (orange), MEDIUM (yellow), LOW (green)

2. Confidence score:
   - "Confianza: XX%" (0-100%)
   - Indicates certainty of finding

3. Location info:
   - File path (monospace font)
   - Function name (if applicable)

4. Description:
   - Why this is suspicious
   - Technical explanation

5. Remediation section:
   - Bold: "Remediación:"
   - Bulleted list of steps
   - Specific code changes needed

Interactions:
- Cards should be readable in both light/dark mode
- Color contrast sufficient for WCAG AA
```

**Validations:**
- ✅ All findings from Inspector agent visible
- ✅ Severity colors consistent with Resumen
- ✅ Each finding has actionable remediation
- ✅ Location information accurate
- ✅ Can scroll through many findings

### Test 5.3: Timeline Tab
```
Objective: Validate forensic timeline visualization

Should display:
1. Timeline visualization (D3.js):
   - Commits shown as events
   - Color-coded by severity
   - Author name visible
   - Date/time of commit

2. Git forensics info:
   - Commit hash (clickable to GitHub)
   - Author email
   - Commit message
   - Files affected
   - Changes summary

3. Links to findings:
   - Timeline events linked to findings
   - Shows which findings this commit introduced

4. Interactive controls:
   - Zoom in/out
   - Pan/navigate
   - Hover for details
```

**Validations:**
- ✅ Timeline visualization renders
- ✅ All forensic events visible
- ✅ Authors correctly identified
- ✅ Dates accurate from Git history
- ✅ Responsive to interactions

### Test 5.4: Remediación Tab
```
Objective: Validate remediation recommendations

Should display:
1. General Recommendation (text):
   - Overview of security posture
   - Priority for fixing
   - Expected impact

2. Numbered Remediation Steps:
   Each step has:
   - Number badge (1, 2, 3...)
   - Action: What to do
   - Justification: Why it matters
   - Urgency badge: Color-coded severity
   - Suggested priority order

3. Step details:
   - Specific code changes
   - Files to modify
   - Expected effort/time
   - Testing considerations

4. Visual hierarchy:
   - Steps in priority order
   - Clear visual separation
   - Easy to follow for developers
```

**Validations:**
- ✅ Remediation steps are specific and actionable
- ✅ Priority order makes sense
- ✅ Urgency badges align with findings
- ✅ Steps can be implemented independently or in order

---

## Phase 6: Export & Sharing

### Test 6.1: Download PDF Report
```
Objective: Generate and download complete analysis report

Steps:
1. From ReportViewer, click "Descargar PDF" button
2. Wait for PDF generation...
3. PDF downloads: `reporte-scr-[analysisId].pdf`
4. Open PDF and verify it contains:
   - Title: Project name + date
   - Executive summary
   - Risk score gauge
   - List of findings
   - Remediation steps
   - Proper formatting and readability
```

**Validations:**
- ✅ PDF generated successfully
- ✅ Filename contains analysis ID
- ✅ All report sections included
- ✅ Formatting is professional
- ✅ Colors/charts render in PDF

---

## Phase 7: Monitoring & Costs

### Test 7.1: System Metrics
```
Objective: Verify real system metrics display

Endpoint: GET /api/v1/monitoring/system-metrics

Should show (REAL VALUES, not mocked):
1. CPU Usage:
   - Percentage (%)
   - Number of cores
   - Should reflect actual server load

2. Memory Usage:
   - Used: MB/GB
   - Total: MB/GB
   - Percentage (%)

3. Disk Usage:
   - Used: MB/GB
   - Total: MB/GB
   - Percentage (%)

4. System Uptime:
   - Seconds since server started
   - Should increase over time

Validation:
- Curl backend: curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/v1/monitoring/system-metrics
- Response should show real values, not zero or mocked data
```

### Test 7.2: Agent Monitoring
```
Objective: Verify agent execution tracking

Endpoint: GET /api/v1/monitoring/agents

Should return 3 agents with REAL execution counts:
1. Inspector Principal
2. Detective Forense
3. Fiscal Análisis

Each agent should have:
- id, name, type, status
- executionCount: (Real count from analyses in DB)
- lastExecution: (Real timestamp from last completed analysis)

Validation:
- executionCount should match COUNT(Analysis.status = 'COMPLETED')
- lastExecution should be from actual analysis, not hardcoded
- Status should be 'active' if backend running
```

### Test 7.3: Cost Calculation (CRITICAL)
```
Objective: Verify costs calculated from REAL token usage (USD)

Endpoint: GET /api/v1/monitoring/costs?period=month

Current State:
- NO analyses completed yet
- Should return: totalCostUSD: $0.00
- Should return: entries: []

After completing an analysis:
- Should query Analysis.report for actual token usage
- Extract: inputTokens, outputTokens, model
- Calculate: (inputTokens * inputPrice) + (outputTokens * outputPrice)
- Return actual USD cost

REAL PRICING (verify in code):
- GPT-4 Turbo: $0.00001/input, $0.00003/output
- GPT-3.5 Turbo: $0.0000005/input, $0.0000015/output
- Claude-3-Opus: $0.000015/input, $0.000075/output
- Claude-3-Sonnet: $0.000003/input, $0.000015/output

Example Calculation:
- Analysis used 250,000 input tokens + 50,000 output tokens
- Model: claude-3-opus
- Cost = (250,000 * 0.000015) + (50,000 * 0.000075)
- Cost = 3.75 + 3.75 = $7.50

Validation:
- ✅ Costs are > $0 if analyses completed
- ✅ Matches token usage from report
- ✅ Correct pricing applied
- ✅ Multiple analyses summed correctly
```

---

## Phase 8: End-to-End Flow

### Complete Test Flow (5-10 minutes)
```
1. Login with admin credentials
2. Create new project (REPOSITORY scope)
3. Start analysis
4. Monitor progress (Inspector → Detective → Fiscal)
5. Wait for completion
6. Verify all 4 report tabs load with data
7. Check dark mode in each tab
8. Configure GitHub token (optional)
9. Download PDF report
10. Check monitoring endpoints for real data
11. Verify costs show actual token usage
```

---

## API Endpoint Testing

### Using curl or Postman

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coda.local","password":"AdminCoda2024!"}'

# Get projects
curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create project
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Project",
    "repositoryUrl":"https://github.com/user/repo",
    "scope":"REPOSITORY"
  }'

# Start analysis
curl -X POST http://localhost:3001/api/v1/projects/{projectId}/analyses \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get analysis status
curl -X GET http://localhost:3001/api/v1/analyses/{analysisId} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Validate GitHub token
curl -X POST http://localhost:3001/api/v1/settings/github-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"ghp_YOUR_GITHUB_TOKEN"}'

# Get monitoring data
curl -X GET http://localhost:3001/api/v1/monitoring/agents \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X GET http://localhost:3001/api/v1/monitoring/system-metrics \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X GET "http://localhost:3001/api/v1/monitoring/costs?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### "CORS: origin not permitted"
- Add `http://localhost:5200` to allowedOrigins in backend index.ts
- Restart backend

### "Analysis stuck in RUNNING"
- Check backend logs for errors
- Verify agents are executing (Inspector, Detective, Fiscal)
- Check Prisma connection to PostgreSQL

### "No findings displayed"
- Verify Inspector agent ran successfully
- Check Finding records in DB
- Ensure code analysis completed

### "Costs show $0.00"
- No analyses completed yet (expected)
- After completing analysis, verify:
  - Analysis.report has tokens data
  - calculateCosts() queries completed analyses
  - Model pricing is defined

### "Dark mode not working"
- Check localStorage for theme setting
- Verify CSS variables are defined in main.css
- Check html.dark class is applied correctly

---

## Success Criteria

✅ All authentication flows work
✅ Projects create with all 3 scope types
✅ Analyses execute and complete successfully
✅ All 4 report tabs display data
✅ GitHub token validation works
✅ System metrics show real data (not $0)
✅ Costs calculated from actual token usage
✅ PDF export generates correctly
✅ Dark mode applies to all components
✅ Responsive design works on mobile/tablet/desktop

---

## Notes

- All times are approximations; actual analysis time depends on code size
- Token usage and costs appear only after first completed analysis
- GitHub token is optional but required for private repository analysis
- System metrics are updated in real-time from the server
- Cost calculations update as new analyses complete
