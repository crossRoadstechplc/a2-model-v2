/**
 * FinancialsPage – tabbed investor-facing financial summary for all 3 entities.
 *
 * Tab navigation: Battery Co. | Platform Co. | Fleet Co.
 *
 * Each tab shows EntityFinancialPanel which contains:
 *   1. KPI strip         – Revenue · EBITDA · EBITDA% · Capex · IRR · Payback
 *   2. Income waterfall  – Visual P&L: Revenue → Costs → EBITDA → D&A → EBIT
 *   3. Return summary    – IRR vs target · NPV · payback · capital structure
 *   4. Cash flow schedule – Year-by-year cumulative with breakeven highlight
 *   5. Multi-year P&L    – Collapsible full projection table (runModel)
 *
 * All values come from the model engines (snapshot + runModel).
 * No calculations happen in this file.
 */

import { useState }               from 'react';
import clsx                       from 'clsx';
import { BatteryCharging, Zap, Truck } from 'lucide-react';

import {
  useSimulatorStore,
  selectSnapshot,
  selectResults,
  selectSettings,
  selectBattery,
  selectPlatform,
  selectFleet,
} from '../store/useSimulatorStore';

import { EntityFinancialPanel } from '../components/entities/EntityFinancialPanel';
import { formatIRR }            from '../lib/finance/format';
import { DEFAULT_BATTERY_IRR, DEFAULT_PLATFORM_IRR } from '../lib/constants';

// ─── Entity waterfall line configs ────────────────────────────────────────────
// Each returns a lines array from the company snapshot object.

const WATERFALL = {
  battery: (c) => [
    { label: 'Lease Revenue',       value: c.annualRevenue,  type: 'revenue',
      hint: 'Per-kWh lease fee charged to Fleet Co.' },
    { label: 'Operating Costs',     value: c.annualOpex,     type: 'cost',
      hint: 'Pack maintenance + platform infra fee' },
    { label: 'EBITDA',              value: c.annualEBITDA,   type: 'subtotal' },
    { type: 'divider' },
    { label: 'Pack Depreciation',   value: c.depreciation,   type: 'deduct',
      hint: 'Straight-line over battery life' },
    { label: 'EBIT',                value: c.annualEBIT,     type: 'total' },
  ],
  platform: (c) => [
    { label: 'Access Fee Revenue',  value: c.annualRevenue,  type: 'revenue',
      hint: 'Per-kWh infrastructure fee charged to Fleet Co.' },
    { label: 'Operating Costs',     value: c.annualOpex,     type: 'cost',
      hint: 'Station opex, staff, software, overheads' },
    { label: 'EBITDA',              value: c.annualEBITDA,   type: 'subtotal' },
    { type: 'divider' },
    { label: 'Capex Amortization',  value: c.amortization,   type: 'deduct',
      hint: 'Straight-line over amortization period' },
    { label: 'EBIT',                value: c.annualEBIT,     type: 'total' },
  ],
  fleet: (c) => [
    { label: 'Freight Revenue',     value: c.annualRevenue,   type: 'revenue',
      hint: 'Contracted haulage revenue from shippers' },
    { label: 'Operating Costs',     value: c.annualOtherOpex, type: 'cost',
      hint: 'Drivers, maintenance, insurance (excl. energy)' },
    { label: 'Gross Profit',        value: c.grossProfit,     type: 'subtotal' },
    { type: 'divider' },
    { label: 'Energy & Swap Costs', value: c.annualEnergyCost,type: 'cost',
      hint: 'Electricity + battery lease + platform fee' },
    { label: 'EBITDA',              value: c.annualEBITDA,    type: 'total' },
    { type: 'divider' },
    { label: 'Truck Depreciation',  value: c.depreciation,    type: 'deduct',
      hint: 'Straight-line over truck life' },
    { label: 'EBIT',                value: c.annualEBIT,      type: 'total' },
  ],
};

// Multi-year table line configs (unchanged from existing entity pages)
const REVENUE_KEYS = {
  battery:  [{ key: 'leaseRevenue',        label: 'Battery Lease Fees' }],
  platform: [{ key: 'platformFeeRevenue',  label: 'Fleet Access Fees'  },
             { key: 'batteryInfraRevenue', label: 'Battery Infra Fee'   }],
  fleet:    [{ key: 'freightRevenue',      label: 'Freight Revenue'    }],
};
const COST_KEYS = {
  battery:  [{ key: 'annualPackCapex',  label: 'Pack Capex (amortized)'    },
             { key: 'maintenanceCost',  label: 'Pack Maintenance'          },
             { key: 'platformFee',      label: 'Platform Infrastructure Fee'}],
  platform: [{ key: 'stationOpex',             label: 'Station Opex'        },
             { key: 'staffCost',               label: 'Staff & Operations'  },
             { key: 'softwareCost',            label: 'Software & Monitoring'},
             { key: 'annualCapexAmortization', label: 'Capex Amortization'  }],
  fleet:    [{ key: 'truckDepreciation', label: 'Truck Depreciation'  },
             { key: 'driverCost',        label: 'Driver Salaries'      },
             { key: 'maintenanceCost',   label: 'Vehicle Maintenance'  },
             { key: 'insuranceCost',     label: 'Insurance'            },
             { key: 'platformFees',      label: 'Platform Fees'        },
             { key: 'batteryLeaseFees',  label: 'Battery Lease Fees'   }],
};

