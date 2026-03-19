# Admin Dashboard Capabilities

## Overview

Admin-only analytics view. Accessible only to authenticated users with `isAdmin: true`. Non-admins are redirected to the dashboard. Fetches from three admin endpoints and displays summary cards, active sessions, and access logs.

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/users/access-summary` | User-level summary (login counts, total session time) |
| `GET /admin/active-sessions` | Currently active sessions |
| `GET /admin/access-logs` | Paginated access logs (all sessions) |

## Summary Cards

Aggregates computed on frontend for display only; backend is source of truth.

| Card | Source | Calculation |
|------|--------|-------------|
| **Total users** | `access-summary` | `data.length` |
| **Total logins** | `access-summary` | `sum(loginCount)` |
| **Cumulative usage** | `access-summary` | `sum(totalSessionSeconds) / 3600` hours |
| **Active sessions** | `active-sessions` | `data.length` |

## Active Sessions Table

| Column | Source | Format |
|--------|--------|--------|
| Name | `name` | Plain text |
| Email | `email` | Plain text |
| Login time | `loginAt` | Locale datetime |
| Last activity | `lastActivityAt` | Locale datetime |
| Current duration | Estimated | `now - loginAt` (display only) |
| Status | — | Always "Active" |

## Access Logs Filters

| Control | Backend param | Description |
|---------|---------------|-------------|
| Email | `email` | Filter by user email (partial match) |
| From | `dateFrom` | `login_at >=` (ISO start of day) |
| To | `dateTo` | `login_at <=` (ISO end of day) |
| Active only | `activeOnly` | `true` to return only active sessions |
| Limit | `limit` | 50 or 100 rows per page |
| Apply | — | Commits filters and fetches |
| Clear | — | Resets filters to defaults |
| Refresh | — | Refetches with current filters |
| Previous / Next | `offset` | Pagination when full page returned |

## Access Logs Table

| Column | Source | Format |
|--------|--------|--------|
| Name | `name` | Plain text |
| Email | `email` | Plain text |
| Login time | `loginAt` | Locale datetime |
| Logout time | `logoutAt` | Locale datetime or "—" |
| Last activity | `lastActivityAt` | Locale datetime |
| Session duration | `sessionSeconds` | Human-readable (e.g. 45s, 1h 0m 0s, 2d 5h) |
| Status | `status` | Badge: active (green) / logged_out (slate) / expired (amber) |

## Duration Formatting

- Seconds: `45s`
- Minutes: `1m 30s`
- Hours: `1h 1m 1s`
- Days: `2d 3h 0m 0s`

## Status Badges

- **active** – emerald background, border
- **logged_out** – slate background, border
- **expired** – amber background, border

## Components

- **AdminPage** – Page with admin guard; redirects non-admins
- **AccessLogsFilters** – Email, date range, active only, limit, Apply, Clear, Refresh, pagination
- **AdminSummaryCards** – Four aggregate cards
- **ActiveSessionsTable** – Active sessions table
- **AccessLogsTable** – Full access logs table
- **useAdminDashboard** – Fetches summary + active sessions
- **useAccessLogs** – Fetches access logs with filter options

## States

| Section | Loading | Error |
|---------|---------|-------|
| Dashboard (summary + active) | "Loading dashboard…" | Message + Retry |
| Access logs | "Loading access logs…" | Message + Retry |

## Tests

- **admin.test.js**: getAccessLogs with all filter params, getAccessSummary, getActiveSessions
- **format.test.js**: formatDuration (null, seconds, minutes, hours, days), formatTimestamp
- **useAccessLogs.test.js**: Fetches with filter options, error, unauthenticated
- **AccessLogsFilters.test.jsx**: Apply, Clear, Refresh, pagination
- **AccessLogsTable.test.jsx**: Status badges, duration formatting
- **AdminPage.test.jsx**: Filters render, summaries, active sessions, non-admin guard
