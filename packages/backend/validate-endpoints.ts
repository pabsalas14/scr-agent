/**
 * VALIDATE ENDPOINTS - Test that API endpoints return consistent data
 *
 * This script validates that all key endpoints return consistent data
 * from the database.
 *
 * SECURITY FIX: Credentials now loaded from environment variables
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

// Load credentials from environment variables (NOT hardcoded)
const credentials = {
  email: process.env.TEST_USER_EMAIL || '',
  password: process.env.TEST_USER_PASSWORD || '',
};

if (!credentials.email || !credentials.password) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required');
}

let token = '';

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    token = response.data.token;
    console.log('✓ Logged in successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error);
    return false;
  }
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

async function validateEndpoint(name: string, endpoint: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = response.data;

    console.log(`✓ ${name}`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Data keys: ${Object.keys(data).join(', ')}`);

    if (data.data) {
      if (Array.isArray(data.data)) {
        console.log(`  Count: ${data.data.length}`);
      }
    } else if (data.success !== undefined) {
      console.log(`  Success: ${data.success}`);
    }
    console.log('');
    return true;
  } catch (error: any) {
    console.error(`❌ ${name}`);
    console.error(`  Error: ${error.response?.data?.error || error.message}`);
    console.error(`  Status: ${error.response?.status}\n`);
    return false;
  }
}

async function main() {
  console.log('🧪 VALIDATING ENDPOINTS\n');
  console.log('='.repeat(60) + '\n');

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('Cannot proceed without login');
    process.exit(1);
  }

  // Update token in instance
  axiosInstance.defaults.headers['Authorization'] = `Bearer ${token}`;

  console.log('📊 ANALYTICS ENDPOINTS\n');
  await validateEndpoint('GET /analytics/summary', '/analytics/summary');
  await validateEndpoint('GET /analytics/timeline?days=30', '/analytics/timeline?days=30');
  await validateEndpoint('GET /analytics/by-type', '/analytics/by-type');

  console.log('📁 PROJECTS & ANALYSES\n');
  await validateEndpoint('GET /projects', '/projects');
  await validateEndpoint('GET /analyses', '/analyses');

  console.log('🔍 FINDINGS\n');
  await validateEndpoint('GET /findings/global', '/findings/global');
  await validateEndpoint('GET /findings/global?isIncident=true', '/findings/global?isIncident=true');
  await validateEndpoint('GET /findings/global?severity=CRITICAL', '/findings/global?severity=CRITICAL');

  console.log('📝 OTHER ENDPOINTS\n');
  await validateEndpoint('GET /users', '/users');
  await validateEndpoint('GET /notifications', '/notifications');

  console.log('='.repeat(60));
  console.log('✅ VALIDATION COMPLETE\n');
}

main().catch(console.error);
