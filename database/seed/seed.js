import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import argon2 from 'argon2';
import { seed } from './seedData.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password === 'REPLACE_WITH_A_LOCAL_DEMO_PASSWORD') {
    throw new Error('Set SEED_DEMO_PASSWORD to a local demo password before seeding');
  }
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const client = await pool.connect();
    try { await seed(client, passwordHash); } finally { client.release(); }
    console.log('Seed ready: 30 customers, host1 assigned, host2 unassigned, 1 restaurant and 1 queue.');
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(`Seed failed: ${error.code || 'CONFIGURATION_ERROR'}`);
  if (error.message.endsWith('is required') || error.message.startsWith('Set SEED_DEMO_PASSWORD')) {
    console.error(error.message);
  }
  process.exitCode = 1;
});
