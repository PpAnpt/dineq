import { Router } from 'express';
import { httpError } from '../errors.js';
import { SESSION_COOKIE } from '../middleware/auth.js';

export function createAuthRoutes({ authService, config }) {
  const router = Router();
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/' };

  router.post('/login', async (req, res) => {
    const body = req.body;
    if (!body || Array.isArray(body) || typeof body.email !== 'string' || !body.email.trim()
      || typeof body.password !== 'string' || !body.password) {
      throw httpError(400, 'VALIDATION_ERROR', 'Email and password must be non-empty strings');
    }
    const { user, token } = await authService.login(body.email.trim(), body.password);
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: config.sessionTtlSeconds * 1000 });
    res.json({ data: user });
  });

  router.post('/logout', async (req, res) => {
    await authService.revokeSession(req.session.id);
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(204).end();
  });

  router.get('/me', (req, res) => res.json({ data: req.user }));
  return router;
}
