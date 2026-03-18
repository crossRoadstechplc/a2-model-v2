import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BASE_URL } from './config.js';
import {
  requestOtp,
  verifyOtp,
  getCurrentUser,
  acceptNda,
  completeWalkthrough,
  heartbeat,
  logout,
} from './auth.js';

const BASE = BASE_URL.replace(/\/$/, '');

describe('auth API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('requestOtp', () => {
    it('POST /auth/request-otp with correct payload', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, message: 'OTP sent' }),
      });

      const result = await requestOtp({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        companyName: 'Acme Inc',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/auth/request-otp`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'alice@example.com',
            companyName: 'Acme Inc',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('OTP sent');
    });
  });

  describe('verifyOtp', () => {
    it('POST /auth/verify-otp with email and otp', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            success: true,
            token: 'abc123',
            user: { id: 1, email: 'a@b.com' },
            ndaAccepted: false,
            walkthroughSeen: false,
          }),
      });

      const result = await verifyOtp({
        email: 'alice@example.com',
        otp: '123456',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/auth/verify-otp`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'alice@example.com', otp: '123456' }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.token).toBe('abc123');
    });
  });

  describe('getCurrentUser', () => {
    it('GET /auth/me with Bearer token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            id: 1,
            name: 'Alice Smith',
            email: 'alice@example.com',
            ndaAccepted: true,
            walkthroughSeen: false,
          }),
      });

      const result = await getCurrentUser('my-token-xyz');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/auth/me`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token-xyz',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('alice@example.com');
    });
  });

  describe('acceptNda', () => {
    it('POST /auth/accept-nda with token and ndaVersion', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            id: 1,
            ndaAccepted: true,
            ndaVersion: '1.0',
          }),
      });

      const result = await acceptNda('token', { ndaVersion: '1.0' });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/auth/accept-nda`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
          body: JSON.stringify({ ndaVersion: '1.0' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('completeWalkthrough', () => {
    it('POST /auth/complete-walkthrough with token, no body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            id: 1,
            walkthroughSeen: true,
          }),
      });

      const result = await completeWalkthrough('token');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/auth/complete-walkthrough`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
      const call = vi.mocked(fetch).mock.calls[0][1];
      expect(call.body).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });

  describe('heartbeat', () => {
    it('POST /auth/heartbeat with token, no body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            id: 1,
            lastSeenAt: '2025-03-18T12:30:00.000Z',
          }),
      });

      const result = await heartbeat('token');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/auth/heartbeat`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
      const call = vi.mocked(fetch).mock.calls[0][1];
      expect(call.body).toBeUndefined();
      expect(result.success).toBe(true);
      expect(result.data.lastSeenAt).toBe('2025-03-18T12:30:00.000Z');
    });
  });

  describe('logout', () => {
    it('POST /auth/logout with token, no body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({ success: true, message: 'Logged out successfully.' }),
      });

      const result = await logout('token');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/auth/logout`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
      const call = vi.mocked(fetch).mock.calls[0][1];
      expect(call.body).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });
});
