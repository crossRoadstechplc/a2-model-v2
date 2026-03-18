/**
 * ScenarioCard – one column in the scenario comparison grid.
 *
 * Displays a complete economic summary for a single scenario preset,
 * including entity IRRs, cost per kWh breakdown, viability verdict, and
 * a button to load the scenario into the active workspace.
 *
 * Props:
 *   scenarioKey  – string key ('base' | 'optimistic' | 'stress')
 *   meta         – { label, tagline, description, theme }
 *   inputs       – the merged assumption set (for display only)
 *   snapshot     – output of runScenario()
 *   onLoad       – () => void  called when "Apply to workspace" is clicked
 *   isActive     – boolean  true when this scenario is currently loaded
 */

import clsx from 'clsx';
import {
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  BatteryCharging,
  Truck,
  DollarSign,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { formatPercent, formatNumber, formatCurrency } from '../../lib/finance/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safe IRR formatter — handles null, very large, and negative values. */
function fmtIRR(v) {
  if (v === null || v === undefined) return '—';
  if (!isFinite(v) || isNaN(v)) return '—';
  if (v > 9.99) return '>999%';   // uncapped extremely high IRR
  return formatPercent(v * 100, { decimals: 1 });
}

/** Color class based on IRR value. */
function irrColor(v) {
  if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return 'text-slate-400';
  if (v >= 0.15) return 'text-emerald-600';
  if (v >= 0.08) return 'text-amber-600';
  return 'text-red-500';
}

/** $/kWh or $/km formatter — 2 decimal places. */
function fmtRate(v) {
  if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return '—';
  return `$${Math.abs(v).toFixed(2)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Horizontal row inside a section: label on left, value on right. */
function MetricRow({ label, value, valueClass = 'text-slate-800', sub }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 leading-tight">{label}</span>
      <div className="text-right">
        <span className={clsx('text-xs font-semibold tabular-nums', valueClass)}>
          {value}
        </span>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** Section header inside the card. */
function SectionHeader({ icon: Icon, title, iconColor }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className={clsx('w-3.5 h-3.5', iconColor)} />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

// ─── Viability badge ──────────────────────────────────────────────────────────

function ViabilityBadge({ label }) {
  const cfg = {
    'Viable':     { icon: CheckCircle2,  cls: 'bg-emerald-100 text-emerald-700', iconCls: 'text-emerald-600' },
    'Marginal':   { icon: MinusCircle,   cls: 'bg-amber-100 text-amber-700',    iconCls: 'text-amber-500'   },
    'Not Viable': { icon: AlertCircle,   cls: 'bg-red-100 text-red-700',        iconCls: 'text-red-500'     },
  }[label] ?? { icon: MinusCircle, cls: 'bg-slate-100 text-slate-600', iconCls: 'text-slate-400' };

  const Icon = cfg.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.cls)}>
      <Icon className={clsx('w-3.5 h-3.5', cfg.iconCls)} />
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScenarioCard({ scenarioKey, meta, inputs, snapshot, onLoad, isActive }) {
  const theme = meta.theme;

  // Guard against missing snapshot
  if (!snapshot) {
    return (
      <div className={clsx('rounded-xl border bg-white', theme.border, 'overflow-hidden')}>
        <div className={clsx('h-1.5 w-full', theme.topBar)} />
        <div className="p-6 text-center text-slate-400 text-sm">No data available</div>
      </div>
    );
  }

  const {
    batteryCompany,
    platformCompany,
    fleetCompany,
    pricing,
    viability,
    infrastructure,
    capex,
    demand,
  } = snapshot;

  const batteryIRR  = batteryCompany?.irr  ?? null;
  const platformIRR = platformCompany?.irr ?? null;
  const fleetIRR    = fleetCompany?.irr    ?? null;

  const totalCostPerKwh  = pricing?.totalCostPerKwh         ?? 0;
  const electricCostPerKm = viability?.electricCostPerKm     ?? 0;
  const savingsPerKm      = viability?.savingsPerKm          ?? 0;
  const savingsPercent    = viability?.savingsPercent        ?? 0;
  const viabilityLabel    = viability?.label                 ?? '—';

  // Savings direction
  const savingsIsPositive = savingsPerKm > 0;

  return (
    <div
      className={clsx(
        'rounded-xl border flex flex-col overflow-hidden transition-shadow',
        isActive ? 'shadow-lg ring-2 ring-offset-1' : 'shadow-sm hover:shadow-md',
        isActive && theme.border,
        !isActive && 'border-slate-200',
      )}
    >
      {/* ── Coloured top bar ──────────────────────────────────────────── */}
      <div className={clsx('h-1.5 w-full shrink-0', theme.topBar)} />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className={clsx('px-5 pt-4 pb-3', theme.bg)}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className={clsx('text-base font-bold', theme.text)}>{meta.label}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{meta.tagline}</p>
          </div>
          <ViabilityBadge label={viabilityLabel} />
        </div>

        {/* Key headline numbers */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-white/70 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-slate-500 mb-0.5">Trucks</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {inputs.system.trucks}
            </p>
          </div>
          <div className="bg-white/70 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-slate-500 mb-0.5">kWh / yr</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {formatNumber(demand.kwhPerYear, { compact: true })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white px-5 py-4 space-y-4">

        {/* Entity IRRs */}
        <div>
          <SectionHeader icon={Activity} title="Entity IRRs" iconColor="text-slate-400" />
          <div className="space-y-0">
            <MetricRow
              label="Battery Co. IRR"
              value={fmtIRR(batteryIRR)}
              valueClass={irrColor(batteryIRR)}
              sub={`Target ${formatPercent((inputs.battery.batteryIRR ?? 0.18) * 100, { decimals: 0 })}`}
            />
            <MetricRow
              label="Platform Co. IRR"
              value={fmtIRR(platformIRR)}
              valueClass={irrColor(platformIRR)}
              sub={`Target ${formatPercent((inputs.platform.platformIRR ?? 0.15) * 100, { decimals: 0 })}`}
            />
            <MetricRow
              label="Fleet Co. IRR"
              value={fmtIRR(fleetIRR)}
              valueClass={irrColor(fleetIRR)}
              sub="Freight operations"
            />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <SectionHeader icon={DollarSign} title="Pricing" iconColor="text-slate-400" />
          <div className="space-y-0">
            <MetricRow
              label="Electricity cost"
              value={`$${(inputs.system.electricityCost ?? 0).toFixed(2)}/kWh`}
            />
            <MetricRow
              label="Battery lease"
              value={fmtRate(pricing.batteryLeasePerKwh) + '/kWh'}
              valueClass="text-slate-700"
            />
            <MetricRow
              label="Platform fee"
              value={fmtRate(pricing.platformFeePerKwh) + '/kWh'}
              valueClass="text-slate-700"
            />
            <MetricRow
              label="Total cost / kWh"
              value={fmtRate(totalCostPerKwh) + '/kWh'}
              valueClass="font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Viability vs Diesel */}
        <div>
          <SectionHeader
            icon={savingsIsPositive ? TrendingUp : TrendingDown}
            title="vs. Diesel"
            iconColor={savingsIsPositive ? 'text-emerald-500' : 'text-red-400'}
          />
          <div className="space-y-0">
            <MetricRow
              label="Electric cost / km"
              value={fmtRate(electricCostPerKm) + '/km'}
              valueClass="text-slate-700"
            />
            <MetricRow
              label="Diesel cost / km"
              value={fmtRate(viability.dieselCostPerKm) + '/km'}
              valueClass="text-slate-500"
            />
            <MetricRow
              label="Savings / km"
              value={`${savingsIsPositive ? '+' : ''}${fmtRate(savingsPerKm)}/km`}
              valueClass={savingsIsPositive ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}
              sub={
                savingsIsPositive
                  ? `${savingsPercent.toFixed(1)}% cheaper than diesel`
                  : `${Math.abs(savingsPercent).toFixed(1)}% more expensive`
              }
            />
          </div>
        </div>

        {/* Infrastructure at a glance */}
        <div>
          <SectionHeader icon={Zap} title="Infrastructure" iconColor="text-slate-400" />
          <div className="space-y-0">
            <MetricRow
              label="Chargers needed"
              value={infrastructure.chargersNeeded}
              sub={`${infrastructure.chargerUtilization.toFixed(0)}% utilisation`}
            />
            <MetricRow
              label="Battery pool"
              value={`${infrastructure.batteryPool} packs`}
              sub={`${infrastructure.estimatedCyclesPerPackPerYear.toFixed(0)} cycles/pack/yr`}
            />
            <MetricRow
              label="Total capex"
              value={formatCurrency(capex.combined.total)}
              sub={`Platform ${formatCurrency(capex.platform.total)} · Battery ${formatCurrency(capex.battery.total)}`}
            />
          </div>
        </div>

      </div>

      {/* ── Footer: load button ───────────────────────────────────────── */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100">
        {isActive ? (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            Currently loaded
          </div>
        ) : (
          <button
            onClick={onLoad}
            className={clsx(
              'w-full flex items-center justify-center gap-2',
              'text-xs font-semibold text-white rounded-lg py-2.5 px-4 transition-all',
              theme.button,
            )}
          >
            Apply to workspace
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
