# 📋 SCR Agent - Módulos Diseñados & Roadmap

**Última actualización:** 2026-04-14  
**Estado:** 13/45 módulos implementados (28.9%)

---

## ✅ IMPLEMENTADOS (13 módulos)

### Core Features (7)
- ✅ Authentication (Login/Logout/Token management)
- ✅ Navigation (Sidebar + Top bar)
- ✅ Dashboard (Monitor Central)
- ✅ Projects Management (CRUD básico)
- ✅ Reports (Generación y visualización)
- ✅ Analytics (Métricas básicas)
- ✅ Incidents (Listado y detalles)

### Operations (4)
- ✅ AI Agents (Inspector, Detective, Fiscal)
- ✅ System Monitoring (CPU, Memory, Disk)
- ✅ Cost Tracking (Token counts, pricing)
- ✅ Alerts (Real-time alert system)

### UI Components (2)
- ✅ Advanced Filters (Con ESC support)
- ✅ Settings/Configuración (5 tabs)

---

## 🚀 NO IMPLEMENTADOS - PHASE 0 (3 módulos)

### Foundation UX Features (CRÍTICO - hacer primero)

**1. ConfirmDialog Component**
- File: `/packages/frontend/src/components/ui/ConfirmDialog.tsx`
- Features:
  - Modal de confirmación reutilizable
  - Botones OK/Cancel personalizables
  - Para acciones destructivas (delete, etc)
- Status: Diseñado, no implementado
- Effort: 1 hora

**2. Enhanced Toast System**
- File: `/packages/frontend/src/hooks/useToast.ts` (mejorado)
- Features:
  - Success/Error/Warning/Info toasts
  - Auto-dismiss con duración configurable
  - Progress bar visual
  - Stacking (múltiples toasts)
- Status: Parcialmente implementado
- Effort: 2 horas (mejorar existente)

**3. Loading & Skeleton System**
- Files:
  - `/packages/frontend/src/hooks/useLoading.ts`
  - `/packages/frontend/src/components/ui/SkeletonLoader.tsx` (mejorado)
- Features:
  - Loading states para async operations
  - Skeleton placeholders
  - Progress bars
- Status: Parcialmente implementado
- Effort: 1.5 horas (mejorar existente)

---

## 🎯 NO IMPLEMENTADOS - PHASE 1 (6 módulos)

### CI/CD & Webhooks Integration

**1. GitHub Webhook Integration**
- Files:
  - `/packages/backend/src/routes/integrations.routes.ts`
  - `/packages/backend/src/services/ci-integration.service.ts`
  - `/packages/backend/src/services/webhook.service.ts`
  - `/packages/frontend/src/components/Settings/IntegrationSettings.tsx`
- API Endpoints:
  - `POST /api/v1/integrations/github/setup`
  - `POST /api/v1/integrations/github/test-webhook`
  - `POST /webhook/github` (receiver)
- Features:
  - Webhook receiver for GitHub events
  - Auto-trigger analysis on PR/push
  - Block merge on critical findings
- Status: Diseñado
- Effort: 3-4 horas
- Dependencies: ngrok/tunnel setup

**2. Webhook Management UI**
- Files:
  - `/packages/frontend/src/components/Webhooks/WebhookManager.tsx`
  - `/packages/frontend/src/components/Webhooks/WebhookDeliveryLog.tsx`
  - `/packages/frontend/src/components/Webhooks/WebhookTester.tsx`
- Features:
  - View/edit/delete webhooks
  - Test webhook payload
  - Delivery history & logs
  - Retry failed deliveries
- Status: Diseñado
- Effort: 2-3 horas
- Data Model: WebhookConfig, WebhookEvent

**3. Remediation Tracking Enhanced**
- Files:
  - `/packages/backend/src/routes/remediations.routes.ts` (mejorado)
  - `/packages/backend/src/services/remediation.service.ts`
  - `/packages/frontend/src/components/Remediation/RemediationTracker.tsx`
- API Endpoints:
  - `GET /api/v1/remediations/:id/history`
  - `POST /api/v1/remediations/:id/validate`
  - `GET /api/v1/remediations/:id/validation`
- Features:
  - Status change audit trail
  - Re-analysis after fix
  - Verification workflow
  - SLA tracking
- Status: Parcialmente implementado
- Effort: 2-3 horas

