# Session Persistence & Logout – API Alignment

This document summarizes how the app's session and logout behavior aligns with `API.md`.

---

## Token / Session Behavior (per API.md)

| API Doc Rule | Implementation |
|--------------|----------------|
| **Bearer token** from `POST /auth/verify-otp` | Token stored in Zustand auth store; persisted via `persist` middleware (localStorage key `a2-auth`). |
| **Authorization header** | `Authorization: Bearer <token>` sent on all protected requests (GET /auth/me, POST /auth/accept-nda, POST /auth/complete-walkthrough, POST /auth/logout). |
| **Token expires in 4 hours** | Backend enforces expiry. Frontend does not track expiry; relies on 401 from backend. |
| **Expired/revoked sessions return 401** | `hydrateSession` and all auth API calls use `getCurrentUser` / request client; 401 → `success: false` → store clears session. |
| **GET /auth/me** for current user | Called on app boot (`hydrateSession`) when a persisted token exists. Restores `user`, `ndaAccepted`, `walkthroughSeen`. |
| **POST /auth/logout** | Called when user clicks Sign out. Revokes session server-side. Frontend clears auth state regardless of response. |

---

## Session Persistence

- **What is persisted:** Token only (`partialize: (s) => ({ token: s.token })`).
- **Where:** `localStorage` under key `a2-auth`.
- **On app boot:** `AppGate` calls `hydrateSession()`. If token exists, `GET /auth/me` validates it and fetches user. On success, `user`, `ndaAccepted`, `walkthroughSeen` are restored. On failure (401, network error), session is cleared and user sees login.

---

## Invalid / Expired Session Handling

- Any protected request that returns 401 (or `success: false`) causes the auth store to clear session via `clearSession()`.
- `hydrateSession` explicitly clears state when `getCurrentUser` fails.
- User is redirected to login flow when `token` is null.

---

## Logout

- **UI:** User menu (top-right in Header) with name/email and "Sign out" button.
- **Action:** Calls `logout()` from auth store.
- **Backend:** `POST /auth/logout` with Bearer token (per API doc).
- **Frontend:** Clears token, user, ndaAccepted, walkthroughSeen. User sees login flow.
- **Persistence:** Cleared token is removed from localStorage on next persist cycle.

---

## Cookie-Based Session

The API doc describes **Bearer token** auth only. There is no cookie-based session. All auth is token-based via the `Authorization` header.

---

## State Ownership

- **Auth store** (`useAuthStore`) owns all session state and auth actions.
- Session logic is not scattered; `hydrateSession`, `logout`, and token persistence live in the store.
- Simulator logic remains separate in `useSimulatorStore`.
