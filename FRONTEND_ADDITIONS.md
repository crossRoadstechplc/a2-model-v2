# Frontend Additions – Summary

## Overview

Admin access analytics and heartbeat were added to the A2 Investor Simulator frontend. Auth, simulator, and admin analytics remain separate. Simulator and login/NDA/walkthrough flow are unchanged.

---

## How to Access the Admin Panel

1. **Log in** with an account that has admin privileges (`users.is_admin = 1`).
2. **Complete the NDA** and walkthrough if required.
3. **Open the user menu** (top-right avatar/name).
4. **Click "Access analytics"** in the dropdown. Only visible when `isAdmin` is true.
5. The admin page shows summary cards, active sessions, and access logs with filters.

**Admin entry point:** User menu (header) → "Access analytics" → AdminPage.

---

## API Client Organization

| File | Purpose |
|------|---------|
| `src/lib/api/config.js` | Base URL, `getAuthHeader` |
| `src/lib/api/client.js` | Low-level `request()` |
| `src/lib/api/auth.js` | Auth API (OTP, verify, me, NDA, walkthrough, heartbeat, logout) |
| `src/lib/api/admin.js` | Admin API (getAccessLogs, getAccessSummary, getActiveSessions) |
| `src/lib/api/errors.js` | Error normalization |

Auth and admin are separate modules; both use `client.js`.

---

## Auth Store Shape

- **Core**: `token`, `user`, `ndaAccepted`, `walkthroughSeen`, `authError`, loading flags
- **Analytics**: `isAdmin`, `lastSeenAt` (updated by heartbeat, verifyOtp, getCurrentUser)
- **Actions**: `heartbeat` is an action; 401 clears session. No simulator or admin logic.

---

## Admin Component Structure

```
src/
├── components/admin/
│   ├── AccessLogsFilters.jsx   # filters, Apply, Refresh, pagination
│   ├── AccessLogsTable.jsx     # access logs table
│   ├── AdminSummaryCards.jsx   # four summary cards
│   └── ActiveSessionsTable.jsx # active sessions table
├── pages/
│   └── AdminPage.jsx           # admin view, guards non-admins
├── hooks/
│   ├── useAccessLogs.js        # fetch access logs with filters
│   └── useAdminDashboard.js    # fetch summary + active sessions
└── lib/
    └── admin/
        └── format.js           # formatTimestamp, formatDuration, formatUsageHours
```

---

## Heartbeat Cleanup

- **On 401**: Auth store calls `resetSession`; token cleared; user returns to login.
- **On unmount**: `useHeartbeat` clears interval and removes visibility listener.
- **On tab hidden**: Interval cleared; no requests while hidden.
- **Simulator**: No simulator state is modified by heartbeat.

---

## Loading/Error States

| Component | Loading | Error |
|-----------|---------|-------|
| Dashboard (summary + active) | "Loading dashboard…" | Message + Retry |
| Access logs | "Loading access logs…" | Message + Retry |
| AccessLogsTable | Spinner | Message + Retry |
| AccessLogsFilters | Refresh spins, Apply disabled | — |

---

## Route / Dialog Integration

- **No router**: App uses `activePage` in `useSimulatorStore`.
- **Admin**: `activePage: 'admin'` renders `AdminPage`; non-admins are redirected to dashboard.
- **Entry**: User menu shows "Access analytics" when `isAdmin`; clicking sets `activePage('admin')`.

---

## Test Coverage

| Area | Tests |
|------|-------|
| Auth | AppGate, RequestOtp, OtpVerify, NdaScreen, Walkthrough, UserMenu, AuthErrorBanner |
| Simulator | App, AppShell |
| Heartbeat | useHeartbeat (4), useAuthStore heartbeat 401 |
| Admin | admin.test.js, useAccessLogs, useAdminDashboard, AdminPage, AccessLogsFilters, AccessLogsTable, AdminSummaryCards, ActiveSessionsTable, format |
| API | auth, admin, client, config, errors |

Run: `npm test -- --run`

---

## Related Docs

- `HEARTBEAT_ARCHITECTURE.md` – Heartbeat loop
- `ADMIN_DASHBOARD.md` – Admin filters, tables, components
- `DEVELOPER.md` – Heartbeat and admin analytics overview
