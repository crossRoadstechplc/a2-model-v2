# A2 Investor Simulator – Developer Notes

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `http://localhost:3000` | Backend API base URL. No trailing slash. |

Create `.env` or `.env.local` in the project root. See `.env.example` for a template.

```bash
cp .env.example .env
# Edit .env if your backend runs on a different port
```

## API Base URL Setup

The frontend calls the A2 Simulator Gateway backend. Ensure:

1. Backend is running (e.g. `cd ../a2-model-backend/server && npm run dev`)
2. `VITE_API_BASE_URL` matches the backend port (default `http://localhost:3000`)
3. CORS is configured on the backend if frontend and backend use different origins

## Auth Flow

1. **Request OTP** – User enters First Name, Last Name, Email, Company Name. `POST /auth/request-otp` sends OTP by email.
2. **Verify OTP** – User enters 6-digit code. `POST /auth/verify-otp` returns session token and user.
3. **Session** – Token is stored in `localStorage` (via Zustand persist). `GET /auth/me` hydrates session on app load.
4. **Accept NDA** – First-time users must accept NDA. `POST /auth/accept-nda` with `ndaVersion`.
5. **Complete Walkthrough** – Optional intro modal. `POST /auth/complete-walkthrough` marks as seen.
6. **Logout** – `POST /auth/logout` revokes session; token is cleared locally.

All auth state lives in `useAuthStore`; simulator state is separate in `useSimulatorStore`.

## Onboarding Flow

1. **Login** – Request OTP → Verify OTP (LoginFlow, RequestOtpScreen, OtpVerifyScreen)
2. **NDA** – Accept NDA (NdaScreen)
3. **Walkthrough** – Dismiss or complete intro modal (WalkthroughModal)
4. **Simulator** – Main app content (Dashboard, Insights, etc.)

`AppGate` orchestrates the flow: it checks session, then shows Login → NDA → Simulator + optional Walkthrough overlay.

## Auth Store

- **State**: `token`, `user`, `ndaAccepted`, `walkthroughSeen`, `isAdmin`, `lastSeenAt`, `authError`, loading flags
- **Actions**: `requestOtp`, `verifyOtp`, `hydrateSession`, `acceptNda`, `completeWalkthrough`, `heartbeat`, `logout`, `clearAuth`
- **Error handling**: API errors (`error` or `message`) are surfaced via `authError`; components use `AuthErrorBanner`

## Simulator Separation

Auth code lives in `src/components/auth/` and `src/store/useAuthStore.js`. Simulator logic is in `src/store/useSimulatorStore.js` and `src/pages/`. The gate (`AppGate`) ensures the simulator only renders after auth and NDA are complete.

---

## Heartbeat and Admin Analytics

### Heartbeat (separate from simulator)

- **Purpose**: `POST /auth/heartbeat` every 60s while user is in the protected app. Backend uses this for access analytics.
- **Location**: `useHeartbeat` only in `AppShell`. No simulator logic.
- **Behavior**: 60s interval; pauses when tab hidden; resumes when visible; stops on unmount or logout.
- **On 401**: Auth store clears session; user returns to login. No simulator state touched.
- **See**: `HEARTBEAT_ARCHITECTURE.md`

### Admin analytics (separate from auth core)

- **Purpose**: Admin-only view for access logs, summaries, active sessions.
- **Location**: `src/components/admin/`, `src/pages/AdminPage.jsx`, `src/lib/api/admin.js`, `src/hooks/useAccessLogs.js`, `useAdminDashboard.js`
- **Auth dependency**: Only reads `token` and `isAdmin` from auth store. No auth logic in admin components.
- **Entry**: User menu shows "Access analytics" when `isAdmin`; clicking sets `activePage: 'admin'`.
- **See**: `ADMIN_DASHBOARD.md`

### Boundaries

| Layer | Auth | Simulator | Admin |
|-------|-----|-----------|-------|
| Auth store | ✓ | — | reads token, isAdmin |
| Simulator store | — | ✓ | reads setActivePage |
| Heartbeat | calls heartbeat | — | — |
| Admin page | token, isAdmin | setActivePage | ✓ |
