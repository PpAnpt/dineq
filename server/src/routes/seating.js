import { Router } from 'express';
import { requireUuid } from '../services/queues.js';

// Session and HOST guards precede these UUID/resource checks. No body parsing is needed.
export function createSeatingRoutes({ seatingService }) {
  const router = Router();
  router.get('/queues/:queueId/tables', async (req, res) => {
    const id = requireUuid(req.params.queueId, 'queueId');
    res.json({ data: await seatingService.listTables(req.user, id) });
  });
  router.post('/tables/:tableId/release', async (req, res) => {
    const id = requireUuid(req.params.tableId, 'tableId');
    res.json({ data: await seatingService.releaseTable(req.user, id) });
  });
  return router;
}
