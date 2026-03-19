# A2 Simulator – Auth Integration Plan

## 1. API Usage Summary (from API.md)

### Base URL
- `http://localhost:3000` (or `PORT` env)

### Auth-Related Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| Request OTP | `POST /auth/request-otp` | No | Send OTP to user's email |
| Verify OTP | `POST /auth/verify-otp` | No | Exchange OTP for session token |
| Current User | `GET /auth/me` | Bearer | Fetch current session user |
| Accept NDA | `POST /auth/accept-nda` | Bearer | Record NDA acceptance |
| Complete Walkthrough | `POST /auth/complete-walkthrough` | Bearer | Mark walkthrough done |
| Logout | `POST /auth/logout` | Bearer | Revoke session |

### Request OTP
- **Request:** `{ firstName, lastName, email, companyName }` (all required, 1–255 chars)
- **200:** `{ success: true, message: string }`
- **400:** `{ success: false, error: string }` (validation)
- **429:** `{ success: false, message: string }` (rate limit)

### Verify OTP
- **Request:** `{ email, otp }` (otp = 6 digits)
- **200:** `{ success: true, token, user, ndaAccepted, walkthroughSeen }`
- **401:** `{ success: false, message: "Invalid or expired verification code." }`
- **400:** `{ success: false, error: string }` (validation)

### Current User (`GET /auth/me`)
- **200:** User object: `{ id, name, firstName, lastName, email, companyName, ndaAccepted, ndaAcceptedAt, ndaVersion, walkthroughSeen, walkthroughSeenAt }`
- **401:** `{ success: false, message: "Authentication required." }`

### Accept NDA
- **Request:** `{ ndaVersion: string }` (1–50 chars)
- **200:** Same shape as `GET /auth/me` with updated NDA fields

### Complete Walkthrough
- **Request:** No body
- **200:** Same shape as `GET /auth/me` with updated walkthrough fields

### Logout
- **Request:** No body
- **200:** `{ success: true, message: "Logged out successfully." }`

### Token Transport
- **Method:** `Authorization: Bearer <token>`
- **Source:** Token from `POST /auth/verify-otp` response
- **Rules:** Token expires in 4 hours; revoked sessions return 401

### Error Response Structure
- `success: false` when error
- `error`: string (validation/business errors)
- `message`: string (auth/rate-limit messages)
- `stack`: only in development/test

---

## 2. Frontend Integration Plan

### Current Architecture

| Area | Location | Notes |
|------|----------|-------|
| Entry point | `src/main.jsx` | Renders `<App />` into `#root` |
| Root component | `src/App.jsx` | Renders `AppShell` + page from `PAGE_MAP` |
| Layout | `src/components/layout/AppShell.jsx` | Sidebar + AssumptionsSidebar + Header + main |
| Simulator store | `src/store/useSimulatorStore.js` | settings, system, battery, platform, fleet, controls, results |
| No API layer | — | All API calls to be added in `src/lib/api/` |
| No auth state | — | New `useAuthStore` separate from simulator |

### Auth Gate Placement

**Best place:** Wrap the main app content in `App.jsx`, between the root and `AppShell`:

```
main.jsx → App → AuthGate → AppShell → pages
```

- **If not authenticated:** `AuthGate` renders `LoginPage` (or OTP flow)
- **If authenticated:** `AuthGate` renders `children` (AppShell + pages)

This keeps the simulator and layout behind auth without touching `useSimulatorStore`.

### Auth Flow Order

1. User opens app → `AuthGate` checks `token` / `user`
2. No token → show OTP request form (firstName, lastName, email, companyName)
3. User submits → `POST /auth/request-otp`
4. User enters OTP → `POST /auth/verify-otp` → store `token`, `user`, `ndaAccepted`, `walkthroughSeen`
5. If `!ndaAccepted` → show NDA modal → `POST /auth/accept-nda`
6. If `!walkthroughSeen` → show walkthrough → `POST /auth/complete-walkthrough`
7. User reaches simulator (AppShell)
8. On logout → `POST /auth/logout` → clear token/user → redirect to login

### New Folders/Files to Create

```
src/
├── lib/
│   └── api/
│       ├── config.js          # BASE_URL, getAuthHeader
│       ├── auth.js            # requestOtp, verifyOtp, getMe, acceptNda, completeWalkthrough, logout
│       └── index.js            # re-exports
├── store/
│   └── useAuthStore.js         # token, user, ndaAccepted, walkthroughSeen, actions
├── components/
│   └── auth/
│       ├── AuthGate.jsx        # Renders LoginPage or children based on auth
│       ├── LoginPage.jsx       # OTP request + verify flow
│       ├── NdaModal.jsx        # NDA acceptance (phase 2)
│       └── Walkthrough.jsx     # Walkthrough UI (phase 3)
└── pages/
    └── LoginPage.jsx           # Or under components/auth/
```

### Auth State vs Simulator State

| Store | Purpose | Persistence | Touched by |
|-------|---------|-------------|------------|
| `useAuthStore` | token, user, ndaAccepted, walkthroughSeen | localStorage (token only) or sessionStorage | API client, AuthGate, LoginPage |
| `useSimulatorStore` | settings, system, battery, platform, fleet, controls, results | localStorage `a2-simulator-v2` | Simulator UI, engine |

- **No overlap:** Auth store never holds simulator data; simulator store never holds auth data.
- **AuthGate** reads only `useAuthStore` to decide what to render.
- **Simulator pages** read only `useSimulatorStore`; they assume user is authenticated.

---

## 3. Phased Implementation

| Phase | Scope | Files |
|-------|-------|-------|
| 1 | API client + auth store + AuthGate + LoginPage | `lib/api/*`, `useAuthStore`, `AuthGate`, `LoginPage` |
| 2 | NDA flow | `NdaModal`, `accept-nda` in api, AuthGate NDA check |
| 3 | Walkthrough flow | `Walkthrough`, `complete-walkthrough` in api |
| 4 | Polish | Logout in Header, token refresh, error handling |

---

## 4. Minimal Scaffolding (This Phase)

- `src/lib/api/config.js` – BASE_URL, getAuthHeader
- `src/lib/api/index.js` – re-exports
- `src/store/useAuthStore.js` – stub (token, user, ndaAccepted, walkthroughSeen, setSession, clearSession)
- `src/components/auth/AuthGate.jsx` – pass-through (renders children; ready for auth logic)
- Test setup: Vitest + React Testing Library + jsdom

```bash
npm run test        # run tests once
npm run test:watch  # watch mode
```

---

## 5. Test Setup

- **Runner:** Vitest
- **Config:** `vite.config.ts` → `test: { globals, environment: 'jsdom', setupFiles }`
- **Setup:** `src/test/setup.js` imports `@testing-library/jest-dom`
- **Tests:**
  - `src/lib/api/config.test.js` – API config
  - `src/store/useAuthStore.test.js` – auth store
  - `src/App.test.jsx` – App export, AuthGate render
