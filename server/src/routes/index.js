import { Router, json } from 'express';
import { createAuthService } from '../services/auth.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { checkOrigin } from '../middleware/origin.js';
import { createAuthRoutes } from './auth.js';
import { createQueueRoutes } from './queues.js';
import { createQueueService } from '../services/queues.js';
import { createHostRoutes } from './host.js';
import { createHostService } from '../services/host.js';
import { createSeatingService } from '../services/seating.js';
import { createSeatingRoutes } from './seating.js';

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
    ['get', '/queues/:queueId/tables'],
    ['post', '/tables/:tableId/release'],
    ['post', '/entries/:entryId/no-show'],
    ['post', '/entries/:entryId/seat'],
    ['patch', '/queues/:queueId'],
  ];
  for (const [method, path] of hostOnlyRoutes) router[method](path, requireRole('HOST'));
  // F-02 Customer-only endpoints (Host gets 403 before UUID/body checks).
  router.post('/queues/:queueId/entries', requireRole('CUSTOMER'));
  router.get('/me/entries', requireRole('CUSTOMER'));
  // F-04: only Customers cancel (Host gets 403 before UUID/resource checks).
  router.post('/entries/:entryId/cancel', requireRole('CUSTOMER'));

  // No global body parser: a route that must check its resource before the body
  // (SDS C.6.3 steps 4-5) parses JSON itself; /auth parses it here.
  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  // Readiness for Cloud Run/CI smoke tests: public, read-only, never leaks DB errors.
  router.get('/ready', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ data: { status: 'ready', db: 'connected' } });
    } catch {
      res.status(503).json({ error: { code: 'NOT_READY', message: 'Database is not reachable' } });
    }
  });
  router.use('/auth', json(), createAuthRoutes({ authService, config }));
  router.use(createQueueRoutes({ queueService: createQueueService({ pool }) }));
  router.use(createHostRoutes({ hostService: createHostService({ pool }) }));
  router.use(createSeatingRoutes({ seatingService: createSeatingService({ pool }) }));
  return router;
}
