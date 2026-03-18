/**
 * Top header bar.
 * Shows the page title and the scenario switcher.
 */

import clsx from 'clsx';
import { SlidersHorizontal } from 'lucide-react';
import { UserMenu } from '../auth/UserMenu';
import {
  useSimulatorStore,
  selectControls,
  selectSettings,
  selectPanelOpen,
} from '../../store/useSimulatorStore';
import { SCENARIO_ORDER, getScenarioMeta } from '../../data/scenarios';

const PAGE_META = {
  dashboard:   { title: 'Consolidated Dashboard',     sub: 'All three entities — post intercompany elimination' },
  financials:  { title: 'Entity Financials',          sub: 'Investor P&L · IRR · NPV · cash flow — Battery · Platform · Fleet' },
  insights:    { title: 'Scale & Sensitivity Insights', sub: 'IRR curves · cost per kWh · EV vs diesel · scenario comparison' },
  platform:    { title: 'Platform Company',            sub: 'Charging infrastructure economics' },
  battery:     { title: 'Battery Company',             sub: 'Battery pack asset & leasing model' },
  fleet:       { title: 'Fleet Company',               sub: 'Freight operations P&L' },
  scenarios:   { title: 'Scenario Comparison',         sub: 'Base · Optimistic · Stress — same engine, different assumptions' },
  saveload:    { title: 'Save & Export',                sub: 'Named scenario slots · export to JSON and CSV' },
  assumptions: { title: 'Model Assumptions',           sub: 'Adjust inputs — results update instantly' },
};

const SCENARIO_BUTTON_CLS = {
  conservative: 'bg-amber-50 text-amber-700 border-amber-200',
  base:         'bg-blue-50 text-blue-700 border-blue-200',
  bull:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  bear:         'bg-red-50 text-red-700 border-red-200',
};

export function Header() {
  const activePage  = useSimulatorStore((s) => s.activePage);
  const controls    = useSimulatorStore(selectControls);
  const settings    = useSimulatorStore(selectSettings);
  const setScenario = useSimulatorStore((s) => s.setScenario);
  const panelOpen   = useSimulatorStore(selectPanelOpen);
  const togglePanel = useSimulatorStore((s) => s.togglePanel);

  const meta             = PAGE_META[activePage] ?? PAGE_META.dashboard;
  const selectedScenario = controls.selectedScenario;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 gap-4">

      {/* ── Left: toggle + page title ────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">

        {/* Assumptions panel toggle */}
        <button
          onClick={togglePanel}
          title={panelOpen ? 'Hide model inputs' : 'Show model inputs'}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all shrink-0',
            panelOpen
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Inputs</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 shrink-0" />

        {/* Page title */}
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate">{meta.title}</h1>
          <p className="text-xs text-slate-400 truncate hidden sm:block">{meta.sub}</p>
        </div>
      </div>

      {/* ── Right controls ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4">

        {/* Projection years badge */}
        <span className="hidden sm:inline text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {settings.projectionYears}-year model
        </span>

        {/* User menu + logout */}
        <UserMenu />

        {/* Scenario selector — driven by SCENARIO_ORDER from data/scenarios.js */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
          {SCENARIO_ORDER.map((key) => {
            const scenMeta = getScenarioMeta(key);
            const activeCls = SCENARIO_BUTTON_CLS[key] ?? SCENARIO_BUTTON_CLS.base;
            return (
              <button
                key={key}
                onClick={() => setScenario(key)}
                title={scenMeta.description}
                className={clsx(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-all',
                  selectedScenario === key
                    ? activeCls + ' shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600',
                )}
              >
                {scenMeta.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
