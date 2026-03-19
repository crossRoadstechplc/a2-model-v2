# Frontend Auth Fields – Analytics & Admin Support

## New Auth Store Fields

| Field | Type | Description |
|-------|------|-------------|
| `isAdmin` | boolean | Whether the user has admin role. Mapped from `user.isAdmin` or `user.role === 'admin'`. |
| `lastSeenAt` | string \| null | ISO timestamp of last activity. Returned by backend (e.g. GET /auth/me, POST /auth/heartbeat). |

## Backend Mapping

The auth store derives these from API responses:

- **verifyOtp** – `user.isAdmin`, `user.role`, `user.lastSeenAt`
- **getCurrentUser (hydrateSession)** – `user.isAdmin`, `user.lastSeenAt`
- **acceptNda, completeWalkthrough** – same user shape
- **heartbeat** – response merged; updates `lastSeenAt`, `isAdmin` when present

## API Client

- **POST /auth/heartbeat** – Bearer token, no body. Used for access analytics. Backend may return `{ success: true }` only or user-like data; frontend merges lastSeenAt, isAdmin when present.

## Selectors

- `selectIsAdmin(s)` – `s.isAdmin`
- `selectLastSeenAt(s)` – `s.lastSeenAt`

## Usage

Call `heartbeat()` periodically (e.g. from a timer or on user activity) to update `lastSeenAt` for analytics. Use `selectIsAdmin` to conditionally render admin-only UI.
