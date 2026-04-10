# SCR Agent - Forensic Code Intelligence Platform

> **Intelligent code analysis platform designed to detect malicious patterns, security threats, and compromised repositories.**

## 🚀 What is SCR Agent?

SCR Agent is a **intelligent code forensics platform** that analyzes your repositories to detect security threats, malicious code patterns, and potential insider risks.

Unlike traditional static analysis tools, SCR Agent:
- 🔍 **Detects behavioral anomalies** in code commits across time
- 🧠 **Uses AI-powered analysis** to identify sophisticated attacks
- 📊 **Visualizes threat patterns** with interactive dashboards
- 🎯 **Tracks remediation** from detection to resolution
- 👥 **Correlates activities** across users and repositories

## ✨ Key Capabilities

### 📈 **Intelligent Threat Detection**
- Analyzes code changes to identify malicious patterns
- Detects business logic attacks and validation bypasses
- Identifies persistent threat indicators across repositories
- Recognizes collusion patterns when multiple users collaborate

### 🔎 **Forensic Investigation**
- Complete timeline visualization of all code changes
- User activity traceability across all repositories
- Author behavior profiling with anomaly detection
- Risk scoring with transparent factor breakdowns

### 📊 **Visual Analytics**
- Interactive heatmaps showing threat density over time
- Risk trend graphs tracking security posture evolution
- Risk maps highlighting vulnerable code areas
- Side-by-side code comparisons for attack analysis

### ✅ **Remediation Management**
- Track findings from detection to resolution
- Monitor remediation progress and deadlines
- Validate fixes with automatic re-analysis
- Comment and collaborate on findings

### 📋 **Comprehensive Reporting**
- Executive summaries with risk scores
- Detailed technical reports with evidence
- Exportable PDF/CSV reports for audits
- Comparison reports showing improvements

### 📝 **Complete Audit Trail**
- Track all user actions (who did what when)
- Resource-level audit history
- System-wide activity dashboard
- Compliance-ready logging

## 🏗️ Architecture

**Backend:**
- Node.js + Express API
- PostgreSQL database
- Redis queue for concurrent analysis
- AI-powered analysis engines

**Frontend:**
- React dashboard with visualizations
- Real-time analysis monitoring
- Forensic timeline browser
- Remediation tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- Git

### Installation

```bash
# Clone and install
git clone https://github.com/your-org/scr-agent.git
cd scr-agent
npm install

# Setup backend
cd packages/backend
npm install
npx prisma migrate dev

# Setup frontend
cd ../frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

Visit `http://localhost:5173`

## 📚 How It Works

### Phase 1: Intelligent Scanning
- Investigates entire git history
- Detects malicious patterns and anomalies
- Only rescans new commits (70% performance improvement)
- Synthesizes findings into risk scores

### Phase 2: Visual Investigation
- Timeline View: when/where threats emerged
- User Profiles: activity across repos
- Risk Heatmaps: threat hotspots
- Audit Trail: complete action history

### Phase 3: Remediation & Validation
- Track fixes and completion status
- Re-analyze to confirm fixes work
- Monitor progress over time
- Collaborate with team

## 🎯 Use Cases

- **Security Teams**: Detect compromised repos, investigate threats, generate audit reports
- **DevOps**: Monitor health, integrate into CI/CD, validate fixes
- **Developers**: Understand security issues, track remediations
- **Executives**: Monitor security trends, track improvements

## 🔒 Security & Privacy

- All analysis runs locally on your infrastructure
- No code sent to external services
- Database encrypted at rest
- Audit trail of all platform activities

## 📖 Documentation

- [Installation Guide](./docs/installation.md)
- [Configuration](./docs/configuration.md)
- [API Reference](./docs/api.md)

## 📝 License

MIT

---

**SCR Agent**: *Detect. Investigate. Remediate.*
