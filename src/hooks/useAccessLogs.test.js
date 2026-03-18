import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAccessLogs } from './useAccessLogs';

const mockGetAccessLogs = vi.fn();
const mockToken = vi.fn();

vi.mock('../store/useAuthStore', () => ({
  default: (selector) => selector({ token: mockToken() }),
}));

vi.mock('../lib/api/admin', () => ({
  getAccessLogs: (...args) => mockGetAccessLogs(...args),
}));

describe('useAccessLogs', () => {
  beforeEach(() => {
    mockGetAccessLogs.mockReset();
    mockToken.mockReturnValue('token-123');
  });

  it('fetches and returns access logs', async () => {
    const logs = [
      {
        userId: 1,
        name: 'Alice',
        email: 'alice@example.com',
        sessionId: 's1',
        loginAt: '2025-03-18T12:00:00.000Z',
        logoutAt: null,
        lastActivityAt: '2025-03-18T12:30:00.000Z',
        sessionSeconds: null,
        status: 'active',
      },
    ];
    mockGetAccessLogs.mockResolvedValue({ success: true, data: logs });

    const { result } = renderHook(() => useAccessLogs());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.logs).toEqual(logs);
    expect(result.current.error).toBeNull();
    expect(mockGetAccessLogs).toHaveBeenCalledWith('token-123', {});
  });

  it('sets error on API failure', async () => {
    mockGetAccessLogs.mockResolvedValue({ success: false, message: 'Forbidden' });

    const { result } = renderHook(() => useAccessLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Forbidden');
    expect(result.current.logs).toEqual([]);
  });

  it('sets error when not authenticated', async () => {
    mockToken.mockReturnValue(null);

    const { result } = renderHook(() => useAccessLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not authenticated');
    expect(mockGetAccessLogs).not.toHaveBeenCalled();
  });

  it('passes filter options to API', async () => {
    mockGetAccessLogs.mockResolvedValue({ success: true, data: [] });

    renderHook(() =>
      useAccessLogs({
        email: 'a@b.com',
        activeOnly: true,
        dateFrom: '2025-03-18T00:00:00.000Z',
        dateTo: '2025-03-18T23:59:59.999Z',
        limit: 100,
        offset: 50,
      })
    );

    await waitFor(() => {
      expect(mockGetAccessLogs).toHaveBeenCalledWith('token-123', {
        email: 'a@b.com',
        activeOnly: true,
        dateFrom: '2025-03-18T00:00:00.000Z',
        dateTo: '2025-03-18T23:59:59.999Z',
        limit: 100,
        offset: 50,
      });
    });
  });
});
