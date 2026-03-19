/**
 * Standalone app: backend auth is disabled.
 * Minimal stub so any remaining imports (e.g. optional admin hooks) do not crash.
 * Walkthrough state lives in useWalkthroughStore.
 */

import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: null,
  user: null,
  ndaAccepted: true,
  walkthroughSeen: true,
  showWalkthroughReplay: false,
  isAdmin: false,
  lastSeenAt: null,
  authError: null,
  isCheckingSession: false,
  requestOtpLoading: false,
  verifyOtpLoading: false,
  acceptNdaLoading: false,
  completeWalkthroughLoading: false,
  logoutLoading: false,

  requestOtp: async () => {
    set({ authError: 'Sign-in is disabled in standalone mode.' });
    return { success: false, message: 'Auth disabled' };
  },
  verifyOtp: async () => {
    set({ authError: 'Sign-in is disabled in standalone mode.' });
    return { success: false, message: 'Auth disabled' };
  },
  hydrateSession: async () => {
    set({ isCheckingSession: false });
  },
  acceptNda: async () => ({ success: false, message: 'Auth disabled' }),
  completeWalkthrough: async () => {
    set({ walkthroughSeen: true });
    return { success: true };
  },
  heartbeat: async () => ({ success: false }),
  logout: async () => {
    set({ logoutLoading: false });
  },
  clearAuth: () =>
    set({
      token: null,
      user: null,
      ndaAccepted: true,
      walkthroughSeen: true,
      authError: null,
    }),
  setShowWalkthroughReplay: () => {},
}));

export const selectToken = (s) => s.token;
export const selectUser = (s) => s.user;
export const selectNdaAccepted = (s) => s.ndaAccepted;
export const selectWalkthroughSeen = (s) => s.walkthroughSeen;
export const selectIsAdmin = (s) => s.isAdmin;
export const selectLastSeenAt = (s) => s.lastSeenAt;
export const selectAuthError = (s) => s.authError;
export const selectIsCheckingSession = (s) => s.isCheckingSession;
export const selectIsAuthenticated = (s) => Boolean(s.token) && !s.isCheckingSession;
export const selectRequestOtpLoading = (s) => s.requestOtpLoading;
export const selectVerifyOtpLoading = (s) => s.verifyOtpLoading;
export const selectAcceptNdaLoading = (s) => s.acceptNdaLoading;
export const selectCompleteWalkthroughLoading = (s) => s.completeWalkthroughLoading;
export const selectLogoutLoading = (s) => s.logoutLoading;
export const selectIsAuthBusy = (s) =>
  s.requestOtpLoading ||
  s.verifyOtpLoading ||
  s.acceptNdaLoading ||
  s.completeWalkthroughLoading ||
  s.logoutLoading ||
  s.isCheckingSession;

export default useAuthStore;
