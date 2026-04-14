const axios = require('axios');

(async () => {
  try {
    const API = 'http://localhost:3001/api/v1';

    // Full workflow test
    console.log('🧪 END-TO-END WORKFLOW TEST\n');
    console.log('='.repeat(60) + '\n');

    // 1. Login
    console.log('1️⃣ AUTHENTICATION');
    const login = await axios.post(API + '/auth/login', {
      email: 'admin@scr.com',
      password: 'admin123'
    });
    const token = login.data.token;
    const user = login.data.user;
    console.log('✅ Logged in as:', user.email);
    console.log('✅ User:', user.name);
    console.log('✅ Role:', user.role);
    console.log('');

    // 2. Get Summary
    console.log('2️⃣ ANALYTICS SUMMARY');
    const summary = await axios.get(API + '/analytics/summary', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const stats = summary.data.data;
    console.log('✅ Total Findings:', stats.totalFindings);
    console.log('✅ Critical Findings:', stats.criticalFindings);
    console.log('✅ High Findings:', stats.highFindings);
    console.log('✅ Remediation Rate:', (stats.remediationRate * 100).toFixed(1) + '%');
    console.log('✅ Analyses:', stats.totalAnalyses);
    console.log('');

    // 3. Get Projects
    console.log('3️⃣ PROJECTS');
    const projects = await axios.get(API + '/projects', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✅ Projects:', projects.data.total);
    console.log('✅ Sample:', projects.data.data[0]?.name);
    console.log('');

    // 4. Get Incidents
    console.log('4️⃣ INCIDENTS');
    const incidents = await axios.get(API + '/findings/global?isIncident=true', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✅ Total Incidents:', incidents.data.total);
    console.log('✅ Page:', incidents.data.page, 'of', Math.ceil(incidents.data.total / incidents.data.limit));
    console.log('✅ Sample Finding:', incidents.data.data[0]?.file);
    console.log('');

    // 5. Get Analytics Timeline
    console.log('5️⃣ ANALYTICS TIMELINE');
    const timeline = await axios.get(API + '/analytics/timeline', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✅ Timeline Data Points:', timeline.data.data.length);
    if (timeline.data.data.length > 0) {
      const first = timeline.data.data[0];
      console.log('✅ CRITICAL:', first.critical, 'HIGH:', first.high, 'MEDIUM:', first.medium, 'LOW:', first.low);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('\n✅ ALL ENDPOINTS WORKING - SYSTEM READY\n');

  } catch (err) {
    console.error('❌ ERROR:', err.response?.data?.error || err.message);
    process.exit(1);
  }
})();
