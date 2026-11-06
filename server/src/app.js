import express from 'express';
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
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  });
  app.use(errorHandler);
  return app;
}
