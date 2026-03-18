import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BASE_URL } from './config.js';
import { getAccessLogs, getAccessSummary, getActiveSessions, promoteUser } from './admin.js';

const BASE = BASE_URL.replace(/\/$/, '');

describe('admin API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('getAccessLogs', () => {
    it('GET /admin/access-logs with Bearer token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                userId: 1,
                name: 'Alice Smith',
                email: 'alice@example.com',
                sessionId: 's1',
                loginAt: '2025-03-18T12:00:00.000Z',
                logoutAt: null,
                lastActivityAt: '2025-03-18T12:30:00.000Z',
                sessionSeconds: null,
                status: 'active',
              },
            ],
          }),
      });

      const result = await getAccessLogs('token-abc');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/admin/access-logs`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alice Smith');
      expect(result.data[0].email).toBe('alice@example.com');
      expect(result.data[0].status).toBe('active');
    });

    it('passes query params when provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await getAccessLogs('token', { limit: 20, offset: 10, email: 'a@b.com' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('admin/access-logs?'),
        expect.any(Object)
      );
      const url = vi.mocked(fetch).mock.calls[0][0];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(url).toContain('email=a%40b.com');
    });

    it('passes activeOnly, dateFrom, dateTo when provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await getAccessLogs('token', {
        activeOnly: true,
        dateFrom: '2025-03-18T00:00:00.000Z',
        dateTo: '2025-03-18T23:59:59.999Z',
      });

      const url = vi.mocked(fetch).mock.calls[0][0];
      expect(url).toContain('activeOnly=true');
      expect(url).toContain('dateFrom=2025-03-18T00%3A00%3A00.000Z');
      expect(url).toContain('dateTo=2025-03-18T23%3A59%3A59.999Z');
    });

    it('returns error on API failure', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: false, error: 'Forbidden' }),
      });

      const result = await getAccessLogs('token');

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('getAccessSummary', () => {
    it('GET /admin/users/access-summary with Bearer token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              { userId: 1, name: 'Alice', email: 'a@b.com', isAdmin: false, loginCount: 5, totalSessionSeconds: 3600, lastSeenAt: '2025-03-18T12:00:00.000Z' },
            ],
          }),
      });

      const result = await getAccessSummary('token-abc');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/admin/users/access-summary`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].loginCount).toBe(5);
      expect(result.data[0].totalSessionSeconds).toBe(3600);
    });
  });

  describe('getActiveSessions', () => {
    it('GET /admin/active-sessions with Bearer token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              { userId: 1, name: 'Alice', email: 'a@b.com', sessionId: 's1', loginAt: '2025-03-18T12:00:00.000Z', lastActivityAt: '2025-03-18T12:30:00.000Z' },
            ],
          }),
      });

      const result = await getActiveSessions('token-abc');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/admin/active-sessions`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].sessionId).toBe('s1');
    });
  });

  describe('promoteUser', () => {
    it('POST /admin/users/promote with email body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true }),
      });

      const result = await promoteUser('token-abc', 'user@example.com');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/admin/users/promote`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
          headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('sends correct email in body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true }),
      });

      await promoteUser('token', 'admin@example.org');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify({ email: 'admin@example.org' }) })
      );
    });
  });
});