**4. Execution History Component**
- File: `/packages/frontend/src/components/Analysis/ExecutionHistory.tsx`
- Features:
  - List of past analysis runs
  - Timestamps, status, results
  - Performance metrics
  - Pagination
- Status: Diseñado
- Effort: 1.5 horas

**5. AnalysisMonitor Component**
- File: `/packages/frontend/src/components/Monitoring/AnalysisMonitor.tsx`
- Features:
  - Real-time progress tracking
  - Status updates via WebSocket
  - Cancel functionality
  - ETA calculation
- Status: Diseñado
- Effort: 2 horas

**6. Analysis Progress Real-time**
- File: `/packages/frontend/src/components/Analysis/AnalysisProgress.tsx` (mejorado)
- Features:
  - Progress bar (0-100%)
  - Timer/elapsed time
  - Real-time updates
  - Cancel button with confirmation
- Status: Parcialmente implementado
- Effort: 1.5 horas (mejorar existente)

---

## 🔗 NO IMPLEMENTADOS - PHASE 2 (9 módulos)

### External Integrations & Incident Management

**1. Jira Integration**
- Files:
  - `/packages/backend/src/services/jira-integration.service.ts`
  - `/packages/frontend/src/components/Settings/JiraConfigPanel.tsx`
  - `/packages/frontend/src/components/Findings/JiraTicketLink.tsx`
- Features:
  - Auto-create tickets from findings
  - Bidirectional sync
  - Custom field mapping
  - Priority/severity mapping
- Status: Diseñado
- Effort: 4-5 horas
- Dependencies: jira.js SDK

**2. Slack Notifications**
- Files:
  - `/packages/backend/src/services/slack-notifier.service.ts`
  - `/packages/frontend/src/components/Settings/NotificationChannelSetup.tsx`
- Features:
  - Real-time critical findings alerts
  - Remediation status updates
  - Configurable channels
  - Rate limiting
- Status: Diseñado
- Effort: 2-3 horas
- Dependencies: @slack/web-api

**3. Teams Notifications**
- Files:
  - `/packages/backend/src/services/teams-notifier.service.ts`
- Features:
  - Same as Slack but for Teams
  - Webhook-based
  - Adaptive cards
- Status: Diseñado
- Effort: 2-3 horas
- Dependencies: Teams Webhook SDK

**4. Incident Management Enhanced**
- Files:
  - `/packages/backend/src/routes/incidents.routes.ts` (mejorado)
  - `/packages/frontend/src/components/Incidents/IncidentDetail.tsx` (mejorado)
  - `/packages/frontend/src/components/Incidents/IncidentComments.tsx`
  - `/packages/frontend/src/components/Incidents/SLAIndicator.tsx`
- Database:
  - Add: assignedTo, dueDate, priority fields
  - New: incident_comments table
  - New: incident_history table
- Features:
  - Assign to users
  - Comments/notes
  - SLA tracking
  - Custom workflow states
  - History audit
- Status: Parcialmente implementado
- Effort: 3-4 horas

**5. Alert Rules Engine**
- Files:
  - `/packages/backend/src/services/alert-engine.service.ts`
  - `/packages/backend/src/routes/alerts.routes.ts` (mejorado)
  - `/packages/frontend/src/components/Alerts/AlertRuleBuilder.tsx`
  - `/packages/frontend/src/components/Alerts/AlertHistory.tsx`
- Features:
  - Customizable alert rules (by severity, type, project)
  - Escalation policies
  - Suppression windows
  - Alert history & analytics
- Status: Diseñado
- Effort: 3-4 horas

**6. Escalation Policies**
- File: `/packages/frontend/src/components/Alerts/EscalationPolicy.tsx`
- Features:
  - On-call scheduling integration
  - Multi-level escalation
  - Notification preferences
- Status: Diseñado
- Effort: 2-3 horas
- Dependencies: On-call system API

**7. Alert Suppression**
- Feature set inside Alert Rules Engine
- Features:
  - Time windows when alerts are suppressed
  - Regex patterns for noise
  - Manual suppression
- Status: Diseñado
- Effort: 1 hora (con Alert Rules Engine)

**8. Notification Center**
- Files:
  - `/packages/frontend/src/components/Notifications/NotificationCenter.tsx`
  - `/packages/frontend/src/components/Notifications/NotificationBell.tsx`
