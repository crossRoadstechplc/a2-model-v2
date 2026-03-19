/**
 * Walkthrough UI state — local only (no API).
 * Persists completion so the modal does not reopen on every page load.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useWalkthroughStore = create(
  persist(
    (set) => ({
      walkthroughSeen: false,
      showWalkthroughReplay: false,

      /** Mark tour finished or skipped; persists to localStorage */
      markWalkthroughComplete: () =>
        set({ walkthroughSeen: true, showWalkthroughReplay: false }),

      setShowWalkthroughReplay: (v) => set({ showWalkthroughReplay: Boolean(v) }),
    }),
    { name: 'a2-walkthrough' },
  ),
);

export default useWalkthroughStore;
