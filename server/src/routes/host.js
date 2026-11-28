import { Router, json } from 'express';
import { requireUuid } from '../services/queues.js';
import { httpError } from '../errors.js';

// F-03 Host routes. Session and Role (HOST) guards run earlier in routes/index.js,
// so UUID validation here comes after them (SDS C.6.3). No request body is read:
// queue / entry / actor identity comes only from the path and the Session.
export function createHostRoutes({ hostService }) {
  const router = Router();

  router.get('/queues/:queueId/entries', async (req, res) => {
    const queueId = requireUuid(req.params.queueId, 'queueId');
    res.json({ data: await hostService.listEntries(req.user, queueId) });
  });

  // F-06 open/close: UUID, queue existence and assignment are checked before the JSON body is
  // parsed (SDS C.6.3); only then is the body validated. Identity comes from the Session.
  const guardQueue = async (req, _res, next) => {
    const queueId = requireUuid(req.params.queueId, 'queueId');
    await hostService.assertQueueAccess(req.user, queueId);
    next();
  };
  router.patch('/queues/:queueId', guardQueue, json(), async (req, res) => {
    const body = req.body;
    const status = body && typeof body === 'object' && !Array.isArray(body) ? body.status : undefined;
    if (status !== 'OPEN' && status !== 'CLOSED') {
      throw httpError(400, 'VALIDATION_ERROR', 'status must be OPEN or CLOSED');
    }
    res.json({ data: await hostService.setQueueStatus(req.user, req.params.queueId, status) });
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
