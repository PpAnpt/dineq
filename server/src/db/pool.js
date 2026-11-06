import pg from 'pg';

export function createPool(connectionString, options = {}) {
  if (!connectionString) throw new Error('A database connection string is required');
  return new pg.Pool({ connectionString, connectionTimeoutMillis: 5000, ...options });
}
