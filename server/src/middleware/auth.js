import { httpError } from '../errors.js';

export const SESSION_COOKIE = 'dineq_session';

export function authenticate(authService) {
  return async (req, _res, next) => {
    // Match the router's case-insensitive, non-strict static paths, but only
    // exempt the documented public methods (GET /auth/login is protected).
    const path = req.path.toLowerCase().replace(/\/+$/, '') || '/';
    if ((['GET', 'HEAD'].includes(req.method) && path === '/health')
      || (req.method === 'POST' && path === '/auth/login')) return next();

    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
      throw httpError(401, 'UNAUTHENTICATED', 'Authentication is required');
    }
    const session = await authService.findSession(token);
    if (!session) throw httpError(401, 'UNAUTHENTICATED', 'Authentication is required');
    req.user = session.user;
    req.session = { id: session.id };
    next();
  };
}

export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user) throw httpError(401, 'UNAUTHENTICATED', 'Authentication is required');
    if (req.user.role !== role) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
    next();
  };
}
