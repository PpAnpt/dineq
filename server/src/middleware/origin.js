import { httpError } from '../errors.js';

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function checkOrigin(appOrigin) {
  return (req, _res, next) => {
    const origin = req.get('Origin');
    if (mutatingMethods.has(req.method) && origin !== undefined && origin !== appOrigin) {
      throw httpError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed');
    }
    next();
  };
}
