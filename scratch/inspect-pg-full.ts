import { Client } from 'pg';

async function inspect() {
  const client = new Client({
    connectionString: 'postgresql://pablosalas@localhost:5432/scr_agent'
  });
  
  try {
    await client.connect();
    console.log('Connected to scr_agent');
    
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata;");
    console.log('Schemas:', schemas.rows.map(r => r.schema_name).join(', '));
    
    const tables = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog');");
    console.log('Tables found:');
    for (const row of tables.rows) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_schema}"."${row.table_name}";`);
      console.log(`  - ${row.table_schema}.${row.table_name}: ${countRes.rows[0].count} records`);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

inspect();
