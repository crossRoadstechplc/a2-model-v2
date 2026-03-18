/**
 * useAuthStore – auth state, separate from simulator and admin analytics.
 *
 * State: token, user, ndaAccepted, walkthroughSeen, isAdmin, lastSeenAt, loading flags, authError
 * Actions: requestOtp, verifyOtp, hydrateSession, acceptNda, completeWalkthrough, heartbeat, logout, clearAuth
 *
 * Heartbeat: POST /auth/heartbeat every 60s (from useHeartbeat in AppShell). Updates lastSeenAt, isAdmin.
 * On 401: clears session. No simulator or admin logic here.
 *
 * API errors: backend returns { error } or { message }; we surface via authError.
 * Persistence: token only (for session hydration on app start).
 *
 * @see API.md (backend)
 * @see HEARTBEAT_ARCHITECTURE.md
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  getCurrentUser,
  acceptNda as apiAcceptNda,
  completeWalkthrough as apiCompleteWalkthrough,
  heartbeat as apiHeartbeat,
  logout as apiLogout,
} from '../lib/api/auth.js';

/** Derives isAdmin from user object. Supports user.isAdmin or user.role === 'admin'. */
function deriveIsAdmin(user) {
  if (!user) return false;
  if (typeof user.isAdmin === 'boolean') return user.isAdmin;
  return user.role === 'admin';
}

const INITIAL = {
  token: null,
  user: null,
  ndaAccepted: false,
  walkthroughSeen: false,
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
};

function mergeSession(state, payload) {
  const user = payload?.user ?? null;
  return {
    ...state,
    token: payload?.token ?? null,
    user,
    ndaAccepted: payload?.ndaAccepted ?? false,
    walkthroughSeen: payload?.walkthroughSeen ?? false,
    isAdmin: typeof payload?.isAdmin === 'boolean' ? payload.isAdmin : (user ? deriveIsAdmin(user) : state.isAdmin),
    lastSeenAt: payload?.lastSeenAt ?? user?.lastSeenAt ?? state.lastSeenAt,
    authError: null,
  };
}

function resetSession(state) {
  return { ...state, ...INITIAL };
}

/** Runs an auth API call with loading state; returns result, sets authError on failure. */
async function runWithLoading(set, get, loadingKey, apiCall, onSuccess) {
  set({ [loadingKey]: true, authError: null });
  const result = await apiCall();
  set({ [loadingKey]: false });
  if (result.success) {
    if (onSuccess) set(mergeSession(get(), onSuccess(get(), result)));
    else set({ authError: null });
    return { success: true };
  }
  set({ authError: result.message });
  return { success: false, message: result.message };
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      ...INITIAL,

      requestOtp: async (payload) =>
        runWithLoading(set, get, 'requestOtpLoading', () => apiRequestOtp(payload)),

      verifyOtp: async (payload) =>
        runWithLoading(set, get, 'verifyOtpLoading', () => apiVerifyOtp(payload), (_, res) => ({
          token: res.data.token,
          user: res.data.user,
          ndaAccepted: res.data.ndaAccepted,
          walkthroughSeen: res.data.walkthroughSeen,
        })),

      hydrateSession: async () => {
        const token = get().token;
        if (!token) return;
        set({ isCheckingSession: true, authError: null });
        const result = await getCurrentUser(token);
        set({ isCheckingSession: false });
        if (result.success) {
          const u = result.data;
          set(mergeSession(get(), { token, user: u, ndaAccepted: u.ndaAccepted ?? false, walkthroughSeen: u.walkthroughSeen ?? false }));
        } else {
          set(resetSession(get()));
        }
      },

      acceptNda: async (ndaVersion) => {
        const token = get().token;
        if (!token) {
          set({ authError: 'Not authenticated' });
          return { success: false, message: 'Not authenticated' };
        }
        return runWithLoading(set, get, 'acceptNdaLoading', () => apiAcceptNda(token, { ndaVersion }), (s, res) => {
          const u = res.data;
          return { token, user: u, ndaAccepted: u.ndaAccepted ?? true, walkthroughSeen: u.walkthroughSeen ?? s.walkthroughSeen };
        });
      },

      completeWalkthrough: async () => {
        const token = get().token;
        if (!token) {
          set({ authError: 'Not authenticated' });
          return { success: false, message: 'Not authenticated' };
        }
        return runWithLoading(set, get, 'completeWalkthroughLoading', () => apiCompleteWalkthrough(token), (s, res) => {
          const u = res.data;
          return { token, user: u, ndaAccepted: u.ndaAccepted ?? s.ndaAccepted, walkthroughSeen: u.walkthroughSeen ?? true };
        });
      },

      /** POST /auth/heartbeat – access analytics. Merges lastSeenAt, isAdmin from response.
       * On 401 (auth invalid), clears session. See API.md § 5. */
      heartbeat: async () => {
        const token = get().token;
        if (!token) return { success: false };
        const result = await apiHeartbeat(token);
        if (result.success) {
          const u = result.data;
          set(mergeSession(get(), {
            token,
            user: u ?? get().user,
            ndaAccepted: u?.ndaAccepted ?? get().ndaAccepted,
            walkthroughSeen: u?.walkthroughSeen ?? get().walkthroughSeen,
            isAdmin: typeof u?.isAdmin === 'boolean' ? u.isAdmin : deriveIsAdmin(u),
            lastSeenAt: u?.lastSeenAt ?? get().lastSeenAt,
          }));
          return { success: true };
        }
        if (result.status === 401) {
          set(resetSession(get()));
        }
        return { success: false };
      },

      logout: async () => {
        const token = get().token;
        set({ logoutLoading: true, authError: null });
        if (token) await apiLogout(token);
        set(resetSession(get()));
      },

      clearAuth: () => set(resetSession(get())),

      /** Show walkthrough modal again (replay). UI-only, not persisted. */
      setShowWalkthroughReplay: (v) => set({ showWalkthroughReplay: v }),
    }),
    { name: 'a2-auth', partialize: (s) => ({ token: s.token }) }
  )
);

// Selectors
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
/** True when any auth action is in progress. */
export const selectIsAuthBusy = (s) =>
  s.requestOtpLoading || s.verifyOtpLoading || s.acceptNdaLoading || s.completeWalkthroughLoading || s.logoutLoading || s.isCheckingSession;

export default useAuthStore;
