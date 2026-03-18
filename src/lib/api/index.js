/**
 * API client layer.
 * @see API.md
 */

export { BASE_URL, getAuthHeader } from './config.js';
export { normalizeApiError } from './errors.js';
export {
  requestOtp,
  verifyOtp,
  getCurrentUser,
  acceptNda,
  completeWalkthrough,
  logout,
} from './auth.js';
