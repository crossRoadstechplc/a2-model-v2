/**
 * Admin API client.
 * All functions require Bearer token and admin role.
 * @see API.md § 10 Admin Access Logs
 */

import { request } from './client.js';

/**
 * GET /admin/access-logs
 * Auth: Bearer token + admin role required.
 *
 * @param {string} token
 * @param {{ limit?: number; offset?: number; email?: string; activeOnly?: boolean; dateFrom?: string; dateTo?: string }} [options]
 * @returns {Promise<{ success: true; data: Array<{ userId: number; name: string; email: string; sessionId: string; loginAt: string; logoutAt: string|null; lastActivityAt: string; sessionSeconds: number|null; status: string }> } | { success: false; message: string; status?: number }>}
 */
export async function getAccessLogs(token, options = {}) {
  const params = new URLSearchParams();
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  if (options.email) params.set('email', options.email);
  if (options.activeOnly === true) params.set('activeOnly', 'true');
  if (options.dateFrom) params.set('dateFrom', options.dateFrom);
  if (options.dateTo) params.set('dateTo', options.dateTo);

  const query = params.toString();
  const path = query ? `admin/access-logs?${query}` : 'admin/access-logs';

  const result = await request(path, {
    method: 'GET',
    token,
  });

  if (!result.success) {
    return result;
  }

  const body = result.data;
  const logs = Array.isArray(body?.data) ? body.data : body ?? [];
  return { success: true, data: logs };
}

/**
 * GET /admin/users/access-summary
 * Auth: Bearer token + admin role required.
 *
 * @param {string} token
 * @returns {Promise<{ success: true; data: Array<{ userId: number; name: string; email: string; isAdmin: boolean; loginCount: number; totalSessionSeconds: number; lastSeenAt: string|null }> } | { success: false; message: string; status?: number }>}
 */
export async function getAccessSummary(token) {
  const result = await request('admin/users/access-summary', {
    method: 'GET',
    token,
  });

  if (!result.success) return result;

  const body = result.data;
  const data = Array.isArray(body?.data) ? body.data : body ?? [];
  return { success: true, data };
}

/**
 * GET /admin/active-sessions
 * Auth: Bearer token + admin role required.
 *
 * @param {string} token
 * @returns {Promise<{ success: true; data: Array<{ userId: number; name: string; email: string; sessionId: string; loginAt: string; lastActivityAt: string; ipAddress?: string|null; userAgent?: string|null }> } | { success: false; message: string; status?: number }>}
 */
export async function getActiveSessions(token) {
  const result = await request('admin/active-sessions', {
    method: 'GET',
    token,
  });

  if (!result.success) return result;

  const body = result.data;
  const data = Array.isArray(body?.data) ? body.data : body ?? [];
  return { success: true, data };
}

/**
 * POST /admin/users/promote
 * Auth: Bearer token + admin role required.
 * Promote a user to admin by email.
 *
 * @param {string} token
 * @param {string} email
 * @returns {Promise<{ success: true; data?: object } | { success: false; message: string; status?: number }>}
 */
export async function promoteUser(token, email) {
  const result = await request('admin/users/promote', {
    method: 'POST',
    token,
    body: JSON.stringify({ email }),
  });
  return result;
}
