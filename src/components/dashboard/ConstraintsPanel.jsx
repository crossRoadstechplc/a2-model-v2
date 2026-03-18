/**
 * ConstraintsPanel – detailed constraint health board.
 *
 * Shows ALL five system constraints as individual cards, whether triggered or
 * not. Investors can see the full checklist at a glance:
 *
 *   ● CHARGING_BOTTLENECK  – charger utilization vs 85% threshold
 *   ● BAY_CONGESTION       – bay utilization vs 80% threshold
 *   ● BATTERY_STRESS       – actual cycles/yr vs rated cycles/yr
 *   ● LOW_FLEET_IRR        – fleet IRR vs 10% hurdle
 *   ● PRICING_UNSOLVED     – solver convergence status
 *
 * Green = OK (not triggered), Amber = medium warning, Red = high severity.
 *
 * When no constraints are triggered the panel shows a calm "All Clear" state.
 * When constraints are triggered each card expands to show the model detail.
 *
 * Props:
 *   constraints – snapshot.constraints (full output of computeConstraints)
 */

import clsx from 'clsx';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  BarChart3,
  BatteryCharging,
  TrendingDown,
  CircleDot,
  ShieldCheck,
} from 'lucide-react';

// ─── Static constraint metadata ───────────────────────────────────────────────
// Maps each constraint code to its display name, icon, and detail formatter.

const META = {
  CHARGING_BOTTLENECK: {
    label:       'Charger Utilization',
    description: 'Triggered when charger utilization exceeds 85%',
    icon:        Zap,
    severity:    'high',
    formatDetail: (d) =>
      d
        ? `${d.chargerUtilization.toFixed(1)}% utilization · threshold ${d.threshold}% · ${d.chargersNeeded} chargers deployed`
        : null,
  },
  BAY_CONGESTION: {
    label:       'Swap Bay Congestion',
    description: 'Triggered when bay utilization exceeds 80%',
    icon:        BarChart3,
    severity:    'medium',
    formatDetail: (d) =>
      d
        ? `${d.bayUtilization.toFixed(1)}% utilization · threshold ${d.threshold}% · ${d.baysNeeded} bays deployed`
        : null,
  },
  BATTERY_STRESS: {
    label:       'Battery Cycle Stress',
    description: 'Triggered when packs cycle faster than their rated pace',
    icon:        BatteryCharging,
    severity:    'high',
    formatDetail: (d) =>
      d
        ? `${Math.round(d.estimatedCyclesPerPackPerYear)} actual cycles/yr · ` +
          `${Math.round(d.ratedCyclesPerYear)} rated · ` +
          `${(d.cycleRatio * 100).toFixed(0)}% of rated pace`
        : null,
  },
  LOW_FLEET_IRR: {
    label:       'Fleet Return',
    description: 'Triggered when Fleet IRR falls below 10%',
    icon:        TrendingDown,
    severity:    'medium',
    formatDetail: (d) =>
      d
        ? `Fleet IRR: ${d.fleetIRR !== null ? (d.fleetIRR * 100).toFixed(1) + '%' : 'N/A'} · hurdle: ${(d.threshold * 100).toFixed(0)}%`
        : null,
  },
  PRICING_UNSOLVED: {
    label:       'Pricing Solver',
    description: 'Triggered when the price solver fails to converge',
    icon:        CircleDot,
    severity:    'high',
    formatDetail: (d) =>
      d
        ? `Battery solver: ${d.batteryFound ? '✓ converged' : '✗ failed'} · Platform solver: ${d.platformFound ? '✓ converged' : '✗ failed'}`
        : null,
  },
};

const CONSTRAINT_ORDER = [
  'CHARGING_BOTTLENECK',
  'BAY_CONGESTION',
  'BATTERY_STRESS',
  'LOW_FLEET_IRR',
  'PRICING_UNSOLVED',
];

// ─── Colour palette by state ──────────────────────────────────────────────────

function cardTheme(triggered, severity) {
  if (!triggered) {
    return {
      border:     'border-slate-200',
      bg:         'bg-white',
      iconBg:     'bg-emerald-50',
      iconColor:  'text-emerald-600',
      badge:      'bg-emerald-100 text-emerald-700',
      badgeLabel: 'OK',
      dot:        'bg-emerald-500',
      valueColor: 'text-slate-700',
      msgColor:   'text-slate-500',
    };
  }
  if (severity === 'high') {
    return {
      border:     'border-red-200',
      bg:         'bg-red-50',
      iconBg:     'bg-red-100',
      iconColor:  'text-red-600',
      badge:      'bg-red-100 text-red-700',
      badgeLabel: 'CRITICAL',
      dot:        'bg-red-500',
      valueColor: 'text-red-700',
      msgColor:   'text-red-700/80',
    };
  }
  return {
    border:     'border-amber-200',
    bg:         'bg-amber-50',
    iconBg:     'bg-amber-100',
    iconColor:  'text-amber-600',
    badge:      'bg-amber-100 text-amber-700',
    badgeLabel: 'WARNING',
    dot:        'bg-amber-400',
    valueColor: 'text-amber-700',
    msgColor:   'text-amber-700/80',
  };
}