- Features:
  - Bell icon with unread count
  - Dropdown with notification history
  - Mark as read/unread
  - Clear all
- Status: Diseñado
- Effort: 1.5 horas

**9. Global Search Integration**
- Files:
  - `/packages/backend/src/routes/search.routes.ts`
  - `/packages/backend/src/services/search.service.ts`
  - `/packages/frontend/src/components/Search/GlobalSearchBar.tsx` (mejorado)
- API Endpoints:
  - `GET /api/v1/search?q=&filters=`
  - `GET /api/v1/search/suggestions`
- Features:
  - Search across findings, projects, reports
  - Autocomplete suggestions
  - Advanced filter combinations
- Status: Parcialmente diseñado
- Effort: 2-3 horas

---

## 📊 NO IMPLEMENTADOS - PHASE 3 (10 módulos)

### Compliance, Risk & Analytics

**1. Compliance Reports (OWASP/CWE/CVSS)**
- Files:
  - `/packages/backend/src/services/compliance.service.ts`
  - `/packages/backend/src/services/cvss-calculator.service.ts`
  - `/packages/frontend/src/components/Compliance/ComplianceReportViewer.tsx`
  - `/packages/frontend/src/components/Compliance/CVSSScorecard.tsx`
- Data Files:
  - `/packages/frontend/src/data/owasp-top-10-2021.json`
  - `/packages/frontend/src/data/cwe-top-25.json`
- Features:
  - Auto-map findings to OWASP Top 10 2021
  - CWE and CVSS v3.1 scoring
  - PCI-DSS, HIPAA, SOC2 frameworks
  - Compliance dashboard
- Status: Diseñado
- Effort: 4-5 horas
- Data: OWASP/CWE/CVSS mappings

**2. Risk Management Module**
- Files:
  - `/packages/backend/src/services/risk-management.service.ts`
  - `/packages/frontend/src/components/Risk/RiskProfileCard.tsx`
  - `/packages/frontend/src/components/Risk/RiskAssessmentWizard.tsx`
  - `/packages/frontend/src/components/Risk/RiskMitigationTracker.tsx`
- Features:
  - Overall risk scoring
  - Risk assessments & approvals
  - Mitigation strategies
  - Risk trends over time
  - Risk acceptance workflow
- Status: Diseñado
- Effort: 4-5 horas

**3. Analysis Comparison**
- Files:
  - `/packages/backend/src/routes/comparison.routes.ts`
  - `/packages/backend/src/services/comparison.service.ts`
  - `/packages/frontend/src/components/Analysis/AnalysisComparison.tsx`
  - `/packages/frontend/src/components/Analysis/RiskEvolutionChart.tsx`
  - `/packages/frontend/src/components/Analysis/TrendComparison.tsx`
- API Endpoints:
  - `GET /api/v1/analyses/:id1/compare/:id2`
  - `GET /api/v1/projects/:id/trends`
- Features:
  - Side-by-side analysis comparison
  - Risk score evolution
  - Finding count trends
  - Report versioning
- Status: Diseñado
- Effort: 3-4 horas

**4. Export System (CSV, PDF, Excel, JSON)**
- Files:
  - `/packages/backend/src/services/export.service.ts`
  - `/packages/frontend/src/components/Export/ExportDialog.tsx`
  - `/packages/frontend/src/components/Export/ExportProgressBar.tsx`
- Features:
  - Export findings, incidents, remediation, reports
  - CSV, PDF, Excel, JSON formats
  - Batch export
  - Custom templates
- Status: Diseñado
- Effort: 3-4 horas
- Dependencies: jspdf, xlsx, papaparse

**5. Advanced Dashboard Widgets**
- Files:
  - `/packages/frontend/src/components/Dashboard/WidgetBuilder.tsx`
  - `/packages/frontend/src/components/Dashboard/Dashboard.tsx` (mejorado)
  - `/packages/frontend/src/components/Analytics/RiskHeatMap.tsx`
  - `/packages/frontend/src/components/Analytics/AnalyticsOverview.tsx`
- Features:
  - Drag-drop widget reordering
  - Real-time KPI updates
  - Risk heat map (file-level)
  - Custom metric definitions
- Status: Parcialmente diseñado
- Effort: 4-5 horas

