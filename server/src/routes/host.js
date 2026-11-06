import { Router } from 'express';
import { requireUuid } from '../services/queues.js';

// F-03 Host routes. Session and Role (HOST) guards run earlier in routes/index.js,
// so UUID validation here comes after them (SDS C.6.3). No request body is read:
// queue / entry / actor identity comes only from the path and the Session.
export function createHostRoutes({ hostService }) {
  const router = Router();

  router.get('/queues/:queueId/entries', async (req, res) => {
    const queueId = requireUuid(req.params.queueId, 'queueId');
    res.json({ data: await hostService.listEntries(req.user, queueId) });
  });

  router.post('/queues/:queueId/call-next', async (req, res) => {
    const queueId = requireUuid(req.params.queueId, 'queueId');
    res.json({ data: await hostService.callNext(req.user, queueId) });
  });

  router.post('/entries/:entryId/complete', async (req, res) => {
    const entryId = requireUuid(req.params.entryId, 'entryId');
    res.json({ data: await hostService.complete(req.user, entryId) });
  });

  return router;
}
