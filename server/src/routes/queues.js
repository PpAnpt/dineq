import { Router, json } from 'express';
import { parseHistoryFilters, requireUuid } from '../services/queues.js';

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

  // F-04: owner cancels a WAITING ticket. No request body is read; identity and ownership
  // come from the Session, and the Customer-only guard runs earlier in routes/index.js.
  router.post('/entries/:entryId/cancel', async (req, res) => {
    const entryId = requireUuid(req.params.entryId, 'entryId');
    res.json({ data: await queueService.cancel(req.user, entryId) });
  });

  router.get('/me/entries', async (req, res) => {
    // The Customer-only guard already ran; filters are validated before any query (F-07a).
    res.json({ data: await queueService.listMyEntries(req.user, parseHistoryFilters(req.query)) });
  });

  router.get('/entries/:entryId', async (req, res) => {
    const entryId = requireUuid(req.params.entryId, 'entryId');
    res.json({ data: await queueService.getEntry(req.user, entryId) });
  });

  return router;
}
