/**
 * CashFlowSchedule – annual cash flow table with cumulative tracking.
 *
 * Shows a clean table for the engine's `cashFlows` array:
 *   Year 0:   -capex  (equity deployed)
 *   Year 1-N: annual EBITDA (steady-state, flat)
 *
 * Columns:
 *   Period | Cash Flow | Cumulative CF | Progress bar
 *
 * Visual logic:
 *   • Year 0 row always has a red/slate background (investment outflow)
 *   • Any row where cumulative turns positive is highlighted as "Breakeven"
 *   • Cumulative CF cells are green when ≥ 0, red when < 0
 *   • Progress bar spans from -capex to +cumulative, centred at 0
 *
 * Props:
 *   cashFlows      – array from entityFinancials: [-capex, ebitda, ebitda, …]
 *   payback        – fractional payback from finance/payback.js
 *   accentColor    – 'emerald' | 'blue' | 'amber'
 */

import clsx from 'clsx';
import { formatCurrency } from '../../lib/finance/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT_BAR = {
  emerald: 'bg-emerald-400',
  blue:    'bg-blue-400',
  amber:   'bg-amber-400',
};

function fmt(v) {
  if (typeof v !== 'number' || !isFinite(v)) return '—';
  return formatCurrency(v);
}

function fmtPayback(v) {
  if (v === null || !isFinite(v)) return null;
  if (v >= 999) return 'Beyond horizon';
  return `${v.toFixed(1)} years`;
}

// ─── Progress bar centred at zero ─────────────────────────────────────────────
// max bar extent = max(|cumulative|) across all periods

function ProgressBar({ cumulative, maxAbs, accentColor }) {
  const pct     = Math.min(100, (Math.abs(cumulative) / Math.max(maxAbs, 1)) * 100);
  const isPos   = cumulative >= 0;
  const barCls  = isPos ? (ACCENT_BAR[accentColor] ?? 'bg-slate-400') : 'bg-red-300';

  // Negative bars grow from right edge, positive from centre
  return (
    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
      {isPos ? (
        // Green bar from left (breakeven visual)
        <div
          className={clsx('absolute inset-y-0 left-0 rounded-full', barCls)}
          style={{ width: `${pct}%` }}
        />
      ) : (
        // Red bar from right edge (deficit)
        <div
          className="absolute inset-y-0 right-0 rounded-full bg-red-300"
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CashFlowSchedule({ cashFlows, payback, accentColor = 'blue' }) {
  if (!cashFlows?.length) return null;

  // Build cumulative array
  const cumulative = [];
  let running = 0;
  cashFlows.forEach((cf) => {
    running += cf;
    cumulative.push(running);
  });

  // Max absolute cumulative for bar sizing
  const maxAbs = Math.max(...cumulative.map(Math.abs), 1);

  // Find the first period where cumulative turns positive
  const breakEvenIdx = cumulative.findIndex((c) => c >= 0);

  return (
    <div>
      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left pl-4 pr-2 py-2.5 font-semibold text-slate-500 uppercase tracking-wide w-28">
                Period
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide w-28">
                Cash Flow
              </th>
              <th className="text-right px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide w-28">
                Cumulative
              </th>
              <th className="px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">
                Progress
              </th>
              <th className="text-right pr-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wide w-24">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {cashFlows.map((cf, i) => {
              const cum        = cumulative[i];
              const isYearZero = i === 0;
              const isBreakEven= i === breakEvenIdx && breakEvenIdx > 0;
              const cumPos     = cum >= 0;

              return (
                <tr
                  key={i}
                  className={clsx(
                    'border-b border-slate-50 transition-colors',
                    isYearZero  && 'bg-slate-50/70',
                    isBreakEven && 'bg-emerald-50',
                    !isYearZero && !isBreakEven && 'hover:bg-slate-50/50',
                  )}
                >
                  {/* Period */}
                  <td className="pl-4 pr-2 py-2.5 text-slate-700 font-medium whitespace-nowrap">
                    {isYearZero ? 'Equity Deployed' : `Year ${i}`}
                  </td>

                  {/* Cash flow */}
                  <td className={clsx(
                    'text-right px-3 py-2.5 tabular-nums font-semibold whitespace-nowrap',
                    cf >= 0 ? 'text-slate-800' : 'text-red-600',
                  )}>
                    {cf >= 0 && i > 0 && <span className="text-slate-400 mr-0.5">+</span>}
                    {fmt(cf)}
                  </td>

                  {/* Cumulative */}
                  <td className={clsx(
                    'text-right px-3 py-2.5 tabular-nums font-bold whitespace-nowrap',
                    cumPos ? 'text-emerald-700' : 'text-red-600',
                  )}>
                    {cumPos && !isYearZero && <span className="text-emerald-500 mr-0.5">+</span>}
                    {fmt(cum)}
                  </td>

                  {/* Progress bar */}
                  <td className="px-4 py-2.5">
                    <ProgressBar
                      cumulative={cum}
                      maxAbs={maxAbs}
                      accentColor={accentColor}
                    />
                  </td>

                  {/* Status tag */}
                  <td className="text-right pr-4 py-2.5">
                    {isYearZero && (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        OUTFLOW
                      </span>
                    )}
                    {isBreakEven && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                        BREAKEVEN
                      </span>
                    )}
                    {!isYearZero && !isBreakEven && cumPos && (
                      <span className="text-[10px] font-semibold text-emerald-500">
                        ●
                      </span>
                    )}
                    {!isYearZero && !isBreakEven && !cumPos && (
                      <span className="text-[10px] font-semibold text-red-400">
                        ●
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Payback summary line ──────────────────────────────────────────── */}
      {fmtPayback(payback) && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Interpolated payback period
          </p>
          <p className={clsx(
            'text-xs font-bold',
            payback <= 3 ? 'text-emerald-700' : payback <= 5 ? 'text-amber-700' : 'text-red-600',
          )}>
            {fmtPayback(payback)}
          </p>
        </div>
      )}
    </div>
  );
}