// ─── Tab strip ────────────────────────────────────────────────────────────────

const TABS = [
  {
    key:         'battery',
    label:       'Battery Co.',
    sublabel:    'Pack assets & leasing',
    icon:        BatteryCharging,
    accent:      'emerald',
    activeBg:    'bg-emerald-600',
    activeText:  'text-white',
    inactiveIcon:'text-emerald-500',
    border:      'border-emerald-600',
    dot:         'bg-emerald-500',
  },
  {
    key:         'platform',
    label:       'Platform Co.',
    sublabel:    'Infrastructure & charging',
    icon:        Zap,
    accent:      'blue',
    activeBg:    'bg-blue-600',
    activeText:  'text-white',
    inactiveIcon:'text-blue-500',
    border:      'border-blue-600',
    dot:         'bg-blue-500',
  },
  {
    key:         'fleet',
    label:       'Fleet Co.',
    sublabel:    'Freight operations',
    icon:        Truck,
    accent:      'amber',
    activeBg:    'bg-amber-500',
    activeText:  'text-white',
    inactiveIcon:'text-amber-500',
    border:      'border-amber-500',
    dot:         'bg-amber-400',
  },
];

const fmtIRR = formatIRR;

function TabButton({ tab, active, irrValue, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-5 py-3.5 rounded-xl text-left transition-all',
        'flex-1 sm:flex-none border-2',
        active
          ? `${tab.activeBg} border-transparent shadow-md`
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div
        aria-hidden="true"
        className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          active ? 'bg-white/20' : 'bg-slate-100',
        )}
      >
        <Icon className={clsx('w-4 h-4', active ? tab.activeText : tab.inactiveIcon)} />
      </div>
      <div>
        <p className={clsx('text-sm font-semibold leading-tight', active ? tab.activeText : 'text-slate-800')}>
          {tab.label}
        </p>
        <p className={clsx('text-xs mt-0.5', active ? 'text-white/70' : 'text-slate-500')}>
          {irrValue !== '—' ? `IRR ${irrValue}` : tab.sublabel}
        </p>
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FinancialsPage() {
  const [activeTab, setActiveTab] = useState('battery');

  const snapshot = useSimulatorStore(selectSnapshot);
  const results  = useSimulatorStore(selectResults);
  const settings = useSimulatorStore(selectSettings);
  const battery  = useSimulatorStore(selectBattery);
  const platform = useSimulatorStore(selectPlatform);
  const fleet    = useSimulatorStore(selectFleet);

  // Target IRRs from assumptions
  const TARGET_IRR = {
    battery:  battery?.batteryIRR   ?? DEFAULT_BATTERY_IRR,
    platform: platform?.platformIRR ?? DEFAULT_PLATFORM_IRR,
    fleet:    null,  // no fixed target for fleet
  };

  // Multi-year runModel rows per entity
  const ROWS = {
    battery:  results?.battery  ?? [],
    platform: results?.platform ?? [],
    fleet:    results?.fleet    ?? [],
  };

  // Snapshot company objects
  const COMPANY = {
    battery:  snapshot?.batteryCompany,
    platform: snapshot?.platformCompany,
    fleet:    snapshot?.fleetCompany,
  };

  const activeMeta = TABS.find((t) => t.key === activeTab) ?? TABS[0];

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Entity Financials</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Investor-grade P&amp;L, returns, and cash flow analysis · Year 1 steady-state snapshot
        </p>
      </div>

      {/* ── Entity tab strip ──────────────────────────────────────────── */}
      <div role="tablist" aria-label="Select entity" className="flex flex-wrap gap-2.5">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            active={activeTab === tab.key}
            irrValue={fmtIRR(COMPANY[tab.key]?.irr)}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      {/* ── Active entity panel ───────────────────────────────────────── */}
      <EntityFinancialPanel
        key={activeTab}           /* remount when switching tabs */
        entityKey={activeTab}
        company={COMPANY[activeTab]}
        rows={ROWS[activeTab]}
        settings={settings}
        targetIRR={TARGET_IRR[activeTab]}
        accentColor={activeMeta.accent}
        waterfallLines={WATERFALL[activeTab]}
        revenueKeys={REVENUE_KEYS[activeTab]}
        costKeys={COST_KEYS[activeTab]}
      />
    </div>
  );
}
