/**
 * API error normalization.
 * Converts backend error responses into a predictable frontend shape.
 *
 * API doc: success: false, error?: string, message?: string, stack?: (dev only)
 */

/**
 * Normalized API error shape for the frontend.
 * @typedef {{ success: false; message: string; status?: number }} ApiError
 */

/**
 * Normalizes API error responses into a consistent shape.
 * Prefers `error` over `message` when both exist (per API doc conventions).
 *
 * @param {Response} response - Fetch response
 * @param {object} [body] - Parsed JSON body (may have error, message, success)
 * @returns {ApiError}
 */
export function normalizeApiError(response, body = {}) {
  const status = response.status;
  const msg =
    body.error ??
    body.message ??
    (response.statusText || `Request failed (${status})`);
  return {
    success: false,
    message: String(msg),
    status,
  };
}
