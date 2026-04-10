# SCR Agent - FASE 2 Testing Plan
## Testing with Actual Findings & Complete Workflow Validation

**Status:** Ready to Execute  
**Objective:** Validate all modules with real security findings and complete remediation workflow

---

## FASE 2 OVERVIEW

After successfully validating the system with clean code (Phase 1), Phase 2 focuses on testing the system with actual security findings to ensure the complete workflow functions properly.

### Key Differences from Phase 1
- **Phase 1:** Clean code repository (0 findings) - validates pipeline infrastructure
- **Phase 2:** Code with vulnerabilities - validates finding detection and remediation workflow

### Expected Flow
```
Analysis with Findings
    ↓
Inspector Agent: Detects N security issues
    ↓
Hallazgos Module: Displays all findings
    ↓
Incidentes Module: Shows critical incidents
    ↓
Investigaciones: Shows forensic timeline
    ↓
Reportes: Generates high-risk assessment
    ↓
Remediación: Create remediation tasks
    ↓
Estadísticas: Aggregated risk metrics
```

---

## OPTION 1: Use Intentionally Vulnerable Code

### Repository Selection
Choose a repository with known security vulnerabilities:
- Outdated dependencies with known CVEs
- Hardcoded credentials/API keys
- SQL injection vulnerabilities
- XSS vulnerabilities
- Unsafe deserialization
- etc.

### Examples (Public Vulnerable Repos)
1. **DVWA (Damn Vulnerable Web Application)**
   - URL: https://github.com/digininja/DVWA
   - Contains: Multiple security issues
   - Type: PHP/MySQL

2. **WebGoat**
   - URL: https://github.com/WebGoat/WebGoat
   - Contains: Educational vulnerability examples
   - Type: Java web application

3. **Juice Shop**
   - URL: https://github.com/bkimminich/juice-shop
   - Contains: OWASP Top 10 vulnerabilities
   - Type: Node.js/Express

---

## OPTION 2: Create Test Repository with Intentional Issues

### Step-by-step
1. Create new GitHub repository
2. Add intentional vulnerabilities:

```javascript
// Example: credentials.js
const API_KEY = "sk-1234567890abcdef"; // Hardcoded secret
const DB_PASSWORD = "admin123"; // Weak password

app.get('/api/user', (req, res) => {
  // SQL Injection vulnerability
  const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

function decryptData(encrypted) {
  // Weak cryptography
  const key = Buffer.from('password');
  return crypto.createDecipher('des', key).update(encrypted);
}
```

3. Commit and push to GitHub
4. Use this repo for Phase 2 testing

---

## PHASE 2 TEST CASES

### Test Case P2-001: Analyze Vulnerable Repository

**Setup:**
- Navigate to Projects
- Create new project with vulnerable code repository
- Initiate analysis

**Expected Results:**
```
Inspector Agent Output:
├── Hallazgos: 3-5 findings
│   ├── Hardcoded credentials (CRITICAL)
│   ├── SQL Injection (HIGH)
│   └── Weak cryptography (MEDIUM)
│
Detective Agent Output:
├── Forensic Events: 2-3 events
│   ├── Author who committed vulnerable code
│   ├── Commit history with vulnerabilities
│   └── Timeline of introduction
│
Fiscal Agent Output:
├── Risk Score: 50-80 (HIGH RISK)
├── Severity: HIGH
└── Recommendations: Immediate remediation
```

**Validation Points:**
- [ ] Inspector finds expected vulnerabilities
- [ ] Severity levels correctly assigned
- [ ] Detective traces code history
- [ ] Risk score reflects findings
- [ ] Report generated with all findings

---

### Test Case P2-002: Hallazgos Module with Findings

**Action:** Navigate to Hallazgos in report

**Expected:**
- List of all findings
- Severity badges (RED for CRITICAL, ORANGE for HIGH, etc.)
- Affected file paths
- Line numbers
- Code snippets
- Description of vulnerability
- CWE references
- CVSS scores
- Remediation recommendations

