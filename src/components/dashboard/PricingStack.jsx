/**
 * PricingStack – energy cost decomposition and viability display.
 *
 * ── Left panel: Cost per kWh waterfall ────────────────────────────────────
 * Shows how the total energy cost is built up from three components:
 *   Electricity   (grid cost paid by Platform)
 *   Battery lease (per-kWh lease from Battery Co.)
 *   Platform fee  (per-kWh infrastructure fee from Platform Co.)
 *
 * Each component row shows:
 *   • Colour-coded horizontal bar (width proportional to share of total)
 *   • Dollar value ($X.XX/kWh)
 *   • Percentage share of total cost
 *
 * ── Right panel: Per-km viability ─────────────────────────────────────────
 * Compares total electric cost per km against diesel baseline.
 *   Electric cost/km  =  totalCostPerKwh × kwhPerTruckPerDay / kmPerTruckPerDay
 *   Diesel cost/km    =  system.dieselCostPerKm (baseline assumption)
 *
 * Viability verdict: Viable / Marginal / Not Viable
 *
 * Props:
 *   snapshot  – results.snapshot from Zustand (pricing + viability slices)
 */

import clsx from 'clsx';
import {
  Zap,
  BatteryCharging,
  Building2,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function safe(v, fallback = 0) {
  return (typeof v === 'number' && isFinite(v) && !isNaN(v)) ? v : fallback;
}

function fmtKwh(v) {
  const n = safe(v);
  return `$${Math.abs(n).toFixed(3)}/kWh`;
}

function fmtKm(v) {
  const n = safe(v);
  return `$${Math.abs(n).toFixed(3)}/km`;
}

function fmtPct(v) {
  return `${safe(v).toFixed(1)}%`;
}

// ─── Cost bar row ─────────────────────────────────────────────────────────────

function CostBarRow({ icon: Icon, label, sublabel, value, totalValue, barColor, textColor }) {
  const pct    = totalValue > 0 ? (value / totalValue) * 100 : 0;
  const barPct = Math.max(2, Math.min(100, pct)); // min visible bar width

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      {/* Icon */}
      <div className={clsx('w-7 h-7 rounded-md flex items-center justify-center shrink-0', barColor.iconBg)}>
        <Icon className={clsx('w-3.5 h-3.5', barColor.iconText)} />
      </div>

      {/* Label */}
      <div className="w-28 shrink-0">
        <p className="text-xs font-semibold text-slate-700 leading-tight">{label}</p>
        <p className="text-[10px] text-slate-400 leading-tight">{sublabel}</p>
      </div>

      {/* Bar track */}
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColor.fill)}
          style={{ width: `${barPct}%` }}
        />
      </div>

      {/* Value */}
      <div className="text-right shrink-0 w-24">
        <p className={clsx('text-sm font-bold tabular-nums', textColor)}>{fmtKwh(value)}</p>
        <p className="text-[10px] text-slate-400 tabular-nums">{fmtPct(pct)} of total</p>
      </div>
    </div>
  );
}

// ─── Total row ────────────────────────────────────────────────────────────────

function TotalRow({ totalCostPerKwh }) {
  return (
    <div className="flex items-center gap-3 pt-3 mt-1 border-t-2 border-slate-200">
      <div className="w-7 shrink-0" />
      <div className="w-28 shrink-0">
        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Total</p>
      </div>
      <div className="flex-1 h-2 bg-slate-200 rounded-full">
        <div className="h-full w-full bg-slate-400 rounded-full" />
      </div>
      <div className="text-right shrink-0 w-24">
        <p className="text-base font-extrabold text-slate-900 tabular-nums">
          {fmtKwh(totalCostPerKwh)}
        </p>
      </div>
    </div>
  );
}

// ─── Per-km comparison row ────────────────────────────────────────────────────

