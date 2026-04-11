const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_EMAIL = 'admin@scr-agent.dev';
const TEST_USER_PASSWORD = 'Test123!@#';

let authToken = null;

async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (authToken && !headers.Authorization) {
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

async function register() {
  try {
    console.log('📝 Registering test user...');
    const result = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (result.status === 201 && result.data.token) {
      authToken = result.data.token;
      console.log(`✅ Registration successful (${TEST_USER_EMAIL})`);
      return true;
    } else if (result.status === 409) {
      console.log(`⚠️  User already exists, attempting login...`);
      return false; // User exists, try login
    } else {
      console.log(`❌ Registration failed: ${result.status}`);
      console.log('Response:', result.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return false;
  }
}

async function login() {
  try {
    console.log('\n📝 Logging in...');
    const result = await makeRequest('POST', '/api/v1/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (result.status === 200 && result.data.token) {
      authToken = result.data.token;
      console.log(`✅ Login successful (${TEST_USER_EMAIL})`);
      return true;
    } else {
      console.log(`❌ Login failed: ${result.status}`);
      console.log('Response:', result.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function validateEndpoint(method, path, description) {
  try {
    const result = await makeRequest(method, path);

    if (result.status === 200) {
      const itemCount = Array.isArray(result.data)
        ? result.data.length
        : (result.data.data?.length || result.data.results?.length || 'N/A');

      console.log(`✅ ${method} ${path} [${result.status}]`);
      console.log(`   ${description} (Items: ${itemCount})`);
      return true;
    } else {
      console.log(`❌ ${method} ${path} [${result.status}]`);
      console.log(`   ${description}`);
      if (result.data?.error) {
        console.log(`   Error: ${result.data.error}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ ${method} ${path}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('API ENDPOINT VALIDATION WITH AUTHENTICATION (FASE 1)');
  console.log('='.repeat(60));

  // Step 1: Register/Login
  let loggedIn = await register();
  if (!loggedIn) {
    loggedIn = await login();
  }

  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Validate endpoints
  console.log('\n📊 Testing endpoints...\n');

  const tests = [
    { method: 'GET', path: '/api/v1/projects', desc: 'Get projects' },
    { method: 'GET', path: '/api/v1/analyses', desc: 'Get analyses' },
    { method: 'GET', path: '/api/v1/findings/global', desc: 'Get findings (global)' },
    { method: 'GET', path: '/api/v1/users', desc: 'Get users' },
    { method: 'GET', path: '/api/v1/analytics/summary', desc: 'Get analytics summary' },
    { method: 'GET', path: '/api/v1/search?q=test', desc: 'Search test' },
  ];

  let passed = 0;
  for (const test of tests) {
    if (await validateEndpoint(test.method, test.path, test.desc)) {
      passed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed}/${tests.length} endpoints working`);
  console.log('='.repeat(60) + '\n');

  if (passed === tests.length) {
    console.log('✅ All endpoints operational!');
  } else {
    console.log('⚠️  Some endpoints are not working properly');
  }
}

main().catch(console.error);
