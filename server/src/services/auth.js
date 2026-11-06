import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { httpError } from '../errors.js';

let dummyHashPromise;

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role };
}

export function createAuthService({ pool, sessionTtlSeconds }) {
  return {
    async login(email, password) {
      const { rows } = await pool.query(`SELECT id, email, role, password_hash, is_active
        FROM users WHERE email = $1`, [email]);
      const user = rows[0];
      // Unknown accounts still perform password verification and return the same error.
      if (!user) dummyHashPromise ??= argon2.hash(randomBytes(32), { type: argon2.argon2id });
      const hash = user ? user.password_hash : await dummyHashPromise;
      const validPassword = await argon2.verify(hash, password);
      if (!user || !user.is_active || !validPassword) {
        throw httpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
      }
      const token = randomBytes(32).toString('hex');
      await pool.query(`INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES ($1, $2, clock_timestamp() + ($3::integer * interval '1 second'))`,
      [user.id, hashSessionToken(token), sessionTtlSeconds]);
      return { user: publicUser(user), token };
    },

    async findSession(token) {
      const { rows } = await pool.query(`SELECT s.id AS session_id, u.id, u.email, u.role
        FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.revoked_at IS NULL
          AND s.expires_at > clock_timestamp() AND u.is_active = true`, [hashSessionToken(token)]);
      if (!rows[0]) return null;
      return { id: rows[0].session_id, user: publicUser(rows[0]) };
    },

    async revokeSession(sessionId) {
      await pool.query(`UPDATE sessions SET revoked_at = clock_timestamp()
        WHERE id = $1 AND revoked_at IS NULL`, [sessionId]);
    },
  };
}
