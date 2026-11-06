import { Router, json } from 'express';
import { requireUuid } from '../services/queues.js';

// F-02 routes. Session and Role guards run earlier in routes/index.js (SDS C.6.3).
export function createQueueRoutes({ queueService }) {
  const router = Router();

  router.get('/queues', async (req, res) => {
    res.json({ data: await queueService.listQueues(req.user) });
  });

  // UUID shape and queue existence are checked before the JSON body is parsed (SDS C.6.3).
  const resolveQueue = async (req, _res, next) => {
    requireUuid(req.params.queueId, 'queueId');
    await queueService.assertQueueExists(req.params.queueId);
    next();
  };

  router.post('/queues/:queueId/entries', resolveQueue, json(), async (req, res) => {
    const queueId = req.params.queueId;
    const partySize = req.body && typeof req.body === 'object' ? req.body.partySize : undefined;
    const ticket = await queueService.join(req.user, queueId, partySize);
    res.status(201).json({ data: ticket });
  });

  router.get('/me/entries', async (req, res) => {
    res.json({ data: await queueService.listMyEntries(req.user) });
  });

  router.get('/entries/:entryId', async (req, res) => {
    const entryId = requireUuid(req.params.entryId, 'entryId');
    res.json({ data: await queueService.getEntry(req.user, entryId) });
  });

  return router;
}
