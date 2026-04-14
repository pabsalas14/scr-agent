import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../packages/backend/.env') });

import { prisma } from '../packages/backend/src/services/prisma.service';
import { decrypt } from '../packages/backend/src/services/crypto.service';
import axios from 'axios';

async function debug() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('Total users found:', users.length);
  
  for (const user of users) {
    console.log(`Checking user: ${user.email} (${user.id})`);
    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    
    if (!settings?.githubToken) {
      console.log('  -> No GitHub token found');
      continue;
    }
    
    const token = decrypt(settings.githubToken);
    console.log(`  -> Token found (length: ${token.length})`);
    
    try {
      const resp = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `token ${token}` },
        params: { per_page: 1 }
      });
      console.log('  -> GitHub API success! Repos found:', resp.data.length);
    } catch (err: any) {
      console.log('  -> GitHub API failure:', err.response?.status, err.response?.data?.message || err.message);
    }
  }
}

debug().catch(console.error);
