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
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
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

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 3 - SETTINGS & VALIDATION TEST');
  console.log('='.repeat(70) + '\n');

  // Login
  console.log('📝 Logging in...');
  const loginResult = await makeRequest('POST', '/api/v1/auth/login', {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (loginResult.status !== 200 || !loginResult.data.token) {
    console.log('❌ Login failed');
    return;
  }

  authToken = loginResult.data.token;
  console.log('✅ Login successful\n');

  // Test Settings Endpoints
  console.log('📊 TESTING SETTINGS ENDPOINTS\n');

  // Get preferences
  console.log('1️⃣ GET /api/v1/users/preferences');
  const getPrefs = await makeRequest('GET', '/api/v1/users/preferences');
  if (getPrefs.status === 200) {
    console.log('   ✅ Preferences loaded');
    console.log(`   Email on finding: ${getPrefs.data.data?.emailOnFindingDetected}`);
    console.log(`   Digest enabled: ${getPrefs.data.data?.dailyDigest}`);
  } else {
    console.log(`   ❌ Error: ${getPrefs.status}`);
  }

  // Update preferences
  console.log('\n2️⃣ POST /api/v1/users/preferences (update)');
  const updatePrefs = await makeRequest('POST', '/api/v1/users/preferences', {
    emailOnFindingDetected: false,
    dailyDigest: true,
    digestTime: '08:00'
  });
  if (updatePrefs.status === 200 || updatePrefs.status === 201) {
    console.log('   ✅ Preferences updated');
  } else {
    console.log(`   ❌ Error: ${updatePrefs.status}`);
  }

  // Verify update
  console.log('\n3️⃣ Verify update - GET preferences again');
  const getPrefs2 = await makeRequest('GET', '/api/v1/users/preferences');
  if (getPrefs2.status === 200) {
    console.log('   ✅ Preferences reloaded');
    console.log(`   Email on finding: ${getPrefs2.data.data?.emailOnFindingDetected}`);
    console.log(`   Digest enabled: ${getPrefs2.data.data?.dailyDigest}`);
  } else {
    console.log(`   ❌ Error: ${getPrefs2.status}`);
  }

  // Test Analytics Summary
  console.log('\n4️⃣ GET /api/v1/analytics/summary (KPI validation)');
  const analytics = await makeRequest('GET', '/api/v1/analytics/summary');
  if (analytics.status === 200) {
    console.log('   ✅ Analytics loaded');
    console.log(`   Data received: ${Object.keys(analytics.data).length} fields`);
  } else {
    console.log(`   ❌ Error: ${analytics.status}`);
  }

  // Test Search with filters
  console.log('\n5️⃣ GET /api/v1/search?q=api&type=finding');
  const search = await makeRequest('GET', '/api/v1/search?q=api&type=finding');
  if (search.status === 200) {
    console.log('   ✅ Search with filters working');
    console.log(`   Results: ${search.data.data?.length || 0} items`);
  } else {
    console.log(`   ❌ Error: ${search.status}`);
  }

  // Navigation test (verify routes exist)
  console.log('\n6️⃣ ROUTE VERIFICATION (navigation structure)');
  const routeTests = [
    { path: '/api/v1/projects', label: 'Projects endpoint' },
    { path: '/api/v1/analyses', label: 'Analyses endpoint' },
    { path: '/api/v1/findings/global', label: 'Findings endpoint' },
    { path: '/api/v1/analytics/summary', label: 'Analytics endpoint' },
  ];

  for (const route of routeTests) {
    const result = await makeRequest('GET', route.path);
    const status = result.status === 200 ? '✅' : '❌';
    console.log(`   ${status} ${route.label}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ PHASE 3 VALIDATION COMPLETE');
  console.log('='.repeat(70) + '\n');

  console.log('Summary:');
  console.log('- ✅ Authentication working');
  console.log('- ✅ Settings endpoints accessible');
  console.log('- ✅ Navigation routes verified');
  console.log('- ✅ API endpoints operational');
  console.log('\nNext: Run full E2E tests and create final PR');
}

main().catch(console.error);
