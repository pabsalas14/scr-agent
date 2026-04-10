# SCR Agent - Complete Features & Functionalities Guide

**Status:** All Features Documented  
**Date:** April 10, 2026  
**Version:** 1.0 - Phase 2 Complete

---

## DASHBOARD FEATURES

### 1. Monitor Central (Central Dashboard)
**Purpose:** Real-time overview of system health and security metrics

**Features:**
- 📊 Health Index metric (0-100%)
- ⚡ System Efficiency percentage
- 🔍 Active analysis count
- 📈 Recent alerts and security incidents
- 📋 Latest completed analyses with risk scores
- 🎯 Remediation summary statistics

**Interactions:**
- Click on any report to view detailed analysis
- View trends over time
- Monitor agent status in real-time

---

### 2. Proyectos (Projects Management)
**Purpose:** Manage code repositories to analyze

**Features:**
- ➕ Create new projects from GitHub URLs
- 📝 Project metadata: name, description, scope
- 🔗 Repository URL management
- 📊 Analysis history per project
- ✏️ Edit project details
- 🗑️ Delete projects
- 🎯 Select analysis scope (Repository, Organization, Pull Request)

**Interactions:**
- Create project → Enter GitHub URL → Configure scope
- View analysis history for each project
- Track analysis counts and trends

---

### 3. Reportes (Analysis Reports)
**Purpose:** View detailed security analysis reports

**Features:**
- 📋 List of all completed analyses
- 🎯 Risk scores (0-100, color-coded)
- 📅 Creation dates and completion times
- ✅ Status indicators (Completed, Failed, In Progress)
- 📥 Download options (PDF, CSV)
- 📊 Quick statistics display

**Interactions:**
- Click on report to view full analysis
- Export data to PDF for documentation
- Export findings to CSV for spreadsheets
- Sort and filter by date, risk score, project

---

## ANALYSIS & FINDINGS

### 4. Hallazgos / Amenazas (Threats/Findings)
**Purpose:** Display all security findings with detailed information

**Features:**
- 🔴 Color-coded severity levels:
  - Red: CRITICAL
  - Orange: HIGH
  - Yellow: MEDIUM
  - Green: LOW
- 📍 File locations with line numbers
- 🎯 Risk type classification
- 💯 Confidence percentage (0-100%)
- 📝 Detailed vulnerability descriptions
- 💻 Code snippets showing vulnerable code
- ✅ Remediation steps
- 🏷️ CWE/CVSS references

**Interactions:**
- Expand/collapse findings by severity
- Click on code snippets to view full context
- View remediation recommendations
- Change finding status (Open, In Progress, Resolved, Closed)
- Add notes and comments
- Assign to team members

**Remediation Workflow:**
1. Click "Cambiar estado del hallazgo" (Change finding status)
2. Select new status from 4 options:
   - **Abierto** (Open): Identified vulnerability requiring attention
   - **En Progreso** (In Progress): Currently being remediated
   - **Resuelto** (Resolved): Fixed or mitigated
   - **Cerrado** (Closed): Rejected or false positive
3. Add optional notes explaining the change
4. Save changes - status is tracked with history

---

### 5. Visor IR (Incident Response)
**Purpose:** Analyze vulnerability patterns and architectural impact

**Features:**
- 📊 **Dynamic Pattern Detection:**
  - Automatically detects ALL vulnerability types found (not limited to 4 categories)
  - Shows actual risk types: HARDCODED_VALUES, BACKDOOR, ERROR_HANDLING, SUSPICIOUS, etc.
  - Each pattern shows occurrence count
  - Severity indicators (⚠️ CRÍTICO, ⚠️ ALTO, etc.)

- 📁 **File Architecture Analysis:**
  - Shows affected files organized by layer
  - Count of vulnerabilities per layer
  - Visual representation of code structure

- 📈 **Risk Distribution:**
  - Breakdown by severity level
  - Percentage distribution
  - Visual risk indicators

**Metrics Displayed:**
- Archivos Analizados (Files Analyzed)
- Patrones Detectados (Detected Patterns - dynamic count)
- Hallazgos Críticos (Critical Findings count)
- Dependencias de Riesgo (Risk Dependencies - total findings)

**Interactions:**
- Expand/collapse pattern sections
- View details for each pattern type
- See affected files and functions
- Click through to view specific findings

---

### 6. Forense (Forensic Timeline)
**Purpose:** Investigate when and how vulnerabilities were introduced

**Features:**
- 📅 Timeline of events ordered chronologically
- 🔍 Forensic event details:
  - Commit hash
  - Author who made the change
  - Timestamp of change
  - Files affected
  - Functions modified
  - Risk level assessment
- 🎯 Severity indicators:
  - Alto (High)
  - Crítico (Critical)
  - etc.

