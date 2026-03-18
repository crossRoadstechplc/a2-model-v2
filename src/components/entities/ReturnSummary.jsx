/**
 * ReturnSummary – investment returns and capital metrics panel.
 *
 * Shows IRR (with vs-target badge), NPV, payback period, EBITDA margin,
 * capex, implied yield, and simple capital structure.
 *
 * Props:
 *   company     – entity data from snapshot (irr, npv, payback, capex, annualEBITDA, etc.)
 *   targetIRR   – hurdle rate for this entity (fraction, e.g. 0.18)
 *   accentColor – 'emerald' | 'blue' | 'amber'
 *   projectionYears – number
 */

import clsx from 'clsx';
import {
  TrendingUp,
  DollarSign,
  Clock,
  BarChart2,
  Target,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '../../lib/finance/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safe(v, fallback = 0) {
  return (typeof v === 'number' && isFinite(v) && !isNaN(v)) ? v : fallback;
}

function fmtIRR(v) {
  if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return '—';
  if (v > 9.99) return '>999%';
  return formatPercent(v * 100, { decimals: 1 });
}

function irrBadge(actual, target) {
  if (actual === null || !isFinite(actual) || isNaN(actual)) {
    return { text: 'No solution', cls: 'bg-slate-100 text-slate-500' };
  }
  if (!target) return null;
  const diff = actual - target;
  if (diff >= 0)        return { text: `+${(diff * 100).toFixed(1)}pp vs target`, cls: 'bg-emerald-100 text-emerald-700' };
  if (diff >= -0.03)    return { text: `${(diff * 100).toFixed(1)}pp vs target`, cls: 'bg-amber-100 text-amber-700' };
  return { text: `${(diff * 100).toFixed(1)}pp vs target`, cls: 'bg-red-100 text-red-700' };
}

function fmtPayback(v) {
  if (v === null || !isFinite(v) || isNaN(v)) return '—';
  if (v >= 999) return '> horizon';
  return `${v.toFixed(1)} yrs`;
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ icon: Icon, label, value, valueClass, sub, badge }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className={clsx('text-sm font-bold tabular-nums', valueClass ?? 'text-slate-900')}>
            {value}
          </p>
          {badge && (
            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', badge.cls)}>
              {badge.text}
            </span>
          )}
        </div>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHead({ label }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-3 pb-1">
      {label}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReturnSummary({ company, targetIRR, accentColor = 'blue', projectionYears }) {
  if (!company) return null;

  const {
    irr, npv, payback,
    annualEBITDA, ebitdaMargin,
    capex, annualRevenue,
  } = company;

  // IRR colour for display
  const irrActual   = safe(irr, null);
  const badge       = irrBadge(irrActual, targetIRR);

  const irrPositive = irrActual !== null && irrActual >= (targetIRR ?? 0);
  const irrNear     = irrActual !== null && irrActual >= (targetIRR ?? 0) * 0.9 && !irrPositive;

  const irrValueCls = irrPositive
    ? { emerald: 'text-emerald-700', blue: 'text-blue-700', amber: 'text-amber-700' }[accentColor]
    : irrNear
      ? 'text-amber-700'
      : 'text-red-600';

  // Yield: EBITDA / capex
  const impliedYield = capex > 0 ? safe(annualEBITDA) / safe(capex) : null;

  // NPV interpretation
  const npvPositive = safe(npv) >= 0;

  return (
    <div className="h-full flex flex-col">

      {/* ── Investment Returns ─────────────────────────────────────────── */}
      <SectionHead label="Investment Returns" />

      <MetricRow
        icon={Target}
        label="Internal Rate of Return (IRR)"
        value={fmtIRR(irr)}
        valueClass={irrValueCls}
        sub={targetIRR ? `Target: ${formatPercent(targetIRR * 100, { decimals: 0 })}` : 'No target set'}
        badge={badge}
      />

      <MetricRow
        icon={TrendingUp}
        label={`Net Present Value (NPV)`}
        value={formatCurrency(safe(npv))}
        valueClass={npvPositive ? 'text-slate-900' : 'text-red-600'}
        sub={`At ${formatPercent((targetIRR ?? 0.12) * 100, { decimals: 0 })} discount rate`}
      />

      <MetricRow
        icon={Clock}
        label="Payback Period"
        value={fmtPayback(payback)}
        sub={projectionYears ? `${projectionYears}-year projection horizon` : undefined}
      />

      {/* ── P&L Summary ───────────────────────────────────────────────── */}
      <SectionHead label="P&L Summary" />

      <MetricRow
        icon={BarChart2}
        label="Annual EBITDA"
        value={formatCurrency(safe(annualEBITDA))}
        valueClass={safe(annualEBITDA) >= 0 ? 'text-slate-900' : 'text-red-600'}
        sub={`${formatPercent(safe(ebitdaMargin), { decimals: 1 })} EBITDA margin`}
      />

      {impliedYield !== null && (
        <MetricRow
          icon={Layers}
          label="EBITDA / Capex (Cash Yield)"
          value={formatPercent(impliedYield * 100, { decimals: 1 })}
          sub="Unlevered cash yield on invested capital"
        />
      )}

      {/* ── Capital Structure ──────────────────────────────────────────── */}
      <SectionHead label="Capital Structure" />

      <MetricRow
        icon={DollarSign}
        label="Total Capex (Equity Deployed)"
        value={formatCurrency(safe(capex))}
        sub="100% equity · no debt modelled"
      />

      <MetricRow
        icon={DollarSign}
        label="Annual Revenue"
        value={formatCurrency(safe(annualRevenue))}
        sub="Year 1 steady-state"
      />

    </div>
  );
}
