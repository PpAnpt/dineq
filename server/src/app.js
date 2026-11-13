import express from 'express';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { createRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { loadConfig } from './config.js';

export function createApp({ pool, config = loadConfig() }) {
  if (!pool) throw new Error('createApp requires a database pool');
  const app = express();
  app.disable('x-powered-by');
  app.locals.pool = pool;
  app.use(cookieParser());
  app.use('/api', createRoutes({ pool, config }));
  if (config.nodeEnv === 'production') {
    const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
    // Unknown API routes must retain their JSON response, never return the SPA.
    app.use((req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/')) return next();
      return express.static(clientDist)(req, res, next);
    });
    app.get(['/','/login','/queues','/my-queue','/host/queues/:queueId'], (_req, res) => {
      res.sendFile('index.html', { root: clientDist });
    });
  }
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  });
  app.use(errorHandler);
  return app;
}
