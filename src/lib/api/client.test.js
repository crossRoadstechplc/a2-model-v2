import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request } from './client.js';

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('normalizes 400 error with error field', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({ success: false, error: 'Invalid email address' }),
    });

    const result = await request('auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid email address');
    expect(result.status).toBe(400);
  });

  it('normalizes 401 error with message field', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          success: false,
          message: 'Authentication required.',
        }),
    });

    const result = await request('auth/me', { method: 'GET', token: 'bad' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Authentication required.');
    expect(result.status).toBe(401);
  });

  it('injects Bearer token in headers when provided', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    });

    await request('auth/me', { method: 'GET', token: 'secret-token' });

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1].headers.Authorization).toBe('Bearer secret-token');
  });

  it('does not add Authorization when token is null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    });

    await request('auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1].headers.Authorization).toBeUndefined();
  });

  it('returns network error on fetch rejection', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network failure'));

    const result = await request('auth/me', { method: 'GET' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Network failure');
  });
});
