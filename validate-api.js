const http = require('http');

const tests = [
  { name: 'GET /api/v1/users', path: '/api/v1/users' },
  { name: 'GET /api/v1/projects', path: '/api/v1/projects' },
  { name: 'GET /api/v1/analyses', path: '/api/v1/analyses' },
  { name: 'GET /api/v1/findings', path: '/api/v1/findings' },
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: test.path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            name: test.name,
            status: res.statusCode === 200 ? '✓' : '✗',
            code: res.statusCode,
            itemCount: Array.isArray(json) ? json.length : json.data?.length || 'N/A',
          });
        } catch (e) {
          resolve({
            name: test.name,
            status: '✗',
            code: res.statusCode,
            error: 'Invalid JSON',
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        name: test.name,
        status: '✗',
        error: 'Connection refused - is server running?',
      });
    });

    req.end();
  });
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('API ENDPOINT VALIDATION (FASE 1)');
  console.log('='.repeat(60) + '\n');

  const results = await Promise.all(tests.map(testEndpoint));

  let passed = 0;
  results.forEach(result => {
    if (result.status === '✓') {
      console.log(`${result.status} ${result.name} [${result.code}] (${result.itemCount} items)`);
      passed++;
    } else {
      console.log(`${result.status} ${result.name}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed}/${results.length} endpoints working`);
  console.log('='.repeat(60) + '\n');

  if (passed === results.length) {
    console.log('✅ All endpoints operational!');
  } else {
    console.log('⚠️  Start the backend server on port 3001');
  }
}

main();