**Validation:**
- [ ] All findings visible
- [ ] Severity colors correct
- [ ] Code snippets accurate
- [ ] Remediation steps clear

---

### Test Case P2-003: Incidentes Module with Critical Alerts

**Action:** Navigate to Incidentes

**Expected:**
- Badge showing critical incidents count
- List of incident cards
- Severity indicators
- Status tracking
- Affected components

**Validation:**
- [ ] Count matches findings
- [ ] Severity levels correct
- [ ] Incidents properly categorized

---

### Test Case P2-004: Investigaciones Forensic Timeline

**Action:** Navigate to Investigaciones → Timeline

**Expected:**
- Timeline showing when vulnerabilities were introduced
- Commit information
- Author details
- Timeline events
- Searchable/filterable

**Validation:**
- [ ] Events chronologically ordered
- [ ] Author information correct
- [ ] Commit hashes match
- [ ] Timeline visualization working

---

### Test Case P2-005: Reportes with High Risk Assessment

**Action:** View complete report

**Expected:**
- Risk Score: High (50-100)
- Executive Summary: References vulnerabilities
- Technical Details: Full findings list
- Affected Entities: Listed
- Remediation Priority: Clear action items
- Download options: PDF, CSV available

**Validation:**
- [ ] Report reflects findings
- [ ] Risk assessment accurate
- [ ] Downloads work properly
- [ ] Report formatting correct

---

### Test Case P2-006: Create Remediation Task

**Action:** From Hallazgos, click on finding → Create Remediation

**Steps:**
1. Click "Crear Remediación" (Create Remediation)
2. Fill in remediation details:
   - Title: Clear description
   - Description: Action plan
   - Due Date: Set deadline
   - Priority: Mark as HIGH/CRITICAL
3. Assign to team member
4. Submit

**Expected:**
- Remediation created
- Visible in Remediación module
- Linked to finding
- Status: PENDING

**Validation:**
- [ ] Remediation created successfully
- [ ] Link to finding maintained
- [ ] All fields saved
- [ ] Assignment recorded

---

### Test Case P2-007: Remediation Workflow

**Action:** Update remediation status through workflow

**Steps:**
1. View remediation in Remediación module
2. Change status: PENDING → IN_PROGRESS
3. Add comment: "Fixed vulnerability"
4. Attach evidence: Commit hash or PR link
5. Change status: IN_PROGRESS → COMPLETED
6. Add verification evidence

**Expected:**
- Status changes reflected
- Comments saved
- Evidence linked
- History tracked

**Validation:**
- [ ] All status transitions work
- [ ] Comments persisted
- [ ] Evidence properly attached
- [ ] Timeline updated

---

### Test Case P2-008: Estadísticas Aggregation with Findings

**Action:** Navigate to Estadísticas

**Expected:**
- Total Findings count: Updated
- Severity breakdown: Includes findings
- Remediation rate: % of remediated findings
- Risk trends: Graph showing risk over time
- Average resolution time: Calculated

**Validation:**
- [ ] Metrics updated from analysis
- [ ] Aggregation correct
- [ ] Graphs generated
- [ ] Time period selection working

---

### Test Case P2-009: Multi-Finding Analysis

**Action:** Create analysis on repository with 5+ vulnerabilities

**Expected:**
- Inspector identifies all vulnerabilities
- Properly categorized by type
- Severity distribution accurate
- No findings missed
- No false positives

**Validation:**
- [ ] All expected findings present
- [ ] No duplicates
- [ ] Categories correct
- [ ] Severity levels appropriate

---

### Test Case P2-010: Report Export

**Action:** From report page, click CSV/PDF export

**Expected:**
- CSV: All findings in tabular format
- PDF: Professional formatted report
- Both: Include all data
- Downloads successfully

**Validation:**
- [ ] CSV generates without errors
- [ ] PDF generates without errors
- [ ] Content complete in both formats
- [ ] Files downloadable

---

## DATA VALIDATION CHECKLIST

