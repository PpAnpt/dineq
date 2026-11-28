// Stable synthetic IDs make repeated seeds safe without adding domain uniqueness rules.
export const seedIds = {
  restaurant: '11111111-1111-4111-8111-111111111111',
  queue: '22222222-2222-4222-8222-222222222222',
  barQueue: '33333333-3333-4333-8333-333333333333',
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
    { email: 'host3@dineq.test', role: 'HOST' },
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
    // Lab 7 (L7-CR-01): the main demo queue takes parties up to 10. Only this column is updated on
    // conflict, so re-running the seed never touches status, ticket counter or tickets.
    // F-06: the main queue is named 'Main queue' (the migration backfill reserves that name for this id).
    await client.query(`INSERT INTO service_queues (id, restaurant_id, status, max_party_size, name)
      VALUES ($1, $2, 'OPEN', 10, 'Main queue')
      ON CONFLICT (id) DO UPDATE SET max_party_size = EXCLUDED.max_party_size, name = EXCLUDED.name`,
    [seedIds.queue, seedIds.restaurant]);
    // F-06: a second queue in the same restaurant; status and counter are never reset on conflict.
    await client.query(`INSERT INTO service_queues (id, restaurant_id, status, name)
      VALUES ($1, $2, 'OPEN', 'Bar counter') ON CONFLICT (id) DO NOTHING`,
    [seedIds.barQueue, seedIds.restaurant]);
    await client.query(`INSERT INTO queue_operator_assignments (queue_id, host_user_id)
      SELECT $1, id FROM users WHERE email = 'host1@dineq.test'
      ON CONFLICT DO NOTHING`, [seedIds.queue]);
    await client.query(`INSERT INTO queue_operator_assignments (queue_id, host_user_id)
      SELECT $1, id FROM users WHERE email = 'host3@dineq.test'
      ON CONFLICT DO NOTHING`, [seedIds.barQueue]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
