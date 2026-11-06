import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

export async function migrate(pool) {
  const client = await pool.connect();
  const applied = [];
  try {
    await client.query('BEGIN');
    // Serialize migration runners, including the first creation of the ledger.
    await client.query('SELECT pg_advisory_xact_lock(334001)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const directory = new URL('./migrations/', import.meta.url);
    const files = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
    for (const name of files) {
      const existing = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (existing.rowCount) continue;
      await client.query(await readFile(new URL(name, directory), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      applied.push(name);
    }
    await client.query('COMMIT');
    return applied;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--test') || args.length > 1) {
    throw new Error('Usage: node database/migrate.js [--test]');
  }
  const variable = args.includes('--test') ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  if (!process.env[variable]) throw new Error(`${variable} is required`);
  const pool = new pg.Pool({ connectionString: process.env[variable], connectionTimeoutMillis: 5000 });
  try {
    const applied = await migrate(pool);
    console.log(`${variable}: ${applied.length ? `applied ${applied.join(', ')}` : 'already up to date'}`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(`Migration failed: ${error.code || 'CONFIGURATION_ERROR'}`);
    // Only known configuration messages are safe to echo; never print a DB URL.
    if (error.message.endsWith('is required') || error.message.startsWith('Usage:')) {
      console.error(error.message);
    }
    process.exitCode = 1;
  });
}
