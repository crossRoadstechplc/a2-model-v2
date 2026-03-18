import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from './useAuthStore.js';
import * as authApi from '../lib/api/auth.js';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.spyOn(authApi, 'requestOtp');
    vi.spyOn(authApi, 'verifyOtp');
    vi.spyOn(authApi, 'getCurrentUser');
    vi.spyOn(authApi, 'acceptNda');
    vi.spyOn(authApi, 'completeWalkthrough');
    vi.spyOn(authApi, 'heartbeat');
    vi.spyOn(authApi, 'logout');
  });

  it('initializes cleanly', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.ndaAccepted).toBe(false);
    expect(state.walkthroughSeen).toBe(false);
    expect(state.isAdmin).toBe(false);
    expect(state.lastSeenAt).toBeNull();
    expect(state.authError).toBeNull();
    expect(state.isCheckingSession).toBe(false);
    expect(state.requestOtpLoading).toBe(false);
    expect(state.verifyOtpLoading).toBe(false);
    expect(state.acceptNdaLoading).toBe(false);
    expect(state.completeWalkthroughLoading).toBe(false);
    expect(state.logoutLoading).toBe(false);
  });

  describe('requestOtp', () => {
    it('updates loading and error state correctly', async () => {
      vi.mocked(authApi.requestOtp).mockResolvedValueOnce({
        success: false,
        message: 'Invalid email',
      });

      const result = await useAuthStore.getState().requestOtp({
        firstName: 'A',
        lastName: 'B',
        email: 'bad',
        companyName: 'C',
      });

      expect(vi.mocked(authApi.requestOtp)).toHaveBeenCalledWith({
        firstName: 'A',
        lastName: 'B',
        email: 'bad',
        companyName: 'C',
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email');
      expect(useAuthStore.getState().authError).toBe('Invalid email');
      expect(useAuthStore.getState().requestOtpLoading).toBe(false);
    });

    it('clears error on success', async () => {
      vi.mocked(authApi.requestOtp).mockResolvedValueOnce({
        success: true,
        data: { message: 'OTP sent' },
      });

      const result = await useAuthStore.getState().requestOtp({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        companyName: 'C',
      });

      expect(result.success).toBe(true);
      expect(useAuthStore.getState().authError).toBeNull();
    });
  });

  describe('verifyOtp', () => {
    it('stores session and user state correctly on success', async () => {
      vi.mocked(authApi.verifyOtp).mockResolvedValueOnce({
        success: true,
        data: {
          token: 'abc123',
          user: { id: 1, email: 'a@b.com', firstName: 'Alice' },
          ndaAccepted: true,
          walkthroughSeen: false,
        },
      });

      const result = await useAuthStore.getState().verifyOtp({
        email: 'a@b.com',
        otp: '123456',
      });

      expect(result.success).toBe(true);
      const state = useAuthStore.getState();
      expect(state.token).toBe('abc123');
      expect(state.user.email).toBe('a@b.com');
      expect(state.ndaAccepted).toBe(true);
      expect(state.walkthroughSeen).toBe(false);
      expect(state.authError).toBeNull();
    });

    it('sets authError on failure', async () => {
      vi.mocked(authApi.verifyOtp).mockResolvedValueOnce({
        success: false,
        message: 'Invalid or expired verification code.',
      });

      const result = await useAuthStore.getState().verifyOtp({
        email: 'a@b.com',
        otp: '000000',
      });

      expect(result.success).toBe(false);
      expect(useAuthStore.getState().authError).toBe(
        'Invalid or expired verification code.'
      );
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('maps isAdmin from backend user when present', async () => {
      vi.mocked(authApi.verifyOtp).mockResolvedValueOnce({
        success: true,
        data: {
          token: 'abc',
          user: { id: 1, email: 'admin@b.com', isAdmin: true },
          ndaAccepted: true,
          walkthroughSeen: false,
        },
      });

      await useAuthStore.getState().verifyOtp({
        email: 'admin@b.com',
        otp: '123456',
      });

      expect(useAuthStore.getState().isAdmin).toBe(true);
    });

    it('maps isAdmin from user.role when role is admin', async () => {
      vi.mocked(authApi.verifyOtp).mockResolvedValueOnce({
        success: true,
        data: {
          token: 'abc',
          user: { id: 1, email: 'admin@b.com', role: 'admin' },
          ndaAccepted: true,
          walkthroughSeen: false,
        },
      });

      await useAuthStore.getState().verifyOtp({
        email: 'admin@b.com',
        otp: '123456',
      });

      expect(useAuthStore.getState().isAdmin).toBe(true);
    });

    it('maps lastSeenAt from backend user when present', async () => {
      vi.mocked(authApi.verifyOtp).mockResolvedValueOnce({
        success: true,
        data: {
          token: 'abc',
          user: { id: 1, email: 'a@b.com', lastSeenAt: '2025-03-18T12:00:00.000Z' },
          ndaAccepted: true,
          walkthroughSeen: false,
        },
      });

      await useAuthStore.getState().verifyOtp({
        email: 'a@b.com',
        otp: '123456',
      });

      expect(useAuthStore.getState().lastSeenAt).toBe('2025-03-18T12:00:00.000Z');
    });
  });

  describe('hydrateSession', () => {
    it('handles valid session – fetches user and updates state', async () => {
      useAuthStore.setState({ token: 'stored-token' });
      vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce({
        success: true,
        data: {
          id: 1,
          email: 'a@b.com',
          ndaAccepted: true,
          walkthroughSeen: true,
        },
      });

      await useAuthStore.getState().hydrateSession();

      expect(vi.mocked(authApi.getCurrentUser)).toHaveBeenCalledWith('stored-token');
      const state = useAuthStore.getState();
      expect(state.user.email).toBe('a@b.com');
      expect(state.ndaAccepted).toBe(true);
      expect(state.walkthroughSeen).toBe(true);
      expect(state.isCheckingSession).toBe(false);
    });

    it('handles invalid session – clears state', async () => {
      useAuthStore.setState({ token: 'bad-token' });
      vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce({
        success: false,
        message: 'Authentication required.',
      });

      await useAuthStore.getState().hydrateSession();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.ndaAccepted).toBe(false);
      expect(state.walkthroughSeen).toBe(false);
    });

    it('does nothing when no token', async () => {
      vi.mocked(authApi.getCurrentUser).mockClear();
      await useAuthStore.getState().hydrateSession();
      expect(vi.mocked(authApi.getCurrentUser)).not.toHaveBeenCalled();
    });

    it('maps isAdmin and lastSeenAt from GET /auth/me response', async () => {
      useAuthStore.setState({ token: 'stored-token' });
      vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce({
        success: true,
        data: {
          id: 1,
          email: 'admin@b.com',
          ndaAccepted: true,
          walkthroughSeen: true,
          isAdmin: true,
          lastSeenAt: '2025-03-18T11:00:00.000Z',
        },
      });

      await useAuthStore.getState().hydrateSession();

      const state = useAuthStore.getState();
      expect(state.isAdmin).toBe(true);
      expect(state.lastSeenAt).toBe('2025-03-18T11:00:00.000Z');
    });
  });

  describe('acceptNda', () => {
    it('updates NDA state on success', async () => {
      useAuthStore.setState({
        token: 't',
        user: { id: 1 },
        ndaAccepted: false,
        walkthroughSeen: false,
      });
      vi.mocked(authApi.acceptNda).mockResolvedValueOnce({
        success: true,
        data: {
          id: 1,
          ndaAccepted: true,
          ndaVersion: '1.0',
          walkthroughSeen: false,
        },
      });

      const result = await useAuthStore.getState().acceptNda('1.0');

      expect(vi.mocked(authApi.acceptNda)).toHaveBeenCalledWith('t', { ndaVersion: '1.0' });
      expect(result.success).toBe(true);
      expect(useAuthStore.getState().ndaAccepted).toBe(true);
    });
  });

  describe('completeWalkthrough', () => {
    it('updates walkthrough state on success', async () => {
      useAuthStore.setState({
        token: 't',
        user: { id: 1 },
        ndaAccepted: true,
        walkthroughSeen: false,
      });
      vi.mocked(authApi.completeWalkthrough).mockResolvedValueOnce({
        success: true,
        data: {
          id: 1,
          ndaAccepted: true,
          walkthroughSeen: true,
        },
      });

      const result = await useAuthStore.getState().completeWalkthrough();

      expect(vi.mocked(authApi.completeWalkthrough)).toHaveBeenCalledWith('t');
      expect(result.success).toBe(true);
      expect(useAuthStore.getState().walkthroughSeen).toBe(true);
    });
  });

  describe('heartbeat', () => {
    it('calls heartbeat API and merges lastSeenAt on success', async () => {
      useAuthStore.setState({
        token: 't',
        user: { id: 1 },
        ndaAccepted: true,
        walkthroughSeen: true,
        lastSeenAt: null,
      });
      vi.mocked(authApi.heartbeat).mockResolvedValueOnce({
        success: true,
        data: {
          id: 1,
          lastSeenAt: '2025-03-18T12:30:00.000Z',
        },
      });

      const result = await useAuthStore.getState().heartbeat();

      expect(vi.mocked(authApi.heartbeat)).toHaveBeenCalledWith('t');
      expect(result.success).toBe(true);
      expect(useAuthStore.getState().lastSeenAt).toBe('2025-03-18T12:30:00.000Z');
    });

    it('does nothing when no token', async () => {
      useAuthStore.setState({ token: null });
      vi.mocked(authApi.heartbeat).mockClear();

      const result = await useAuthStore.getState().heartbeat();

      expect(vi.mocked(authApi.heartbeat)).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
    });

    it('clears auth on 401 (API.md § 5)', async () => {
      useAuthStore.setState({
        token: 't',
        user: { id: 1 },
        ndaAccepted: true,
        walkthroughSeen: true,
      });
      vi.mocked(authApi.heartbeat).mockResolvedValueOnce({
        success: false,
        message: 'Authentication required.',
        status: 401,
      });

      await useAuthStore.getState().heartbeat();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears state on logout', async () => {
      useAuthStore.setState({
        token: 't',
        user: { id: 1 },
        ndaAccepted: true,
        walkthroughSeen: true,
      });
      vi.mocked(authApi.logout).mockResolvedValueOnce({
        success: true,
        data: { message: 'Logged out' },
      });

      await useAuthStore.getState().logout();

      expect(vi.mocked(authApi.logout)).toHaveBeenCalledWith('t');
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.ndaAccepted).toBe(false);
      expect(state.walkthroughSeen).toBe(false);
    });
  });

  describe('clearAuth', () => {
    it('clears state without API call', () => {
      useAuthStore.setState({
        token: 't',
        user: { id: 1 },
        authError: 'err',
        isAdmin: true,
        lastSeenAt: '2025-03-18T12:00:00.000Z',
      });
      vi.mocked(authApi.logout).mockClear();

      useAuthStore.getState().clearAuth();

      expect(vi.mocked(authApi.logout)).not.toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.authError).toBeNull();
      expect(state.isAdmin).toBe(false);
      expect(state.lastSeenAt).toBeNull();
    });
  });
});
