// Stable synthetic IDs make repeated seeds safe without adding domain uniqueness rules.
export const seedIds = {
  restaurant: '11111111-1111-4111-8111-111111111111',
  queue: '22222222-2222-4222-8222-222222222222',
};

export async function seed(client, passwordHash) {
  if (!passwordHash?.startsWith('$argon2id$')) {
    throw new Error('seed requires an Argon2id password hash');
  }
  const accounts = [
    ...Array.from({ length: 30 }, (_, index) => ({
      email: `customer${String(index + 1).padStart(2, '0')}@dineq.test`, role: 'CUSTOMER',
    })),
    { email: 'host1@dineq.test', role: 'HOST' },
    { email: 'host2@dineq.test', role: 'HOST' },
  ];
  await client.query('BEGIN');
  try {
    for (const account of accounts) {
      await client.query(`INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [account.email, passwordHash, account.role]);
    }
    await client.query(`INSERT INTO restaurants (id, name, status)
      VALUES ($1, 'DineQ Demo Restaurant', 'OPEN') ON CONFLICT (id) DO NOTHING`,
    [seedIds.restaurant]);
    await client.query(`INSERT INTO service_queues (id, restaurant_id, status)
      VALUES ($1, $2, 'OPEN') ON CONFLICT (id) DO NOTHING`,
    [seedIds.queue, seedIds.restaurant]);
    await client.query(`INSERT INTO queue_operator_assignments (queue_id, host_user_id)
      SELECT $1, id FROM users WHERE email = 'host1@dineq.test'
      ON CONFLICT DO NOTHING`, [seedIds.queue]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
