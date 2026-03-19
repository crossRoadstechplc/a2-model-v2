# Admin Access Logs

## Overview

Admin-only view for session access logs. Fetches from `GET /admin/access-logs` and displays a table with session data. Only accessible to authenticated users with `isAdmin: true`.

## Rendered Fields

| Column | Source | Format |
|--------|--------|--------|
| **Name** | `name` | Plain text |
| **Email** | `email` | Plain text |
| **Login time** | `loginAt` | Locale datetime (e.g. Mar 18, 2025, 12:00 PM) |
| **Logout time** | `logoutAt` | Locale datetime or "—" if null |
| **Last activity** | `lastActivityAt` | Locale datetime |
| **Session duration** | `sessionSeconds` | Human-readable (e.g. 1h 0m 0s) or "—" if active |
| **Status** | `status` | Badge: `active` (green), `logged_out` (slate), `expired` (amber) |

## API Integration

- **Endpoint**: `GET /admin/access-logs`
- **Auth**: Bearer token + admin role
- **Client**: `src/lib/api/admin.js` → `getAccessLogs(token, options?)`
- **Options**: `limit`, `offset`, `email`, `activeOnly`, `dateFrom`, `dateTo`

## Components

- **AdminPage** – Page with admin guard; redirects non-admins to dashboard
- **AccessLogsTable** – Table with loading, empty, error states
- **useAccessLogs** – Hook for fetching logs

## States

| State | UI |
|-------|-----|
| Loading | Spinner + "Loading access logs…" |
| Empty | Icon + "No access logs found" |
| Error | Icon + message + Retry button |
| Data | Table with all columns |

## Tests

- **admin.test.js**: API client calls correct endpoint with token and query params
- **useAccessLogs.test.js**: Fetches logs, handles error, handles unauthenticated
- **AccessLogsTable.test.jsx**: Loading, empty, error, data rendering
- **AdminPage.test.jsx**: Admin view renders, non-admin redirect, loading state
