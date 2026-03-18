/**
 * useAdminStore – client-side admin UI state.
 * Admin analytics is gated by password (VITE_ADMIN_PASS), not backend isAdmin.
 * CTRL+Shift+A opens password dialog; correct password shows admin popup.
 */

import { create } from 'zustand';

const useAdminStore = create((set) => ({
  /** Session-only: true after correct password. Resets on page reload. */
  adminUnlocked: false,
  /** Show password dialog (when CTRL+Shift+A and not unlocked) */
  showPasswordDialog: false,
  /** Show admin analytics popup */
  showAdminPopup: false,

  openAdminUI: () =>
    set((s) =>
      s.adminUnlocked
        ? { showAdminPopup: true, showPasswordDialog: false }
        : { showPasswordDialog: true, showAdminPopup: false }
    ),

  setShowPasswordDialog: (v) => set({ showPasswordDialog: v }),
  setShowAdminPopup: (v) => set({ showAdminPopup: v }),

  /** Call after correct password. Closes dialog, unlocks, shows popup. */
  unlockAndShowPopup: () =>
    set({ adminUnlocked: true, showPasswordDialog: false, showAdminPopup: true }),

  /** Close popup (does not reset unlock for this session) */
  closeAdminPopup: () => set({ showAdminPopup: false }),

  /** Log out of admin: reset unlock so next CTRL+Shift+A requires password again */
  adminLogout: () =>
    set({ adminUnlocked: false, showAdminPopup: false, showPasswordDialog: false }),
}));

export default useAdminStore;
