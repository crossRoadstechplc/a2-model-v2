# Frontend Auth Flow – Final Summary

## Implemented Flow

1. **App boot** – `AppGate` calls `hydrateSession()`. If a token exists in localStorage, `GET /auth/me` validates it and restores user, ndaAccepted, walkthroughSeen.

2. **Not authenticated** – `AuthShell` + `LoginFlow`:
   - Request OTP (name, email, company) → `POST /auth/request-otp`
   - Verify OTP (6 digits) → `POST /auth/verify-otp` → token stored

3. **Authenticated, NDA not accepted** – `AuthShell` + `NdaScreen`:
   - User accepts NDA → `POST /auth/accept-nda`

4. **Authenticated, NDA accepted** – `AppShell` (simulator) + optional `WalkthroughModal`:
   - Walkthrough explains session (4h), simulator, navigation
   - Finish/Skip → `POST /auth/complete-walkthrough`

5. **Logout** – UserMenu → Sign out → `POST /auth/logout` → session cleared → login flow

## State Ownership

| Store | Responsibility |
|-------|----------------|
| `useAuthStore` | Token, user, ndaAccepted, walkthroughSeen, loading flags, authError |
| `useSimulatorStore` | Simulator assumptions, results, UI state |

No auth logic in simulator; no simulator logic in auth.

## Error Handling

- API errors: `{ success: false, message }` or `{ error }` → normalized to `authError` in store
- `AuthErrorBanner` displays `authError` on RequestOtp, OtpVerify, NdaScreen
- Loading states: each action has `*Loading`; buttons disabled and show "Sending…", "Verifying…", etc.

## Environment

- `VITE_API_BASE_URL` – API base (default: http://localhost:3000)
- See `.env.example` and `DEVELOPER.md`

## Tests

- 81 tests: gate logic, auth screens, API client, store, simulator behind gate
- Auth flow: login → OTP → NDA → app; logout → login
