import { Router } from 'express';

export function createRoutes() {
  const router = Router();
  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  return router;
}
