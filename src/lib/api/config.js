/**
 * API client configuration.
 * Base URL and auth header helpers for the A2 Simulator Gateway.
 *
 * In dev: uses /api proxy (Vite → a2.ankuaru.com) to avoid CORS.
 * In prod: uses VITE_API_BASE_URL or https://a2.ankuaru.com.
 */

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3049'
  // 'https://a2.ankuaru.com'

/**
 * Returns the Authorization header value for Bearer token.
 * @param {string | null} token
 * @returns {{ Authorization: string } | {}}
 */
export function getAuthHeader(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