**6. Risk Heat Map**
- File: `/packages/frontend/src/components/Analytics/RiskHeatMap.tsx`
- Features:
  - File-level risk visualization
  - Color-coded by severity
  - Interactive drill-down
  - Historical trends
- Status: Diseñado
- Effort: 2-3 horas

**7. Timeline Visualization**
- File: `/packages/frontend/src/components/Timeline/TimelineViewer.tsx`
- Features:
  - Forensic events timeline
  - Commits, PRs, deployments
  - Incident timeline
  - Search & filter
- Status: Parcialmente implementado
- Effort: 2-3 horas (mejorar existente)

**8. Code Diff Viewer**
- Files:
  - `/packages/frontend/src/components/Code/DiffViewer.tsx`
  - `/packages/frontend/src/components/Forensics/CodeDiffPanel.tsx`
- Features:
  - Syntax highlighting
  - Line-by-line diff
  - Unified/split view
  - Context lines
- Status: Parcialmente diseñado
- Effort: 2-3 horas

**9. Incident Response Viewer**
- File: `/packages/frontend/src/components/Analysis/IncidentResponseViewer.tsx`
- Features:
  - Incident timeline
  - Response steps
  - Actions taken
  - Status tracking
- Status: Parcialmente implementado
- Effort: 1.5 horas (mejorar existente)

**10. Finding State Panel**
- File: `/packages/frontend/src/components/Analysis/FindingStatePanel.tsx`
- Features:
  - Change status workflow
  - Status history
  - Comments
  - Assignment
- Status: Parcialmente implementado
- Effort: 1.5 horas (mejorar existente)

---

## 🤖 NO IMPLEMENTADOS - PHASE 4 (12 módulos)

### Advanced Features & ML

**1. Anomaly Detection (ML)**
- Files:
  - `/packages/backend/src/services/anomaly-detection.service.ts`
  - `/packages/backend/src/services/anomaly-trainer.service.ts`
  - `/packages/frontend/src/components/Anomaly/AnomalyDashboard.tsx`
  - `/packages/frontend/src/components/Anomaly/AnomalyDetail.tsx`
  - `/packages/frontend/src/components/Anomaly/BaselineVisualization.tsx`
- Features:
  - Baseline behavior learning (90 days)
  - Detect unusual patterns
  - Time-series analysis
  - User feedback loop
  - Anomaly severity scoring
- Status: Diseñado
- Effort: 5-6 horas
- Dependencies: isolation-forest, simple-statistics

**2. Public API**
- Files:
  - `/packages/backend/src/routes/api-keys.routes.ts`
  - `/packages/backend/src/services/api-key.service.ts`
  - `/packages/frontend/src/components/API/ApiKeyManager.tsx`
- Features:
  - RESTful API for all resources
  - Scope-based API keys
  - Rate limiting per key
  - HMAC-SHA256 signatures
  - API documentation/Swagger
- Status: Diseñado
- Effort: 3-4 horas

**3. Public Webhooks**
- Files:
  - `/packages/backend/src/routes/public-webhooks.routes.ts`
  - `/packages/backend/src/services/public-webhook.service.ts`
  - `/packages/frontend/src/components/Webhooks/PublicWebhookConfig.tsx`
- Features:
  - Bidirectional webhooks
  - Webhook signing/verification
  - Retry with exponential backoff
  - Delivery logs
- Status: Diseñado
- Effort: 2-3 horas

**4. Custom Security Policies**
- Files:
  - `/packages/backend/src/services/policy-engine.service.ts`
  - `/packages/backend/src/routes/policies.routes.ts`
  - `/packages/frontend/src/components/Policies/PolicyBuilder.tsx`
  - `/packages/frontend/src/components/Policies/PolicyRuleEditor.tsx`
  - `/packages/frontend/src/components/Policies/PolicyTestPanel.tsx`
- Features:
  - Visual policy rule builder
  - Finding classification rules
  - Auto-remediation rules
  - False positive filtering
  - Policy versioning
  - Execution audit trail
- Status: Diseñado
- Effort: 4-5 horas

**5. Dependency Management**
- Files:
  - `/packages/backend/src/services/dependency-scanner.service.ts`
  - `/packages/backend/src/services/vulnerability-db.service.ts`
  - `/packages/frontend/src/components/Dependencies/DependencyTree.tsx`
  - `/packages/frontend/src/components/Dependencies/VulnerabilityList.tsx`
  - `/packages/frontend/src/components/Dependencies/UpgradeRecommendations.tsx`
