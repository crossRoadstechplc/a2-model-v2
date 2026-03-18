/**
 * Auth API client.
 * All functions match the API doc at project root (API.md).
 *
 * Auth: Bearer token via Authorization header.
 * Base URL: VITE_API_BASE_URL env (default http://localhost:3000)
 */

import { request } from './client.js';

/**
 * POST /auth/request-otp
 * No auth. Rate limited.
 *
 * @param {{ firstName: string; lastName: string; email: string; companyName: string }} payload
 * @returns {Promise<{ success: true; data: { success: boolean; message: string } } | { success: false; message: string; status?: number }>}
 */
export async function requestOtp(payload) {
  const result = await request('auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      companyName: payload.companyName,
    }),
  });
  return result;
}

/**
 * POST /auth/verify-otp
 * No auth. Returns token, user, ndaAccepted, walkthroughSeen.
 *
 * @param {{ email: string; otp: string }} payload
 * @returns {Promise<{ success: true; data: { success: boolean; token: string; user: object; ndaAccepted: boolean; walkthroughSeen: boolean } } | { success: false; message: string; status?: number }>}
 */
export async function verifyOtp(payload) {
  const result = await request('auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      otp: payload.otp,
    }),
  });
  return result;
}

/**
 * GET /auth/me
 * Auth: Bearer token required.
 *
 * @param {string} token
 * @returns {Promise<{ success: true; data: { id: number; name: string; firstName: string; lastName: string; email: string; companyName: string; ndaAccepted: boolean; ndaAcceptedAt: string|null; ndaVersion: string|null; walkthroughSeen: boolean; walkthroughSeenAt: string|null } } | { success: false; message: string; status?: number }>}
 */
export async function getCurrentUser(token) {
  const result = await request('auth/me', {
    method: 'GET',
    token,
  });
  return result;
}

/**
 * POST /auth/accept-nda
 * Auth: Bearer token required.
 * Response: same shape as GET /auth/me with updated NDA fields.
 *
 * @param {string} token
 * @param {{ ndaVersion: string }} payload
 * @returns {Promise<{ success: true; data: { id: number; name: string; firstName: string; lastName: string; email: string; companyName: string; ndaAccepted: boolean; ndaAcceptedAt: string|null; ndaVersion: string|null; walkthroughSeen: boolean; walkthroughSeenAt: string|null } } | { success: false; message: string; status?: number }>}
 */
export async function acceptNda(token, payload) {
  const result = await request('auth/accept-nda', {
    method: 'POST',
    token,
    body: JSON.stringify({ ndaVersion: payload.ndaVersion }),
  });
  return result;
}

/**
 * POST /auth/complete-walkthrough
 * Auth: Bearer token required.
 * No body. Response: same shape as GET /auth/me with updated walkthrough fields.
 *
 * @param {string} token
 * @returns {Promise<{ success: true; data: { id: number; name: string; firstName: string; lastName: string; email: string; companyName: string; ndaAccepted: boolean; ndaAcceptedAt: string|null; ndaVersion: string|null; walkthroughSeen: boolean; walkthroughSeenAt: string|null } } | { success: false; message: string; status?: number }>}
 */
export async function completeWalkthrough(token) {
  const result = await request('auth/complete-walkthrough', {
    method: 'POST',
    token,
  });
  return result;
}

/**
 * POST /auth/heartbeat
 * Auth: Bearer token required.
 * No body. Used for access analytics; response typically same shape as GET /auth/me
 * (may include updated lastSeenAt).
 *
 * @param {string} token
 * @returns {Promise<{ success: true; data: object } | { success: false; message: string; status?: number }>}
 */
export async function heartbeat(token) {
  const result = await request('auth/heartbeat', {
    method: 'POST',
    token,
  });
  return result;
}

/**
 * POST /auth/logout
 * Auth: Bearer token required.
 * No body. Revokes session.
 *
 * @param {string} token
 * @returns {Promise<{ success: true; data: { success: boolean; message: string } } | { success: false; message: string; status?: number }>}
 */
export async function logout(token) {
  const result = await request('auth/logout', {
    method: 'POST',
    token,
  });
  return result;
}
