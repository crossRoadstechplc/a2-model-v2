# Heartbeat Loop – Frontend Architecture

## Overview

The frontend sends periodic `POST /auth/heartbeat` requests while an authenticated user is actively viewing the protected app. This supports access analytics and session activity tracking.

**API reference:** `API.md` § 5. Heartbeat

---

## Where Heartbeat Lives

```
App
└── AppGate
    ├── [Loading / Login / NDA]  → no heartbeat
    └── AppShell (protected)     → useHeartbeat() runs here
        ├── Sidebar
        ├── AssumptionsSidebar
        ├── Header
        └── <main>{children}</main>
```

- **AppShell** is the protected app layout. It is only rendered when the user has passed the gate (token, NDA accepted).
- **useHeartbeat** is called inside AppShell. It runs only when AppShell is mounted.
- Heartbeat logic is **not** in simulator calculation components, pages, or engine code.

---

## Flow

1. User reaches protected app → AppGate renders `children` (AppShell)
2. AppShell mounts → `useHeartbeat()` runs
3. If `token` exists and `!document.hidden`:
   - Sends `POST /auth/heartbeat` immediately
   - Sets interval (60s) for subsequent heartbeats
4. When tab is hidden → interval cleared (no requests)
5. When tab becomes visible → interval restarted, immediate heartbeat
6. On unmount (logout, navigate away) → interval cleared

---

## Hook: useHeartbeat

**Location:** `src/hooks/useHeartbeat.js`

- **Input:** `intervalMs` (default 60_000)
- **Behavior:**
  - Runs only when `token` exists
  - Pauses when `document.hidden`
  - Resumes when `document.visibilitychange` → visible
  - Cleans up on unmount
- **Errors:** Fails quietly; 401 handled by store (clears auth, user returns to login)

---

## Store: heartbeat + 401

The auth store’s `heartbeat` action:
- Calls `POST /auth/heartbeat` via API client
- On 401: clears session (same as expired token)
- On success: merges `lastSeenAt`, `isAdmin` when present

---

## Tests

| Test | File |
|------|------|
| Loop starts for authenticated users | useHeartbeat.test.jsx |
| Loop does not start when unauthenticated | useHeartbeat.test.jsx |
| Loop stops on unmount | useHeartbeat.test.jsx |
| Pauses when tab hidden, resumes when visible | useHeartbeat.test.jsx |
| AppShell starts heartbeat when mounted | AppShell.test.jsx |
| Store clears auth on 401 | useAuthStore.test.js |
