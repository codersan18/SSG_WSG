/**
 * Small Express helpers shared by every controller.
 */
const { SsgApiError } = require('../services/ssgClient');
const config = require('../config/env');

/**
 * Wraps a controller so that:
 *   - whatever it returns is sent as { success: true, data }
 *   - any thrown error goes to errorHandler below
 */
const handle = (controllerFn) => async (req, res, next) => {
  try {
    const data = await controllerFn(req, res);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/** Throws a 400 error if any of the named values is empty. Usage: requireFields({ runId, courseReferenceNumber }) */
function requireFields(fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new SsgApiError({ status: 400, message: `Missing required field(s): ${missing.join(', ')}` });
  }
}

/** If GATEWAY_API_KEY is set, every /api request must send it in the "x-api-key" header. */
function requireApiKey(req, res, next) {
  if (!config.gatewayApiKey) return next();
  if (req.get('x-api-key') === config.gatewayApiKey) return next();
  return res.status(401).json({ success: false, message: 'Invalid or missing x-api-key' });
}

/** Unknown routes. */
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** The single place where errors become HTTP responses. */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (error instanceof SsgApiError) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
      api: error.endpointName,
      ssgResponse: error.ssgResponse ?? null,
    });
  }

  // Malformed JSON sent to this gateway
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  }

  console.error('Unexpected error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

module.exports = { handle, requireFields, requireApiKey, notFound, errorHandler };
