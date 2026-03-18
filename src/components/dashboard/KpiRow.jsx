/**
 * KpiRow – two-row KPI grid for the investor dashboard.
 *
 * Row 1 — Business scale (4 tiles):
 *   Trucks · Annual kWh · Total Capex · Gross Revenue Pool
 *
 * Row 2 — Entity returns (3 tiles):
 *   Fleet IRR · Battery IRR · Platform IRR
 *
 * All values come from the runScenario `snapshot` (never recalculated here).
 * IRR tiles include a vs-target delta so investors see at a glance whether
 * each entity is meeting its hurdle rate.
 *
 * Props:
 *   snapshot   – results.snapshot from Zustand
 *   settings   – { projectionYears }
 *   battery    – battery assumptions (for batteryIRR target)
 *   platform   – platform assumptions (for platformIRR target)
 */

import clsx from 'clsx';
import {
  Truck,
  Zap,
  Building2,
  DollarSign,
  BatteryCharging,
  Activity,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, formatIRR } from '../../lib/finance/format';
import { DEFAULT_BATTERY_IRR, DEFAULT_PLATFORM_IRR, IRR_AMBER_TOLERANCE } from '../../lib/constants';

function irrDelta(actual, target) {
  if (actual === null || !isFinite(actual) || isNaN(actual)) return null;
  if (!target) return null;
  return actual - target;
}

function fmtDelta(delta) {
  if (delta === null) return null;
  const pct = delta * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}

// ─── Accent palette ───────────────────────────────────────────────────────────

const ACCENT = {
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',     border: 'border-blue-100'    },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600',border: 'border-emerald-100' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',   border: 'border-amber-100'   },
  slate:   { bg: 'bg-slate-50',   icon: 'bg-slate-100 text-slate-500',   border: 'border-slate-200'   },
  violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600', border: 'border-violet-100'  },
};

// ─── Base tile ────────────────────────────────────────────────────────────────

function Tile({ title, value, sub, delta, deltaColor, icon: Icon, accent = 'slate' }) {
  const a = ACCENT[accent] ?? ACCENT.slate;

  return (
    <div className={clsx('rounded-xl border p-4 flex flex-col gap-2.5', a.bg, a.border)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
          {title}
        </p>
        {Icon && (
          <div aria-hidden="true" className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', a.icon)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
        {value}
      </p>

      {/* Sub + delta row */}
      <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
        {sub && <p className="text-[11px] text-slate-500 leading-tight">{sub}</p>}
        {delta && (
          <span
            className={clsx(
              'text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0',
              deltaColor === 'green'  && 'bg-emerald-100 text-emerald-700',
              deltaColor === 'red'    && 'bg-red-100 text-red-600',
              deltaColor === 'amber'  && 'bg-amber-100 text-amber-700',
              deltaColor === 'slate'  && 'bg-slate-100 text-slate-600',
              !deltaColor             && 'bg-slate-100 text-slate-600',
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── IRR tile (specialised: shows vs-target badge) ────────────────────────────

function IrrTile({ title, irrValue, targetIRR, icon, accent }) {
  const delta = irrDelta(irrValue, targetIRR);

  let deltaColor = 'slate';
  if (delta !== null) {
    if (delta >= 0)          deltaColor = 'green';
    else if (delta >= -IRR_AMBER_TOLERANCE) deltaColor = 'amber';  // within 3pp of target → marginal
    else                     deltaColor = 'red';
  }

  const displayValue  = formatIRR(irrValue);
  const displayDelta  = delta !== null ? fmtDelta(delta) : null;
  const targetLabel   = targetIRR ? `Target ${formatPercent(targetIRR * 100, { decimals: 0 })}` : null;

  return (
    <Tile
      title={title}
      value={displayValue}
      sub={targetLabel}
      delta={displayDelta}
      deltaColor={deltaColor}
      icon={icon}
      accent={accent}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KpiRow({ snapshot, system, battery, platform }) {
  if (!snapshot) return null;

  const { demand, capex, batteryCompany, platformCompany, fleetCompany } = snapshot;

  // Gross revenue pool (sum of all entities before intercompany eliminations)
  const grossRevenuePool =
    (batteryCompany?.annualRevenue  ?? 0) +
    (platformCompany?.annualRevenue ?? 0) +
    (fleetCompany?.annualRevenue    ?? 0);

  // Truck count comes from the system store assumption (authoritative source)
  const trucks = system?.trucks ?? 0;

  return (
    <div className="space-y-3">

      {/* ── Row 1: Business scale ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <Tile
          title="Corridor Trucks"
          value={formatNumber(trucks)}
          sub={`${formatNumber(demand?.swapsPerDay ?? 0, { decimals: 0 })} swaps / day`}
          icon={Truck}
          accent="amber"
        />

        <Tile
          title="Annual kWh Throughput"
          value={formatNumber(demand?.kwhPerYear ?? 0, { compact: true, suffix: ' kWh' })}
          sub={`${formatNumber(demand?.kwhPerDay ?? 0, { compact: true })} kWh / day`}
          icon={Zap}
          accent="blue"
        />

        <Tile
          title="Total Combined Capex"
          value={formatCurrency(capex?.combined?.total ?? 0)}
          sub={`Battery ${formatCurrency(capex?.battery?.total ?? 0)} · Platform ${formatCurrency(capex?.platform?.total ?? 0)}`}
          icon={Building2}
          accent="slate"
        />

        <Tile
          title="Gross Revenue Pool"
          value={formatCurrency(grossRevenuePool)}
          sub="All 3 entities · Year 1"
          icon={DollarSign}
          accent="violet"
        />
      </div>

      {/* ── Row 2: Entity returns ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <IrrTile
          title="Fleet Co. IRR"
          irrValue={fleetCompany?.irr ?? null}
          targetIRR={null}     // Fleet has no fixed target — show raw IRR
          icon={Truck}
          accent="amber"
        />

        <IrrTile
          title="Battery Co. IRR"
          irrValue={batteryCompany?.irr ?? null}
          targetIRR={battery?.batteryIRR ?? DEFAULT_BATTERY_IRR}
          icon={BatteryCharging}
          accent="emerald"
        />

        <IrrTile
          title="Platform Co. IRR"
          irrValue={platformCompany?.irr ?? null}
          targetIRR={platform?.platformIRR ?? DEFAULT_PLATFORM_IRR}
          icon={Activity}
          accent="blue"
        />
      </div>
    </div>
  );
}