- Features:
  - Manifest parsing (npm, pip, maven, gradle, cargo)
  - Vulnerability scanning
  - Bill of Materials (SBOM)
  - License compliance
  - Upgrade recommendations
  - Dependency graphs
- Status: Diseñado
- Effort: 5-6 horas

**6. Executive Reports**
- Files:
  - `/packages/backend/src/services/executive-report.service.ts`
  - `/packages/frontend/src/components/Reports/ExecutiveDashboard.tsx`
  - `/packages/frontend/src/components/Reports/ReportScheduleConfig.tsx`
  - `/packages/frontend/src/components/Reports/ReportPreview.tsx`
- Features:
  - Automated C-level reports
  - KPI metrics (MTTR, remediation %, trend)
  - Scheduled email distribution
  - PDF export with branding
  - Period comparison
  - Key insights & recommendations
- Status: Diseñado
- Effort: 4-5 horas

**7. ExplainerChat (AI Explanations)**
- File: `/packages/frontend/src/components/Analysis/ExplainerChat.tsx` ✅ IMPLEMENTADO
- Features:
  - ✅ Side panel chat interface
  - ✅ AI-powered explanations
  - ✅ Real-time responses
  - ✅ Message history
  - ✅ Markdown support
- Status: Implementado
- Effort: Ya realizado (2 horas)
- Note: Se abre con botón "Explicar con IA" en cada hallazgo

**8. Trend Prediction**
- Feature inside Advanced Analytics
- Features:
  - ML-based trend forecasting
  - Risk evolution prediction
  - Seasonality detection
- Status: Diseñado
- Effort: 2-3 horas (con Anomaly Detection)

**9. Comparison Analysis**
- Feature inside Analysis Comparison (Phase 3)
- Covered

**10. Real-time Features (WebSocket)**
- Partially implemented
- Features:
  - WebSocket connection management
  - Live analysis updates
  - Notification delivery
  - Status synchronization
- Status: Parcialmente implementado
- Effort: 1.5 horas (mejorar existente)

**11. SocketClientService Enhancements**
- File: `/packages/frontend/src/services/socket.service.ts` (mejorado)
- Features:
  - Auto-reconnection
  - Event listener management
  - Memory leak prevention
  - Backoff strategy
- Status: Parcialmente implementado
- Effort: 1.5 horas (mejorar existente)

**12. Data Synchronization**
- Features:
  - Cache invalidation
  - Optimistic updates
  - Conflict resolution
  - State reconciliation
- Status: Diseñado
- Effort: 2-3 horas

---

## 📚 NO IMPLEMENTADOS - PHASE 5 (5 módulos)

### Documentation, Learning & Polish

**1. Developer Learning Module**
- Files:
  - `/packages/backend/src/routes/learning.routes.ts`
  - `/packages/backend/src/services/learning-engine.service.ts`
  - `/packages/frontend/src/components/Learning/LearningModule.tsx`
  - `/packages/frontend/src/components/Learning/QuizComponent.tsx`
  - `/packages/frontend/src/components/Learning/ProgressTracker.tsx`
  - `/packages/frontend/src/components/Learning/Certificate.tsx`
- Data Files:
  - `/packages/frontend/src/data/learning-modules.json`
  - `/packages/frontend/src/data/quizzes.json`
- Features:
  - Interactive security training
  - Customized learning paths
  - Knowledge quizzes with scoring
  - Progress tracking & badges
  - Recommendation engine
  - Certificate generation
- Status: Diseñado
- Effort: 4-5 horas

**2. In-App Help System**
- Files:
  - `/packages/frontend/src/components/Help/TooltipProvider.tsx`
  - `/packages/frontend/src/components/Help/HelpPanel.tsx`
  - `/packages/frontend/src/components/Help/OnboardingGuide.tsx`
  - `/packages/frontend/src/components/Help/DocumentationViewer.tsx`
- Data Files:
  - `/packages/frontend/src/data/tooltips.json`
  - `/packages/frontend/src/data/help-topics.json`
- Features:
  - Contextual tooltips
  - Help panels
  - Onboarding guides
  - Feature documentation
  - Video tutorials
- Status: Diseñado
- Effort: 3-4 horas

