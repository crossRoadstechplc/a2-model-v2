import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminDashboard } from './useAdminDashboard';

const mockGetAccessSummary = vi.fn();
const mockGetActiveSessions = vi.fn();
const mockToken = vi.fn();

vi.mock('../store/useAuthStore', () => ({
  default: (selector) => selector({ token: mockToken() }),
}));

vi.mock('../lib/api/admin', () => ({
  getAccessSummary: (...args) => mockGetAccessSummary(...args),
  getActiveSessions: (...args) => mockGetActiveSessions(...args),
}));

describe('useAdminDashboard', () => {
  beforeEach(() => {
    mockGetAccessSummary.mockReset();
    mockGetActiveSessions.mockReset();
    mockToken.mockReturnValue('token-123');
  });

  it('fetches summary and active sessions', async () => {
    const summaryData = [
      { userId: 1, name: 'Alice', email: 'a@b.com', loginCount: 10, totalSessionSeconds: 7200, lastSeenAt: null },
    ];
    const activeData = [
      { userId: 1, name: 'Alice', email: 'a@b.com', sessionId: 's1', loginAt: '2025-03-18T12:00:00.000Z', lastActivityAt: '2025-03-18T12:30:00.000Z' },
    ];

    mockGetAccessSummary.mockResolvedValue({ success: true, data: summaryData });
    mockGetActiveSessions.mockResolvedValue({ success: true, data: activeData });

    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toEqual(summaryData);
    expect(result.current.activeSessions).toEqual(activeData);
    expect(result.current.error).toBeNull();
  });

  it('sets error when summary fails', async () => {
    mockGetAccessSummary.mockResolvedValue({ success: false, message: 'Forbidden' });
    mockGetActiveSessions.mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Forbidden');
  });

  it('sets error when active sessions fails', async () => {
    mockGetAccessSummary.mockResolvedValue({ success: true, data: [] });
    mockGetActiveSessions.mockResolvedValue({ success: false, message: 'Server error' });

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
  });

  it('sets error when not authenticated', async () => {
    mockToken.mockReturnValue(null);

    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not authenticated');
    expect(mockGetAccessSummary).not.toHaveBeenCalled();
    expect(mockGetActiveSessions).not.toHaveBeenCalled();
  });
});