- 🔎 **Filtering Options:**
  - All (Todos)
  - High/Critical (Alto/Crítico)
  - Critical Only (Crítico)

**Interactions:**
- Filter timeline by risk level
- Hover over events for details
- Click events to see affected code
- View commit messages
- Track vulnerability introduction history

---

### 7. Remediación (Remediation Plan)
**Purpose:** Structured plan for fixing identified vulnerabilities

**Features:**
- 📋 **General Remediation Plan:**
  - Step-by-step action items
  - Priority levels
  - Responsible teams
  - Timeline recommendations

- 🎯 **Finding Remediation Tracker:**
  - Lists all open findings
  - Shows current status
  - Tracks progress
  - Documents remediation evidence
  - Links to Pull Requests/Commits

- 📊 **Remediation Metrics:**
  - % of findings remediated
  - Average resolution time
  - Team assignment tracking

**Interactions:**
- Create remediation tasks from findings
- Update remediation status
- Attach evidence (PR links, commit hashes)
- Add comments and notes
- Track completion progress

---

## AGENT MONITORING

### 8. Agentes IA (AI Agents)
**Purpose:** Monitor the three AI agents performing the analysis

**Agent Details:**

#### Inspector Agent 🔍
- **Role:** Code analysis and malware detection
- **Capabilities:**
  - Pattern matching (hardcoded values, backdoors, etc.)
  - Vulnerability identification
  - Confidence scoring
  - Code snippet extraction
- **Status:** Active
- **Execution Count:** Tracks number of analyses processed

#### Detective Agent 🕵️
- **Role:** Git history analysis and forensics
- **Capabilities:**
  - Commit history analysis
  - Author identification
  - Timeline reconstruction
  - Change correlation to findings
- **Status:** Active
- **Execution Count:** Tracks forensic analyses

#### Fiscal Agent 📊
- **Role:** Risk synthesis and reporting
- **Capabilities:**
  - Risk score calculation
  - Severity assessment
  - Executive summary generation
  - Remediation recommendations
- **Status:** Active
- **Execution Count:** Tracks report generation

**Features:**
- ✅ Status indicators (ACTIVE, INACTIVE, ERROR)
- 📊 Fleet health status (HEALTHY, WARNING, CRITICAL)
- 📈 Execution counts per agent
- ⏱️ Last execution timestamp
- 🔄 Agent response times

**Interactions:**
- View agent health status
- Monitor processing queue
- Check execution history
- View agent logs
- Restart agents if needed

---

## ADMINISTRATIVE FEATURES

### 9. Investigaciones (Investigations)
**Purpose:** Track and manage security investigations

**Features:**
- 📋 Investigation list per project
- 🔗 Links to related findings and forensic data
- 📅 Investigation timeline
- 👤 Investigator assignment
- 📝 Investigation notes
- 📊 Evidence tracking

**Interactions:**
- Create new investigations
- Assign to security team members
- Track investigation progress
- Link to findings and commits
- Generate investigation reports

---

### 10. Incidentes (Incidents)
**Purpose:** Track critical security incidents

**Features:**
- 🔴 Critical incident alerts
- 📊 Incident severity levels
- 📝 Incident details and context
- 👤 Assignment to incident response team
- 📅 Timeline and status tracking
- 💬 Incident comments and notes

**Interactions:**
- View high/critical severity findings as incidents
- Assign to incident response team
- Update incident status
- Track resolution
- Generate incident reports

---

### 11. Estadísticas (Analytics)
**Purpose:** Global security metrics and trends

**Features:**
- 📊 **Overall Statistics:**
  - Total findings across all projects
  - Total remediated findings
  - Average risk score
  - Projects analyzed count

- 📈 **Distribution Analysis:**
  - Severity breakdown (pie chart)
  - Risk type distribution
  - Remediation rate percentage
  - Trends over time

- 🎯 **Key Metrics:**
  - Findings per project
  - Critical findings count
  - Remediation completion rate
  - Average resolution time
  - Top vulnerability types

**Interactions:**
- View trend graphs
- Filter by date range
- Compare metrics over time
- Export statistics
- Drill down to specific findings

---

### 12. Sistema (System)
**Purpose:** System health and infrastructure monitoring

**Features:**
- 🟢 Backend API status
- 🗄️ Database connection status
- 📦 Redis/Bull queue status
- ⬆️ System uptime tracking
- 📋 Activity logs
- ⚙️ Configuration info

**Interactions:**
- View real-time system health
- Check service status
- View recent logs
- Monitor connections
- System administration tasks

---

### 13. Costos (Costs/Token Usage)
**Purpose:** Track API usage and costs

**Features:**
- 💰 **Token Usage Tracking:**
  - Input tokens per analysis
  - Output tokens per analysis
  - Total tokens used
  - Cost calculation

