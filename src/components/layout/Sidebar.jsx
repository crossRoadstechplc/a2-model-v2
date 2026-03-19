/**
 * Sidebar – left navigation panel.
 * Contains the app logo, entity nav links, and a footer badge.
 */

import clsx from 'clsx';
import {
  LayoutDashboard,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  LineChart,
  TrendingUp,
  FolderOpen,
  BookOpen,
} from 'lucide-react';
import { useSimulatorStore, selectControls, selectSettings } from '../../store/useSimulatorStore';
import useWalkthroughStore from '../../store/useWalkthroughStore';
import { getScenarioMeta } from '../../data/scenarios';

// Each nav item maps to a page key used in the store
const NAV_ITEMS = [
  {
    section: 'Inputs',
    id: 'assumptions',
    label: 'Assumptions',
    sub: 'All model inputs',
    icon: SlidersHorizontal,
    color: 'text-slate-400',
    activeColor: 'text-white',
    activeBg: 'bg-slate-600',
  },
  {
    section: 'Outputs',
    id: 'dashboard',
    label: 'Dashboard',
    sub: 'Consolidated overview',
    icon: LayoutDashboard,
    color: 'text-slate-300',
    activeColor: 'text-white',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'financials',
    label: 'Entity Financials',
    sub: 'Battery · Platform · Fleet',
    icon: LineChart,
    color: 'text-indigo-400',
    activeColor: 'text-white',
    activeBg: 'bg-indigo-600',
  },
  {
    id: 'insights',
    label: 'Scale Insights',
    sub: 'IRR · cost curves · scenarios',
    icon: TrendingUp,
    color: 'text-teal-400',
    activeColor: 'text-white',
    activeBg: 'bg-teal-600',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    sub: 'Compare Base · Optimistic · Stress',
    icon: Layers,
    color: 'text-violet-400',
    activeColor: 'text-white',
    activeBg: 'bg-violet-600',
  },
  {
    section: 'Actions',
    id: 'saveload',
    label: 'Save / Export',
    sub: 'Named slots · JSON · CSV',
    icon: FolderOpen,
    color: 'text-orange-400',
    activeColor: 'text-white',
    activeBg: 'bg-orange-600',
  },
];

export function Sidebar() {
  const activePage  = useSimulatorStore((s) => s.activePage);
  const setActivePage = useSimulatorStore((s) => s.setActivePage);
  const setPanelOpen = useSimulatorStore((s) => s.setPanelOpen);
  const settings    = useSimulatorStore(selectSettings);
  const controls    = useSimulatorStore(selectControls);
  const scenario    = controls.selectedScenario;
  const scenMeta    = getScenarioMeta(scenario);
  const setShowWalkthroughReplay = useWalkthroughStore((s) => s.setShowWalkthroughReplay);

  return (
    <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">A2</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              Investor Simulator
            </p>
            <p className="text-slate-500 text-xs">{settings.corridorName}</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          const isAssumptions = item.id === 'assumptions';
          return (
            <div key={item.id}>
              {item.section && (
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {item.section}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isAssumptions) {
                    setPanelOpen(true);
                    setActivePage('dashboard');
                    return;
                  }
                  setActivePage(item.id);
                }}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                  active
                    ? `${item.activeBg} shadow-sm`
                    : 'hover:bg-slate-800/70',
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 shrink-0',
                    active ? item.activeColor : item.color,
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      'text-sm font-medium leading-tight',
                      active ? 'text-white' : 'text-slate-300',
                    )}
                  >
                    {item.label}
                  </p>
                  <p
                    className={clsx(
                      'text-xs truncate mt-0.5',
                      active ? 'text-white/70' : 'text-slate-500',
                    )}
                  >
                    {item.sub}
                  </p>
                </div>
                {active && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/60 shrink-0" />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Scenario</span>
          <span
            className={clsx(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              scenario === 'conservative' && 'bg-amber-900 text-amber-400',
              scenario === 'base'         && 'bg-blue-900 text-blue-400',
              scenario === 'bull'         && 'bg-emerald-900 text-emerald-400',
              scenario === 'bear'         && 'bg-red-900 text-red-400',
            )}
          >
            {scenMeta.label}
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Data saved in your browser.
        </p>
        <button
          type="button"
          onClick={() => setShowWalkthroughReplay(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          data-testid="sidebar-walkthrough-btn"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          Start walkthrough
        </button>
      </div>
    </aside>
  );
}
