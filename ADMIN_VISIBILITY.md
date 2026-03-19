# Admin Visibility Logic

## Overview

Admin-only access to the analytics UI is exposed via a user dropdown menu item. Only authenticated users with `isAdmin: true` see the admin entry point.

## Visibility Rules

| Condition | Admin entry point visible? |
|-----------|----------------------------|
| User authenticated + `isAdmin: true` | Yes |
| User authenticated + `isAdmin: false` | No |
| User not authenticated | N/A (user dropdown not shown) |

## Implementation

- **Auth store**: `isAdmin` is derived from `user.isAdmin` or `user.role === 'admin'` (see `useAuthStore.js`).
- **Admin entry point**: "Access analytics" menu item in `UserMenu.jsx`, shown only when `useAuthStore((s) => s.isAdmin)` is true.
- **Placement**: User dropdown (top-right header), above the Sign out button.
- **Action**: Clicking the item navigates to `activePage: 'admin'` (AdminPage).

## Files

- `src/components/auth/UserMenu.jsx` – conditional admin menu item
- `src/pages/AdminPage.jsx` – admin/analytics placeholder page
- `src/App.jsx` – `admin` route in PAGE_MAP
- `src/store/useAuthStore.js` – `isAdmin` state and `selectIsAdmin`

## Tests

- **UserMenu.test.jsx**: Admin users see the entry point; non-admin users do not; clicking navigates to admin page.
- **App.test.jsx**: Admin page renders when `activePage === 'admin'`; protected app still renders normally.
