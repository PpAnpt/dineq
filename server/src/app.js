import express from 'express';
import cookieParser from 'cookie-parser';
import { createRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp({ pool }) {
  if (!pool) throw new Error('createApp requires a database pool');
  const app = express();
  app.disable('x-powered-by');
  app.locals.pool = pool;
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', createRoutes());
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  });
  app.use(errorHandler);
  return app;
}