- 📊 **Cost Analytics:**
  - Cost per project
  - Cost trends over time
  - Budget tracking
  - Cost per vulnerability type

- 📈 **Metrics:**
  - Average cost per analysis
  - Most expensive analyses
  - Cost optimization suggestions

**Interactions:**
- View token usage by analysis
- Track monthly costs
- Set budget alerts
- Export cost reports

---

## ACCOUNT & SETTINGS

### 14. User Account Management
**Purpose:** Manage user profiles and preferences

**Features:**
- 👤 User profile information
- 🔐 Password management
- 📧 Email settings
- 🔔 Notification preferences
- 🌙 Theme preferences (Light/Dark)

**Interactions:**
- Update profile information
- Change password
- Manage notification settings
- Configure theme
- View account activity

---

### 15. Configuración (Settings)
**Purpose:** Application and project settings

**Features:**
- 🔧 **Application Settings:**
  - Language preferences
  - Interface settings
  - Notification rules
  - Data retention policies

- 📁 **Project Settings:**
  - Repository configuration
  - Analysis scope options
  - Exclusion patterns (files/folders to skip)
  - Custom vulnerability rules

- 🔐 **Security Settings:**
  - API key management
  - Two-factor authentication
  - Session management
  - Permission settings

**Interactions:**
- Configure analysis parameters
- Manage API keys
- Set up notifications
- Configure access controls

---

## EXPORT & REPORTING

### Export Capabilities

#### PDF Export
- Complete analysis report
- Executive summary
- All findings with details
- Risk scores and metrics
- Remediation recommendations
- Formatted for stakeholder distribution

#### CSV Export
- Findings in tabular format
- All metadata (file, line, severity, etc.)
- For spreadsheet analysis
- Easy integration with other tools

#### Custom Reports
- Executive summaries
- Technical deep dives
- Compliance reports
- Timeline reports

---

## COLLABORATION FEATURES

### Team Features
- 👥 Team member management
- 🔗 Finding assignment
- 💬 Comments and discussions
- 📝 Shared notes
- 📧 Email notifications
- 🔔 Alert management

---

## SECURITY FEATURES

### Analysis Security
- 🔐 Encrypted data transmission
- 🛡️ Repository isolation
- 🔑 API key management
- 📋 Audit logging
- ✅ Access control

### Permission Levels
- **Admin:** Full system access
- **Analyst:** Analysis and reporting access
- **Reviewer:** Read-only access
- **Owner:** Project-specific admin access

---

## INTEGRATION CAPABILITIES

### External Integrations
- 🔗 GitHub integration (automatic repo scanning)
- 📧 Email notifications
- 📱 Slack alerts (when configured)
- 🔄 CI/CD pipeline integration
- 📊 SIEM integration options

---

## PERFORMANCE FEATURES

### System Performance
- ⚡ Real-time progress updates
- 📊 Parallel agent execution
- 🔄 Incremental analysis support
- 💾 Caching system
- 📈 Scalable architecture

### Speed Metrics
- Analysis duration: ~30 seconds (avg)
- Report generation: Immediate
- UI response time: <1 second
- Concurrent analyses: Up to 3 parallel

---

## ADVANCED FEATURES

### Analysis Modes

#### Full Analysis
- Complete code scan
- Full git history analysis
- Complete risk assessment
- Used for initial setup

#### Incremental Analysis
- Only analyzes new commits
- Faster processing
- Ideal for CI/CD
- Saves on token usage

#### Targeted Analysis
- Specific file/folder analysis
- Quick spot-checks
- Lower cost
- Rapid feedback

---

## SUMMARY: 85+ FEATURES ACROSS 15 MODULES

| Category | Module | Features | Status |
|----------|--------|----------|--------|
| Dashboard | Monitor Central | 6 | ✅ Working |
| Projects | Proyectos | 6 | ✅ Working |
| Reports | Reportes | 7 | ✅ Working |
| Findings | Hallazgos/Amenazas | 11 | ✅ Working |
| Analysis | Visor IR | 5 | ✅ Working |
| Forensics | Forense | 6 | ✅ Working |
| Remediation | Remediación | 7 | ✅ Working |
| Agents | Agentes IA | 7 | ✅ Working |
| Tracking | Investigaciones | 6 | ✅ Working |
| Incidents | Incidentes | 5 | ✅ Working |
| Analytics | Estadísticas | 8 | ✅ Working |
| System | Sistema | 5 | ✅ Working |
| Costs | Costos | 6 | ✅ Working |
| Settings | Configuración | 8 | ✅ Working |
| Integration | Export/Reporting | 7 | ✅ Working |

---

**Total Features: 85+**  
**Modules: 15**  
**Status: 100% Operational** ✅

---

**Documentation Generated:** April 10, 2026  
**Last Updated:** Phase 2 Complete
