# Auth Embedded in the Simulator App

This document describes how authentication and onboarding are integrated into the A2 Investor Simulator so they feel embedded rather than bolted on.

---

## Overview

Auth flows (login, OTP, NDA) use the **same visual shell** as the protected simulator: sidebar + header + main content. Transitions between auth and app are smooth because the layout stays consistent.

---

## Layout Unification

| Element | Auth Flow | Protected App |
|--------|-----------|---------------|
| **Shell** | `AuthShell` | `AppShell` |
| **Sidebar** | Dark (slate-900), A2 logo, "Sign in to access" | Same + nav items |
| **Header** | Step title + indicator (e.g. "Step 1 of 3") | Page title + UserMenu + scenario selector |
| **Main** | Centered auth cards (request OTP, verify, NDA) | Simulator pages |

Both shells use:
- `bg-slate-50` background
- `w-60` dark sidebar with A2 branding
- White header bar with `border-b border-slate-200`
- `px-8 py-6` main content padding

---

## Auth Flow Steps

1. **Step 1 of 3 – Sign in**  
   Request OTP → Verify OTP (both in same shell, card content changes)

2. **Step 2 of 3 – Agreement**  
   NDA acceptance screen

3. **Step 3**  
   Protected app + optional walkthrough modal

---

## Component Structure

```
src/components/auth/
├── index.js           # Public exports
├── AppGate.jsx        # Gate logic, wraps AuthShell or children
├── AuthShell.jsx      # Layout for auth screens (sidebar + header + main)
├── LoginFlow.jsx      # Request OTP + OTP verify orchestration
├── RequestOtpScreen.jsx
├── OtpVerifyScreen.jsx
├── NdaScreen.jsx
├── WalkthroughModal.jsx
├── WalkthroughSteps.js
├── UserMenu.jsx       # Shown in protected AppShell header
└── WalkthroughNote.md
```

- **Auth store** (`useAuthStore`) – only auth state, no simulator logic
- **Simulator store** (`useSimulatorStore`) – only simulator state, no auth logic

---

## User Identity

- **Header** – UserMenu in top-right shows initials avatar + name + email when opened
- **Dropdown** – Name, email, and "Sign out"
- **Styling** – Compact, low-contrast; no heavy borders

---

## Gate Logic

`AppGate` decides what to render:

1. `isCheckingSession` → AuthShell with "Loading…"
2. `!token` → AuthShell with LoginFlow
3. `token && !ndaAccepted` → AuthShell with NdaScreen
4. `token && ndaAccepted` → Protected children (AppShell) + optional WalkthroughModal

---

## Tests

- Gate rendering: auth shell vs simulator for each auth state
- Simulator inaccessible before auth and NDA
- Protected app shown after valid login flow
- Logout returns user to login flow (token cleared → AuthShell with LoginFlow)

---

## Transitions

- Auth → App: same layout (sidebar + header + main); sidebar gains nav, header gains controls
- No full-page reloads; React re-renders the appropriate shell
- Loading state uses AuthShell so layout consistency starts before any auth step