**3. API Documentation (Swagger)**
- Files:
  - `/packages/backend/docs/api.swagger.json`
  - `/packages/backend/src/middleware/swagger.ts`
  - `/packages/frontend/src/components/API/ApiDocumentation.tsx`
- Features:
  - Interactive Swagger UI
  - Endpoint documentation
  - Request/response examples
  - Authentication guide
  - Rate limiting docs
- Status: Diseñado
- Effort: 2-3 horas

**4. Performance Optimization**
- Features:
  - Virtual list rendering (1000+ items)
  - Database query optimization
  - Redis caching for dashboards
  - Code splitting & lazy loading
  - Image optimization
  - Bundle size reduction
- Status: Diseñado
- Effort: 4-5 horas

**5. Accessibility (a11y)**
- Features:
  - ARIA labels & roles
  - Keyboard navigation
  - Color contrast compliance
  - Screen reader support
  - Focus management
- Status: Diseñado
- Effort: 2-3 horas

---

## 📈 ESTADÍSTICAS

| Phase | Módulos | Implementados | %         |
|-------|---------|---------------|-----------|
| Core  | 13      | 13            | 100%      |
| Phase 0 | 3     | 0             | 0%        |
| Phase 1 | 6     | 0             | 0%        |
| Phase 2 | 9     | 0             | 0%        |
| Phase 3 | 10    | 0             | 0%        |
| Phase 4 | 12    | 1* (ExplainerChat) | 8.3% |
| Phase 5 | 5     | 0             | 0%        |
| **TOTAL** | **58** | **14** | **24%** |

*ExplainerChat está implementado pero no documentado/probado en testing

---

## 🎯 PRÓXIMAS PRIORIDADES

### IMMEDIATE (Esta semana)
1. **Fix UI/UX problems** (Modals, z-index, layout)
   - Modal Context Provider ✅ (completado)
   - Fix z-index system (en progreso)
   - Fix layout spacing (pendiente)
   - Navigation consolidation (pendiente)

2. **Document ExplainerChat** (Por hacer)
3. **Phase 0 completion** (Confirmación dialogs, mejorar toasts)

### SHORT TERM (1-2 semanas)
4. **Phase 1: CI/CD Integration** (Github webhooks, webhook management)
5. **Phase 2: External Integrations** (Jira, Slack, Teams)

### MEDIUM TERM (2-4 semanas)
6. **Phase 3: Compliance & Risk** (OWASP, CWE, CVSS scoring)
7. **Phase 4: Advanced Features** (Anomaly detection, Custom policies)

---

## 💾 DATABASE CHANGES NEEDED

### New Tables (48 total)
- Phase 0: 3 tablas (confirm_dialogs, notifications, search_history)
- Phase 1: 6 tablas (integrations, webhooks, remediation_history, ci_pipelines, etc)
- Phase 2: 9 tablas (jira_configs, notification_channels, alerts, incident_comments, etc)
- Phase 3: 10 tablas (compliance_mappings, risk_profiles, dashboard_configs, etc)
- Phase 4: 12 tablas (anomaly_profiles, api_keys, security_policies, dependencies, etc)
- Phase 5: 8 tablas (learning_modules, learning_progress, help_topics, etc)

### Schema Updates
- Findings: Agregar compliance_mappings, risk_score_details
- Incidents: Agregar assignedTo, dueDate, priority, sla_breach_date
- Analysis: Agregar execution_time, resource_usage, comparison_data
- Projects: Agregar compliance_framework, risk_profile

---

## 📝 NOTAS

1. **ExplainerChat está funcionando pero no fue probado en testing** - Necesita validación en UI
2. **Fase 0 es CRÍTICA** - Debe completarse antes de Phase 1
3. **Database schema necesita actualización** - 48 nuevas tablas en total
4. **API endpoints van a crecer** - De 25 a ~100+ endpoints
5. **Memoria del proyecto** - Este documento debe actualizarse semanalmente

---

## 🔗 REFERENCIAS

- Plan completo: `/Users/pablosalas/scr-agent/.claude/plans/happy-plotting-bunny.md`
- UI/UX Issues: `/Users/pablosalas/scr-agent/UI_UX_ISSUES.md`
- Feature Testing Report: `/Users/pablosalas/scr-agent/FEATURE_TESTING_REPORT.md`
