# 🧪 Testing Guide - SCR Agent

## Quick Start Testing

### 1. Start Development Servers

```bash
# Terminal 1: Backend
cd packages/backend
npm run dev

# Terminal 2: Frontend
cd packages/frontend
npm run dev

# Frontend will be at: http://localhost:5200
# Backend API at: http://localhost:3001
```

---

## 📋 E2E Testing Checklist

### TEST 1: Authentication & Initial Setup
**Goal:** Verify login and initial configuration

✅ Open http://localhost:5200
✅ Login page renders
✅ Enter credentials and click Login
✅ Redirect to Dashboard
✅ See "Mis Proyectos" header
✅ Header shows user avatar with initials

---

### TEST 2: Settings Configuration
**Goal:** Verify GitHub token and API key storage

✅ Click user avatar (top right)
✅ Click "Settings"
✅ Modal opens with 3 tabs (API Key, GitHub, Notificaciones)
✅ API Key Tab: Enter key and save
✅ Toast success message appears
✅ Status updates to "✓ API Key Configurado"
✅ Refresh page - key still configured
✅ GitHub Tab: Enter token and validate
✅ Green checkmark appears if valid

---

### TEST 3: Create Project (Multi-Step Form)
**Goal:** Verify project creation wizard

✅ Click "+ Nuevo Análisis" button
✅ Modal opens with 4-step progress bar
✅ Step 1: Select "Repositorio Completo"
✅ Progress bar updates (25%)
✅ Step 2: Enter project name "Test Project"
✅ Progress bar updates (50%)
✅ Step 3: Enter URL "https://github.com/pabsalas14/scr-bank-20-batch-processor"
✅ Progress bar updates (75%)
✅ Step 4: See confirmation with checkmark animation
✅ Click "Iniciar Análisis"
✅ Modal closes
✅ New project appears in list

---

### TEST 4: Start Analysis & Monitor Progress
**Goal:** Verify analysis starts and progresses

✅ Click blue "▶ Analizar" button on project card
✅ Button changes to "Analizando..."
✅ Redirect to ReportViewer
✅ See progress bar: [Inspector ⏳] [Detective ⏹] [Fiscal ⏹]
✅ Wait for updates - Inspector completes
✅ Progress updates: [Inspector ✅] [Detective ⏳] [Fiscal ⏹]
✅ Wait for Detective to complete
✅ Progress final: [Inspector ✅] [Detective ✅] [Fiscal ✅]
✅ Status changes to "COMPLETADO"

---

### TEST 5: View Complete Report
**Goal:** Verify all report tabs with real data

RESUMEN Tab:
✅ See Gauge with risk score (0-100)
✅ Gauge color matches severity
✅ See 4 KPI cards with data
✅ See executive summary text

HALLAZGOS Tab:
✅ Click "Hallazgos" tab
✅ See table with findings
✅ Click on finding to expand
✅ See code snippet and recommendations
✅ See severity color coding

TIMELINE Tab:
✅ Click "Timeline" tab
✅ See D3 visualization or timeline
✅ See events with commits, dates, authors
✅ Hover over events for details

REMEDIACIÓN Tab:
✅ Click "Remediación" tab
✅ See remediation steps
✅ See code examples
✅ See difficulty level and time estimate

---

### TEST 6: Responsive Design (Mobile)
**Goal:** Verify mobile layout

DevTools: Toggle Device Toolbar (Ctrl+Shift+M) and select iPhone 14

HEADER:
✅ Logo visible
✅ Menu buttons accessible
✅ Avatar clickable
✅ No horizontal scrolling

DASHBOARD:
✅ Project cards stack vertically
✅ Buttons are responsive
✅ KPI cards responsive
✅ Text readable

MODAL:
✅ Modal fits screen
✅ No content cuts off
✅ Buttons touch-friendly (44px+)
✅ Progress bar visible

REPORT:
✅ Tabs accessible
✅ Table scrolls if needed
✅ Charts resize properly
✅ Text readable

---

### TEST 7: Dark Mode
**Goal:** Verify dark mode works

✅ Click theme toggle (sun/moon icon)
✅ App switches to dark mode
✅ Text is readable (good contrast)
✅ Backgrounds are dark
✅ Borders visible
✅ Badges show correct colors
✅ Charts display properly
✅ Click toggle again - switches back
✅ Refresh page - dark mode persists

---

### TEST 8: Backend Integration
**Goal:** Verify API calls work

DevTools > Network Tab:
✅ Create project → see POST /api/v1/projects
✅ Response has project ID
✅ Start analysis → see POST /api/v1/projects/:id/analyses
✅ Response has analysis ID
✅ See polling GETs for status updates
✅ No CORS errors
✅ No 401/403 errors

---

### TEST 9: Error Handling
**Goal:** Verify error recovery

INVALID PROJECT URL:
✅ Create project with invalid URL
✅ See error message
✅ Form stays open for correction

INVALID GITHUB TOKEN:
✅ Settings > GitHub tab
✅ Enter invalid token
✅ See error: "Token inválido"
✅ Can retry with correct token

NETWORK ERROR:
✅ Stop backend
✅ Try to create project
✅ See error message
✅ Start backend again
✅ Request succeeds

---

## Performance Checks

✅ Dashboard loads in < 2 seconds
✅ Report viewer loads in < 1 second
✅ Analysis updates every 2-3 seconds
✅ No layout shifts
✅ Smooth scrolling
✅ Memory usage stable

---

## Browser Compatibility

Test in:
✅ Chrome/Chromium (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Edge (latest)
✅ Mobile Safari (iOS)
✅ Chrome Android

---

## ✅ Sign-Off Checklist

- [ ] TEST 1: Authentication ✅
- [ ] TEST 2: Settings ✅
- [ ] TEST 3: Create Project ✅
- [ ] TEST 4: Start Analysis ✅
- [ ] TEST 5: View Report ✅
- [ ] TEST 6: Responsive Design ✅
- [ ] TEST 7: Dark Mode ✅
- [ ] TEST 8: Backend Integration ✅
- [ ] TEST 9: Error Handling ✅
- [ ] Performance checks ✅
- [ ] Browser compatibility ✅

**Status: Ready for Production 🚀**

