/**
 * AppShell – root layout wrapper.
 *
 * Layout (left → right):
 *   NavSidebar (w-60, always visible)
 *   AssumptionsSidebar (w-72, toggleable)
 *   Main column (flex-1, Header + scrollable content)
 */

import { useSimulatorStore, selectPanelOpen } from '../../store/useSimulatorStore';
import useWalkthroughStore from '../../store/useWalkthroughStore';
import { Sidebar }             from './Sidebar';
import { AssumptionsSidebar }  from './AssumptionsSidebar';
import { Header }              from './Header';
import { WalkthroughModal }    from '../auth/WalkthroughModal';

export function AppShell({ children }) {
  const panelOpen = useSimulatorStore(selectPanelOpen);
  const walkthroughSeen = useWalkthroughStore((s) => s.walkthroughSeen);
  const showWalkthroughReplay = useWalkthroughStore((s) => s.showWalkthroughReplay);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Navigation sidebar (always visible) ──────────────────────── */}
      <Sidebar />

      {/* ── Assumptions panel (toggleable) ───────────────────────────── */}
      {panelOpen && <AssumptionsSidebar />}

      {/* ── Main column ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Sticky top header */}
        <Header />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>

      {(!walkthroughSeen || showWalkthroughReplay) && (
        <WalkthroughModal replay={showWalkthroughReplay} />
      )}
    </div>
  );
}
