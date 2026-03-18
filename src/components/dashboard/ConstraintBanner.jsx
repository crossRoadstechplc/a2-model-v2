/**
 * ConstraintBanner – collapsible warning strip for operational constraints.
 *
 * States:
 *   ✓ All clear   → slim green strip, no expansion needed
 *   ⚠ Warnings    → amber/red strip with "N warnings" count, expands on click
 *                    to show full constraint details with severity icons
 *
 * Each expanded constraint row shows:
 *   • Severity badge (High / Medium)
 *   • Constraint code and message
 *   • Numeric detail (utilization %, cycle ratio, etc.)
 *
 * Props:
 *   constraints  – snapshot.constraints from runScenario output
 */

import { useState } from 'react';
import clsx from 'clsx';
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Zap,
  BarChart3,
  BatteryCharging,
  TrendingDown,
  CircleDot,
} from 'lucide-react';

// ─── Constraint icon map ──────────────────────────────────────────────────────

const CONSTRAINT_ICON = {
  CHARGING_BOTTLENECK: Zap,
  BAY_CONGESTION:      BarChart3,
  BATTERY_STRESS:      BatteryCharging,
  LOW_FLEET_IRR:       TrendingDown,
  PRICING_UNSOLVED:    CircleDot,
};

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const cls = severity === 'high'
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700';
  return (
    <span className={clsx('text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded', cls)}>
      {severity}
    </span>
  );
}

// ─── Expanded constraint row ──────────────────────────────────────────────────

function ConstraintRow({ constraint }) {
  const Icon = CONSTRAINT_ICON[constraint.code] ?? CircleDot;
  const isHigh = constraint.severity === 'high';

  return (
    <div className={clsx(
      'flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-0',
      isHigh ? 'bg-red-50/50' : 'bg-amber-50/50',
    )}>
      {/* Icon */}
      <div className={clsx(
        'w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5',
        isHigh ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
      )}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <SeverityBadge severity={constraint.severity} />
          <span className="text-[10px] font-mono text-slate-400">{constraint.code}</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">{constraint.message}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConstraintBanner({ constraints }) {
  const [expanded, setExpanded] = useState(false);

  if (!constraints) return null;

  const { warnings = [], hasWarnings, hasHighSeverity, warningCount = 0 } = constraints;

  // ── All clear state ──────────────────────────────────────────────────────
  if (!hasWarnings) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs font-semibold text-emerald-700">
          No active constraints — all operational parameters within safe thresholds
        </p>
      </div>
    );
  }

  // ── Warning state ────────────────────────────────────────────────────────
  const highCount   = warnings.filter((w) => w.severity === 'high').length;
  const mediumCount = warnings.filter((w) => w.severity === 'medium').length;

  const stripBg     = hasHighSeverity ? 'bg-red-50'   : 'bg-amber-50';
  const stripBorder = hasHighSeverity ? 'border-red-200'   : 'border-amber-200';
  const icon_       = hasHighSeverity ? 'text-red-600'     : 'text-amber-600';
  const textColor   = hasHighSeverity ? 'text-red-800'     : 'text-amber-800';
  const subColor    = hasHighSeverity ? 'text-red-600/70'  : 'text-amber-600/70';
  const countBg     = hasHighSeverity ? 'bg-red-100 text-red-700'   : 'bg-amber-100 text-amber-700';

  return (
    <div className={clsx('rounded-xl border overflow-hidden', stripBg, stripBorder)}>

      {/* ── Header strip (always visible) ──────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-black/5',
        )}
      >
        <AlertTriangle className={clsx('w-4 h-4 shrink-0', icon_)} />

        <div className="flex-1 min-w-0">
          <p className={clsx('text-xs font-semibold leading-tight', textColor)}>
            {warningCount} constraint{warningCount !== 1 ? 's' : ''} detected
          </p>
          <p className={clsx('text-[11px] leading-tight mt-0.5', subColor)}>
            {highCount > 0   && `${highCount} high severity`}
            {highCount > 0 && mediumCount > 0 && ' · '}
            {mediumCount > 0 && `${mediumCount} medium severity`}
            {' — click to '}{expanded ? 'collapse' : 'view details'}
          </p>
        </div>

        {/* Severity summary badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {highCount > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {mediumCount} Med
            </span>
          )}
        </div>

        <ChevronDown
          className={clsx(
            'w-4 h-4 shrink-0 transition-transform duration-200',
            icon_,
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* ── Expanded constraint list ─────────────────────────────────── */}
      <div
        className={clsx(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[600px]' : 'max-h-0',
        )}
      >
        <div className="border-t border-current/10">
          {warnings.map((c) => (
            <ConstraintRow key={c.code} constraint={c} />
          ))}
        </div>
      </div>

    </div>
  );
}
