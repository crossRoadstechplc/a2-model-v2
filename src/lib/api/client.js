/**
 * Low-level API client.
 * Handles fetch, JSON, auth headers, and error normalization.
 *
 * @see API.md
 */

import { BASE_URL, getAuthHeader } from './config.js';
import { normalizeApiError } from './errors.js';

/**
 * Performs a JSON request with optional Bearer token.
 *
 * @param {string} path - Path (e.g. '/auth/me')
 * @param {RequestInit & { token?: string | null }} options
 * @returns {Promise<{ success: true; data: unknown } | { success: false; message: string; status?: number }>}
 */
export async function request(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const url = `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(token ?? null),
    ...(fetchOptions.headers ?? {}),
  };

  if (import.meta.env.DEV && path.includes('request-otp')) {
    console.debug('[API] request-otp', { url, body: fetchOptions.body });
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: { ...headers, ...fetchOptions.headers },
    });
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const body = isJson ? await response.json().catch(() => ({})) : {};

    if (!response.ok) {
      if (import.meta.env.DEV && path.includes('request-otp')) {
        console.debug('[API] request-otp failed', { status: response.status, body });
      }
      return normalizeApiError(response, body);
    }

    if (import.meta.env.DEV && path.includes('request-otp')) {
      console.debug('[API] request-otp success', { status: response.status, body });
    }
    return { success: true, data: body };
  } catch (err) {
    if (import.meta.env.DEV && path.includes('request-otp')) {
      console.debug('[API] request-otp error', err);
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error',
      status: undefined,
    };
  }
}
