import { Router, json } from 'express';
import { requireUuid } from '../services/queues.js';
import { httpError } from '../errors.js';

// Session and HOST guards precede these UUID/resource checks. No body parsing is needed.
export function createSeatingRoutes({ seatingService }) {
  const router = Router();
  router.post('/entries/:entryId/no-show', async (req, res) => {
    const id = requireUuid(req.params.entryId, 'entryId');
    res.json({ data: await seatingService.noShow(req.user, id) });
  });
  const resolveEntry = async (req, _res, next) => {
    requireUuid(req.params.entryId, 'entryId');
    await seatingService.assertEntryAccess(req.user, req.params.entryId);
    next();
  };
  router.post('/entries/:entryId/seat', resolveEntry, json(), async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw httpError(400, 'VALIDATION_ERROR', 'Seat requires a JSON object with tableId');
    }
    const tableId = requireUuid(req.body.tableId, 'tableId');
    res.json({ data: await seatingService.seat(req.user, req.params.entryId, tableId) });
  });
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
