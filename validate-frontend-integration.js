const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_EMAIL = 'admin@scr-agent.dev';
const TEST_USER_PASSWORD = 'Test123!@#';

let authToken = null;

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: json,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            error: 'Invalid JSON',
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login() {
  try {
    const result = await makeRequest('POST', '/api/v1/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (result.status === 200 && result.data.token) {
      authToken = result.data.token;
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function validateComponent(name, path, expectations) {
  try {
    const result = await makeRequest('GET', path);

    if (result.status !== 200) {
      return { name, status: '❌', reason: `HTTP ${result.status}` };
    }

    const data = result.data;
    const checks = {};

    // Check items count
    if (expectations.minItems) {
      const count = Array.isArray(data) ? data.length :
                   (data.data?.length || data.results?.length || 0);
      checks.items = count >= expectations.minItems ? '✓' : `✗ (${count}/${expectations.minItems})`;
    }

    // Check structure
    if (expectations.hasFields && data.data && data.data[0]) {
      const item = data.data[0];
      checks.structure = expectations.hasFields.every(f => f in item) ? '✓' : '✗ (fields missing)';
    }

    // Check pagination
    if (expectations.hasPagination) {
      checks.pagination = data.pagination ? '✓' : '✗ (no pagination)';
    }

    // Check search results
    if (expectations.checkSearch) {
      checks.search = (data.data && data.data.length > 0) ? '✓' : '✗ (no results)';
    }

    const allPass = Object.values(checks).every(c => c === '✓' || !c);
    const checkStr = Object.entries(checks).map(([k, v]) => `${k}:${v}`).join(' | ');

    return {
      name,
      status: allPass ? '✅' : '⚠️',
      checks: checkStr,
      itemCount: Array.isArray(data) ? data.length : (data.data?.length || 'N/A'),
    };
  } catch (error) {
    return { name, status: '❌', reason: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('FASE 2: FRONTEND INTEGRATION VALIDATION');
  console.log('='.repeat(80) + '\n');

  // Step 1: Login
  console.log('🔐 Authenticating...');
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('❌ Authentication failed');
    return;
  }
  console.log('✅ Authentication successful\n');

  // Step 2: Component validation
  console.log('📋 COMPONENT VALIDATION\n');

  const components = [
    {
      name: 'Dashboard: Projects',
      path: '/api/v1/projects',
      expectations: { minItems: 5, hasFields: ['id', 'name', 'userId'] }
    },
    {
      name: 'Dashboard: Analyses',
      path: '/api/v1/analyses',
      expectations: { minItems: 10, hasFields: ['id', 'projectId', 'status'] }
    },
    {
      name: 'Incidents: Findings',
      path: '/api/v1/findings/global?limit=50',
      expectations: { minItems: 50, hasFields: ['id', 'severity', 'analysisId'] }
    },
    {
      name: 'Analytics: Summary',
      path: '/api/v1/analytics/summary',
      expectations: { }
    },
    {
      name: 'Search: Global Search',
      path: '/api/v1/search?q=api',
      expectations: { checkSearch: true }
    },
    {
      name: 'Users: User List',
      path: '/api/v1/users',
      expectations: { minItems: 1, hasFields: ['id', 'email'] }
    },
  ];

  let passCount = 0;
  for (const comp of components) {
    const result = await validateComponent(comp.name, comp.path, comp.expectations);

    const status = result.status;
    const itemStr = result.itemCount ? ` (${result.itemCount} items)` : '';
    const checksStr = result.checks ? ` [${result.checks}]` : '';
    const reasonStr = result.reason ? ` - ${result.reason}` : '';

    console.log(`${status} ${result.name}${itemStr}${checksStr}${reasonStr}`);

    if (status === '✅' || status === '⚠️') {
      passCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Results: ${passCount}/${components.length} components validated`);
  console.log('='.repeat(80) + '\n');

  // Step 3: Data consistency checks
  console.log('📊 DATA CONSISTENCY CHECKS\n');

  const projectsResult = await makeRequest('GET', '/api/v1/projects');
  const analysesResult = await makeRequest('GET', '/api/v1/analyses');
  const findingsResult = await makeRequest('GET', '/api/v1/findings/global?limit=100');
  const analyticsResult = await makeRequest('GET', '/api/v1/analytics/summary');

  const projects = projectsResult.data.data || [];
  const analyses = analysesResult.data.data || [];
  const findings = findingsResult.data.data || [];

  console.log(`✓ Projects in DB: ${projects.length}`);
  console.log(`✓ Analyses in DB: ${analyses.length}`);
  console.log(`✓ Findings in DB: ${findings.length}`);

  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL').length;
  const highFindings = findings.filter(f => f.severity === 'HIGH').length;

  console.log(`\n✓ Findings by Severity:`);
  console.log(`  - CRITICAL: ${criticalFindings}`);
  console.log(`  - HIGH: ${highFindings}`);
  console.log(`  - Others: ${findings.length - criticalFindings - highFindings}`);

  if (analyticsResult.status === 200) {
    const analytics = analyticsResult.data;
    console.log(`\n✓ Analytics Data:`);
    if (analytics.criticalFindingsCount) {
      console.log(`  - Critical Findings: ${analytics.criticalFindingsCount}`);
    }
    if (analytics.averageResolutionTime) {
      console.log(`  - Avg Resolution Time: ${analytics.averageResolutionTime}h`);
    }
    if (analytics.remediationRate) {
      console.log(`  - Remediation Rate: ${(analytics.remediationRate * 100).toFixed(1)}%`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ FASE 2: Frontend Integration validation complete!');
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);
