export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return _next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON' },
    });
  }
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
    ? error.status : 500;
  return res.status(status).json({
    error: {
      code: status < 500 && error.code ? error.code : 'INTERNAL_ERROR',
      message: status < 500 ? error.message : 'An unexpected error occurred',
    },
  });
}
