/**
 * AppGate – auth gate in front of the simulator.
 *
 * Flow:
 * 1. On mount: hydrateSession
 * 2. Loading during session check
 * 3. Not authenticated → LoginFlow (in AuthShell)
 * 4. Authenticated, NDA not accepted → NdaScreen (in AuthShell)
 * 5. Authenticated, NDA accepted → main content (children)
 * 6. Walkthrough not completed → overlay WalkthroughModal
 *
 * Consumes only useAuthStore. No simulator logic.
 */

import { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { AuthShell } from './AuthShell';
import { LoginFlow } from './LoginFlow';
import { NdaScreen } from './NdaScreen';
import { WalkthroughModal } from './WalkthroughModal';

export function AppGate({ children }) {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const token = useAuthStore((s) => s.token);
  const ndaAccepted = useAuthStore((s) => s.ndaAccepted);
  const walkthroughSeen = useAuthStore((s) => s.walkthroughSeen);
  const showWalkthroughReplay = useAuthStore((s) => s.showWalkthroughReplay);
  const isCheckingSession = useAuthStore((s) => s.isCheckingSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  // 1. Loading during session check
  if (isCheckingSession) {
    return (
      <AuthShell title="Loading" data-testid="gate-loading">
        <div className="flex min-h-full items-center justify-center">
          <div className="text-slate-600 text-sm">Loading…</div>
        </div>
      </AuthShell>
    );
  }

  // 2. Not authenticated → login
  if (!token) {
    return (
      <AuthShell
        title="Sign in"
        subtitle="Request access or verify your email"
        stepIndicator="Step 1 of 3"
      >
        <LoginFlow />
      </AuthShell>
    );
  }

  // 3. Authenticated but NDA not accepted
  if (!ndaAccepted) {
    return (
      <AuthShell
        title="Agreement"
        subtitle="Non-Disclosure Agreement"
        stepIndicator="Step 2 of 3"
      >
        <NdaScreen />
      </AuthShell>
    );
  }

  // 4. Authenticated, NDA accepted → main content + optional walkthrough modal
  return (
    <>
      {children}
      {(!walkthroughSeen || showWalkthroughReplay) && (
        <WalkthroughModal replay={showWalkthroughReplay} />
      )}
    </>
  );
}