// ─── Single constraint card ───────────────────────────────────────────────────

function ConstraintCard({ constraint }) {
  const { code, triggered, severity, message, detail } = constraint;
  const meta   = META[code] ?? { label: code, icon: CircleDot, formatDetail: () => null };
  const theme  = cardTheme(triggered, severity);
  const Icon   = meta.icon;
  const detail_ = meta.formatDetail(detail);

  return (
    <div className={clsx('rounded-xl border p-4 flex flex-col gap-2', theme.bg, theme.border)}>

      {/* Row 1: icon · label · badge */}
      <div className="flex items-start gap-3">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', theme.iconBg)}>
          <Icon className={clsx('w-4 h-4', theme.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
              {meta.label}
            </p>
            <span className={clsx(
              'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide',
              theme.badge,
            )}>
              {theme.badgeLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{meta.description}</p>
        </div>
      </div>

      {/* Row 2: live detail metric */}
      {detail_ && (
        <p className={clsx('text-[11px] tabular-nums font-medium pl-11', theme.valueColor)}>
          {detail_}
        </p>
      )}

      {/* Row 3: message (only when triggered) */}
      {triggered && message && (
        <p className={clsx('text-[11px] leading-relaxed pl-11 border-t pt-2 mt-0.5', theme.msgColor,
          severity === 'high' ? 'border-red-100' : 'border-amber-100'
        )}>
          {message}
        </p>
      )}
    </div>
  );
}

// ─── All-clear state ──────────────────────────────────────────────────────────

function AllClearState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
        <ShieldCheck className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-emerald-700">All constraints clear</p>
        <p className="text-xs text-slate-500 mt-0.5">
          All five operational checks are within safe thresholds
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConstraintsPanel({ constraints }) {
  if (!constraints) return null;

  const { hasWarnings, hasHighSeverity, warningCount } = constraints;

  // Build constraint array in display order
  const items = CONSTRAINT_ORDER.map((code) => constraints[
    {
      CHARGING_BOTTLENECK: 'chargingBottleneck',
      BAY_CONGESTION:      'bayCongestion',
      BATTERY_STRESS:      'batteryStress',
      LOW_FLEET_IRR:       'lowFleetReturn',
      PRICING_UNSOLVED:    'pricingUnsolved',
    }[code]
  ]).filter(Boolean);

  // Header badge
  const headerBadge = !hasWarnings
    ? { text: 'All clear', cls: 'bg-emerald-100 text-emerald-700' }
    : hasHighSeverity
      ? { text: `${warningCount} active · high severity`, cls: 'bg-red-100 text-red-700' }
      : { text: `${warningCount} active · medium severity`, cls: 'bg-amber-100 text-amber-700' };

  const StatusIcon = !hasWarnings
    ? CheckCircle2
    : hasHighSeverity
      ? XCircle
      : AlertTriangle;

  const statusIconColor = !hasWarnings
    ? 'text-emerald-500'
    : hasHighSeverity
      ? 'text-red-500'
      : 'text-amber-500';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <StatusIcon className={clsx('w-4 h-4', statusIconColor)} />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">System Constraints</h3>
            <p className="text-xs text-slate-500">5 operational checks evaluated by the model</p>
          </div>
        </div>
        <span className={clsx('text-[11px] font-bold px-2.5 py-1 rounded-full', headerBadge.cls)}>
          {headerBadge.text}
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="p-5">
        {!hasWarnings ? (
          <AllClearState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((c) => (
              <ConstraintCard key={c.code} constraint={c} />
            ))}
          </div>
        )}

        {/* When there are warnings, also show the OK ones below as a compact list */}
        {hasWarnings && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Checks passing
            </p>
            <div className="flex flex-wrap gap-2">
              {items.filter((c) => !c.triggered).map((c) => {
                const meta = META[c.code] ?? {};
                const Icon = meta.icon ?? CircleDot;
                return (
                  <div
                    key={c.code}
                    className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <Icon className="w-3 h-3 text-emerald-600" />
                    <span className="text-[11px] font-medium text-emerald-700">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