### Database Tables to Verify
- [ ] `analyses` - Has new analysis record
- [ ] `findings` - Contains all detected findings
- [ ] `forensic_events` - Has timeline events
- [ ] `remediation_actions` - Tracks remediation tasks
- [ ] `remediation_comments` - Stores comments/notes
- [ ] `reports` - Contains generated report

### Data Relationships to Check
- [ ] Finding → Analysis (correct association)
- [ ] Finding → Remediation (proper linking)
- [ ] Remediation → User (assignment tracked)
- [ ] Forensic Event → Finding (history linked)
- [ ] Comment → Remediation (audit trail)

---

## PERFORMANCE BENCHMARKS (TARGET)

| Metric | Target | Acceptable |
|--------|--------|------------|
| Analysis Duration | < 60s | < 120s |
| Report Generation | < 5s | < 10s |
| UI Load Time | < 2s | < 5s |
| Data Query | < 500ms | < 1000ms |
| Export Time | < 10s | < 30s |

---

## COMMON ISSUES & TROUBLESHOOTING

### Issue: No findings detected when expected
**Solution:**
- Verify agent configuration
- Check agent logs
- Validate code actually has vulnerabilities
- Test with known vulnerable repo (DVWA)

### Issue: Forensic timeline empty
**Solution:**
- Check git history in repository
- Verify repository cloned successfully
- Check commit detection logic
- Validate detective agent logs

### Issue: Remediation not linking to findings
**Solution:**
- Verify foreign key relationships
- Check database constraints
- Validate API endpoint
- Review assignment logic

### Issue: Export failing
**Solution:**
- Check disk space
- Verify file permissions
- Test report generation first
- Check logs for specific errors

---

## SUCCESS CRITERIA

### Phase 2 is PASSED when:
- [x] Analysis detects multiple security findings
- [x] Hallazgos module displays all findings correctly
- [x] Incidentes shows critical incidents
- [x] Investigaciones shows forensic timeline
- [x] Can create remediation from findings
- [x] Remediation workflow completes successfully
- [x] Reports generate with high risk score
- [x] Statistics properly aggregated
- [x] Exports (CSV/PDF) work correctly
- [x] All data properly persisted in database

---

## EXECUTION TIMELINE

### Estimated Duration
- Setup: 15 minutes
- Test Case Execution: 45 minutes
- Data Validation: 15 minutes
- Issue Resolution: 30 minutes (as needed)
- **Total: ~2 hours**

### Recommended Schedule
- Start Phase 2 immediately after Phase 1 completion
- Complete all test cases in single session
- Document any issues for Phase 3
- Prepare Phase 3 roadmap

---

## DELIVERABLES FOR PHASE 2

1. **Phase 2 Test Results Document**
   - All test cases: PASS/FAIL
   - Screenshots of each module
   - Data validation results

2. **Issues Log**
   - Any bugs or unexpected behavior
   - Severity assessment
   - Recommended fixes

3. **Performance Report**
   - Benchmark measurements
   - Comparison to targets
   - Optimization recommendations

4. **Phase 3 Planning**
   - Identified gaps
   - Additional testing needed
   - Production readiness assessment

---

## NEXT STEPS

1. **Prepare Test Environment**
   ```bash
   # Ensure Phase 1 is complete
   # System is running and healthy
   # Backend logs accessible
   ```

2. **Select Vulnerable Repository**
   - Use DVWA, WebGoat, or Juice Shop
   - OR create custom test repo with intentional vulnerabilities

3. **Create New Project**
   - Navigate to Projects
   - Click "+ Nuevo proyecto"
   - Add vulnerable repository URL
   - Configure scope and settings

4. **Execute Test Cases**
   - Follow test case sequence
   - Document results
   - Take screenshots
   - Note any issues

5. **Validate Database**
   - Query each table
   - Verify relationships
   - Check data completeness

6. **Generate Report**
   - Document all results
   - Create issues for any failures
   - Plan Phase 3

---

**Ready to begin Phase 2 testing when authorized.**