function KmRow({ label, value, maxValue, barColor, valueClass, icon: Icon, iconClass }) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className={clsx('w-5 h-5 shrink-0 flex items-center justify-center', iconClass)}>
        {Icon && <Icon className="w-4 h-4" />}
      </div>
      <div className="w-28 shrink-0">
        <p className="text-xs font-medium text-slate-600 leading-tight">{label}</p>
      </div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <p className={clsx('text-sm font-bold tabular-nums shrink-0 w-20 text-right', valueClass)}>
        {fmtKm(value)}
      </p>
    </div>
  );
}

// ─── Viability verdict badge ──────────────────────────────────────────────────

function ViabilityVerdict({ label, savingsPerKm, savingsPercent, annualSavingsPerTruck }) {
  const cfg = {
    'Viable':     {
      icon: CheckCircle2,
      bg: 'bg-emerald-50', border: 'border-emerald-200',
      icon_: 'text-emerald-600', text: 'text-emerald-700',
      badge: 'bg-emerald-500',
    },
    'Marginal':   {
      icon: MinusCircle,
      bg: 'bg-amber-50',   border: 'border-amber-200',
      icon_: 'text-amber-600',   text: 'text-amber-700',
      badge: 'bg-amber-400',
    },
    'Not Viable': {
      icon: AlertCircle,
      bg: 'bg-red-50',     border: 'border-red-200',
      icon_: 'text-red-500',     text: 'text-red-700',
      badge: 'bg-red-500',
    },
  }[label] ?? {
    icon: MinusCircle,
    bg: 'bg-slate-50', border: 'border-slate-200',
    icon_: 'text-slate-400', text: 'text-slate-600',
    badge: 'bg-slate-400',
  };

  const Icon = cfg.icon;
  const savingsIsPositive = savingsPerKm > 0;

  return (
    <div className={clsx('rounded-xl border p-4 mt-1', cfg.bg, cfg.border)}>
      {/* Verdict row */}
      <div className="flex items-center gap-2.5 mb-3">
        <Icon className={clsx('w-5 h-5 shrink-0', cfg.icon_)} />
        <div>
          <p className={clsx('text-sm font-bold leading-tight', cfg.text)}>{label}</p>
          <p className="text-[11px] text-slate-500 leading-tight">
            vs diesel baseline
          </p>
        </div>
        <div className={clsx('ml-auto px-2.5 py-1 rounded-full text-white text-[11px] font-bold', cfg.badge)}>
          {savingsIsPositive
            ? `${savingsPercent.toFixed(1)}% cheaper`
            : `${Math.abs(savingsPercent).toFixed(1)}% costlier`}
        </div>
      </div>

      {/* Savings details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500 mb-0.5">Savings / km</p>
          <p className={clsx(
            'text-base font-extrabold tabular-nums',
            savingsIsPositive ? 'text-emerald-600' : 'text-red-500',
          )}>
            {savingsIsPositive ? '+' : ''}{fmtKm(savingsPerKm)}
          </p>
        </div>
        <div className="bg-white/60 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500 mb-0.5">Savings / truck / yr</p>
          <p className={clsx(
            'text-sm font-bold tabular-nums',
            savingsIsPositive ? 'text-emerald-600' : 'text-red-500',
          )}>
            {typeof annualSavingsPerTruck === 'number' && isFinite(annualSavingsPerTruck)
              ? (annualSavingsPerTruck >= 0 ? '+' : '') +
                '$' + Math.abs(annualSavingsPerTruck).toLocaleString('en-US', { maximumFractionDigits: 0 })
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const COST_ROWS = [
  {
    key: 'electricityCostPerKwh',
    label: 'Electricity',
    sublabel: 'Grid cost · Platform pays',
    icon: Zap,
    barColor: {
      fill:     'bg-yellow-400',
      iconBg:   'bg-yellow-50',
      iconText: 'text-yellow-600',
    },
    textColor: 'text-yellow-700',
  },
  {
    key: 'batteryLeasePerKwh',
    label: 'Battery Lease',
    sublabel: 'Battery Co. IRR recovery',
    icon: BatteryCharging,
    barColor: {
      fill:     'bg-emerald-500',
      iconBg:   'bg-emerald-50',
      iconText: 'text-emerald-600',
    },
    textColor: 'text-emerald-700',
  },
  {
    key: 'platformFeePerKwh',
    label: 'Platform Fee',
    sublabel: 'Platform Co. IRR recovery',
    icon: Building2,
    barColor: {
      fill:     'bg-blue-500',
      iconBg:   'bg-blue-50',
      iconText: 'text-blue-600',
    },
    textColor: 'text-blue-700',
  },
];

export function PricingStack({ snapshot }) {
  if (!snapshot) return null;

  const { pricing, viability } = snapshot;
  if (!pricing || !viability) return null;

  const totalCostPerKwh  = safe(pricing.totalCostPerKwh);
  const electricCostPerKm = safe(viability.electricCostPerKm);
  const dieselCostPerKm   = safe(viability.dieselCostPerKm);
  const savingsPerKm      = safe(viability.savingsPerKm);
  const savingsPercent    = safe(viability.savingsPercent);
  const viabilityLabel    = viability.label ?? '—';
  const annualSavingsPerTruck = viability.annualSavingsPerTruck;

  // For per-km bars: scale both to the larger of the two
  const maxKmCost = Math.max(electricCostPerKm, dieselCostPerKm, 0.001);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

      {/* ── Left: $/kWh cost stack (3 cols) ──────────────────────────── */}
      <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Energy Pricing Stack</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cost decomposition per kWh delivered to fleet
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs font-bold tabular-nums">{fmtKwh(totalCostPerKwh)}</span>
          </div>
        </div>

        {/* Component rows */}
        <div>
          {COST_ROWS.map((row) => (
            <CostBarRow
              key={row.key}
              icon={row.icon}
              label={row.label}
              sublabel={row.sublabel}
              value={safe(pricing[row.key])}
              totalValue={totalCostPerKwh}
              barColor={row.barColor}
              textColor={row.textColor}
            />
          ))}

          <TotalRow totalCostPerKwh={totalCostPerKwh} />
        </div>

        {/* Monthly per-truck cost equivalents */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
          {[
            { label: 'Electricity / truck / mo', value: pricing.electricityPerTruckMonth },
            { label: 'Battery lease / truck / mo', value: pricing.batteryLeasePerTruckMonth },
            { label: 'Platform fee / truck / mo',  value: pricing.platformFeePerTruckMonth },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-500 leading-tight mb-1">{item.label}</p>
              <p className="text-sm font-bold text-slate-800 tabular-nums">
                {typeof item.value === 'number' && isFinite(item.value)
                  ? '$' + Math.round(item.value).toLocaleString('en-US')
                  : '—'}
                <span className="text-[10px] font-normal text-slate-400">/mo</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: $/km comparison + viability (2 cols) ───────────────── */}
      <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">vs. Diesel Baseline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cost per km per truck
          </p>
        </div>

        {/* Per-km bars */}
        <div className="flex-1">
          <KmRow
            label="Electric / km"
            value={electricCostPerKm}
            maxValue={maxKmCost}
            barColor="bg-blue-500"
            valueClass="text-blue-700"
            icon={Zap}
            iconClass="text-blue-400"
          />
          <KmRow
            label="Diesel / km"
            value={dieselCostPerKm}
            maxValue={maxKmCost}
            barColor="bg-amber-400"
            valueClass="text-amber-700"
            icon={TrendingDown}
            iconClass="text-amber-400"
          />
        </div>

        {/* Cost multiple callout */}
        {electricCostPerKm > 0 && dieselCostPerKm > 0 && (
          <div className="my-3 bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-600">
              Electric is{' '}
              <span className={clsx(
                'font-bold',
                electricCostPerKm <= dieselCostPerKm ? 'text-emerald-600' : 'text-red-500',
              )}>
                {(electricCostPerKm / dieselCostPerKm).toFixed(2)}×
              </span>
              {' '}the diesel cost per km
            </p>
          </div>
        )}

        {/* Viability verdict */}
        <ViabilityVerdict
          label={viabilityLabel}
          savingsPerKm={savingsPerKm}
          savingsPercent={savingsPercent}
          annualSavingsPerTruck={annualSavingsPerTruck}
        />
      </div>
    </div>
  );
}
