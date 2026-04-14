/**
 * VALIDATE DATA CONSISTENCY
 *
 * This script validates that the data in the database is consistent
 * and matches the expected counts and relationships.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials
const credentials = {
  email: 'admin@scr.com',
  password: 'admin123',
};

let token = '';

async function login() {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  token = response.data.token;
}

async function getAnalyticsSummary() {
  const response = await axios.get(`${API_BASE_URL}/analytics/summary`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.data.data;
}

async function getFindings(isIncident?: boolean) {
  const url = isIncident
    ? `${API_BASE_URL}/findings/global?isIncident=true`
    : `${API_BASE_URL}/findings/global?limit=1000`;

  const response = await axios.get(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.data;
}

async function main() {
  console.log('🔍 VALIDATING DATA CONSISTENCY\n');
  console.log('='.repeat(60) + '\n');

  await login();

  // Get analytics summary
  const summary = await getAnalyticsSummary();
  console.log('📊 Analytics Summary:');
  console.log(`  Total Findings: ${summary.totalFindings}`);
  console.log(`  CRITICAL: ${summary.criticalFindings}`);
  console.log(`  HIGH: ${summary.highFindings}`);
  console.log(`  MEDIUM: ${summary.mediumFindings}`);
  console.log(`  LOW: ${summary.lowFindings}`);
  console.log(`  Avg Resolution Time: ${(summary.averageResolutionTime / 1000 / 60).toFixed(0)}min`);
  console.log(`  Remediation Rate: ${(summary.remediationRate * 100).toFixed(1)}%`);
  console.log(`  Total Analyses: ${summary.totalAnalyses}\n`);

  // Get all findings
  const allFindings = await getFindings(false);
  console.log('📝 All Findings:');
  console.log(`  Total (from API): ${allFindings.total}`);
  console.log(`  Returned: ${allFindings.data.length}`);
  console.log(`  Page: ${allFindings.page}/${Math.ceil(allFindings.total / allFindings.limit)}`);

  // Count by severity
  const bySeverity = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const finding of allFindings.data) {
    bySeverity[finding.severity as keyof typeof bySeverity]++;
  }

  console.log(`  Distribution: C=${bySeverity.CRITICAL}, H=${bySeverity.HIGH}, M=${bySeverity.MEDIUM}, L=${bySeverity.LOW}\n`);

  // Get incidents
  const incidents = await getFindings(true);
  console.log('🚨 Incidents (CRITICAL OR HIGH OR assigned):');
  console.log(`  Total: ${incidents.total}`);
  console.log(`  Returned: ${incidents.data.length}\n`);

  // Verify consistency
  console.log('✅ CONSISTENCY CHECKS:\n');

  const checks = [
    {
      name: 'Findings match analytics.totalFindings',
      pass: summary.totalFindings === allFindings.total,
      actual: `${summary.totalFindings} vs ${allFindings.total}`,
    },
    {
      name: 'Incidents are subset of findings',
      pass: incidents.total <= allFindings.total,
      actual: `${incidents.total} <= ${allFindings.total}`,
    },
    {
      name: 'Remediation rate is > 0 (has data)',
      pass: summary.remediationRate > 0,
      actual: `${(summary.remediationRate * 100).toFixed(1)}%`,
    },
    {
      name: 'Avg resolution time is > 0 (has data)',
      pass: summary.averageResolutionTime > 0,
      actual: `${Math.round(summary.averageResolutionTime / 1000 / 60)} min`,
    },
    {
      name: 'Severity sum matches total',
      pass: (bySeverity.CRITICAL + bySeverity.HIGH + bySeverity.MEDIUM + bySeverity.LOW) === allFindings.data.length,
      actual: `${bySeverity.CRITICAL + bySeverity.HIGH + bySeverity.MEDIUM + bySeverity.LOW} vs ${allFindings.data.length}`,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    if (check.pass) {
      console.log(`✓ ${check.name}`);
      console.log(`  ${check.actual}\n`);
      passed++;
    } else {
      console.log(`✗ ${check.name}`);
      console.log(`  ${check.actual}\n`);
      failed++;
    }
  }

  console.log('='.repeat(60));
  console.log(`\n📊 Results: ${passed}/${checks.length} checks passed\n`);

  if (failed === 0) {
    console.log('✅ ALL CONSISTENCY CHECKS PASSED!\n');
  } else {
    console.log(`❌ ${failed} checks FAILED - investigate data inconsistencies\n`);
  }
}

main().catch(console.error);
