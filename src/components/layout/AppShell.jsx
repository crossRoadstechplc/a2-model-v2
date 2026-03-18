/**
 * AppShell – root layout wrapper for protected app.
 *
 * Layout (left → right):
 *   NavSidebar (w-60, always visible)
 *   AssumptionsSidebar (w-72, toggleable)
 *   Main column (flex-1, Header + scrollable content)
 *
 * Starts heartbeat loop (POST /auth/heartbeat every 60s) while visible.
 * CTRL+Shift+A opens admin password dialog / analytics popup.
 * @see API.md § 5. Heartbeat
 */

import { useEffect } from 'react';
import { useSimulatorStore, selectPanelOpen } from '../../store/useSimulatorStore';
import { useHeartbeat } from '../../hooks/useHeartbeat';
import useAdminStore from '../../store/useAdminStore';
import { Sidebar }             from './Sidebar';
import { AssumptionsSidebar }  from './AssumptionsSidebar';
import { Header }              from './Header';
import { AdminPasswordDialog } from '../admin/AdminPasswordDialog';
import { AdminPopup }          from '../admin/AdminPopup';

export function AppShell({ children }) {
  const panelOpen = useSimulatorStore(selectPanelOpen);
  const openAdminUI = useAdminStore((s) => s.openAdminUI);

  useHeartbeat();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && e.key?.toLowerCase() === 'a') {
        e.preventDefault();
        openAdminUI();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openAdminUI]);

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

      <AdminPasswordDialog />
      <AdminPopup />
    </div>
  );
}
