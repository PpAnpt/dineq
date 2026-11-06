import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';

const config = loadConfig();
const pool = createPool(config.databaseUrl);
// Check connectivity before listening; never print connection strings.
await pool.query('SELECT 1');
const server = createApp({ pool }).listen(config.port, () => {
  console.log(`DineQ API listening on port ${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
}
