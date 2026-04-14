import { Client } from 'pg';

async function listDbs() {
  const client = new Client({
    user: 'pablosalas',
    host: 'localhost',
    database: 'postgres',
    port: 5432,
  });
  
  try {
    await client.connect();
    const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    console.log('Databases found:', res.rows.map(r => r.datname).join(', '));
  } catch (err) {
    console.error('Error connecting to postgres:', err);
  } finally {
    await client.end();
  }
}

listDbs();
