import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

interface ValidationResult {
  endpoint: string;
  status: 'OK' | 'ERROR' | 'MISMATCH';
  data?: any;
  error?: string;
}

const results: ValidationResult[] = [];

async function testEndpoint(name: string, url: string) {
  try {
    console.log(`\n📊 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await axios.get(url);
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    
    results.push({
      endpoint: name,
      status: 'OK',
      data: response.data,
    });
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    results.push({
      endpoint: name,
      status: 'ERROR',
      error: error.message,
    });
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('FASE 1: ENDPOINT VALIDATION');
  console.log('='.repeat(60));
  
  // Test endpoints
  await testEndpoint('Users List', `${API_URL}/users`);
  await testEndpoint('Projects List', `${API_URL}/projects`);
  await testEndpoint('Analyses List', `${API_URL}/analyses`);
  await testEndpoint('Findings List', `${API_URL}/findings`);
  await testEndpoint('Analytics Summary', `${API_URL}/analytics/summary`);
  await testEndpoint('Findings Critical', `${API_URL}/findings?severity=CRITICAL`);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'OK').length;
  const failed = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`\n✓ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('\n✅ All endpoints working!');
  } else {
    console.log('\n⚠️  Some endpoints need attention');
    console.log('\nFailed endpoints:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      console.log(`  - ${r.endpoint}: ${r.error}`);
    });
  }
}

main().catch(console.error);
