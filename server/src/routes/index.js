import { Router, json } from 'express';
import { createAuthService } from '../services/auth.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { checkOrigin } from '../middleware/origin.js';
import { createAuthRoutes } from './auth.js';

export function createRoutes({ pool, config }) {
  const router = Router();
  const authService = createAuthService({ pool, sessionTtlSeconds: config.sessionTtlSeconds });
  router.use(checkOrigin(config.appOrigin));
  router.use(authenticate(authService));

  // Role checks must also run before JSON parsing (SDS C.6.3).
  const hostOnlyRoutes = [
    ['get', '/queues/:queueId/entries'],
    ['post', '/queues/:queueId/call-next'],
    ['post', '/entries/:entryId/complete'],
  ];
  for (const [method, path] of hostOnlyRoutes) router[method](path, requireRole('HOST'));

  router.use(json());
  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  router.use('/auth', createAuthRoutes({ authService, config }));
  // F-03 replaces these handlers; P3 only establishes authentication and role guards.
  for (const [method, path] of hostOnlyRoutes) {
    router[method](path, (_req, res) => res.status(501).json({
      error: { code: 'NOT_IMPLEMENTED', message: 'Host queue operation is not implemented yet' },
    }));
  }
  return router;
}
