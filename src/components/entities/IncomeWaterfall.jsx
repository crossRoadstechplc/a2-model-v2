/**
 * IncomeWaterfall – visual income statement as horizontal bar rows.
 *
 * Each line item is drawn as:
 *   Label      $value    [████░░░░░░░] X% of revenue
 *
 * Bar width = |value| / baseRevenue × 100 — so revenue is always 100%.
 *
 * Line types:
 *   'revenue'  – entity's top line (full-width accent bar)
 *   'cost'     – cost item (red bar, value shown as negative)
 *   'deduct'   – same as cost, used below a subtotal (e.g. D&A)
 *   'subtotal' – intermediate total (slate/neutral bar)
 *   'total'    – final bottom line (accent bar, slightly bolder)
 *   'divider'  – a thin separator row (no bar)
 *
 * Props:
 *   lines        – array of { label, value, type, hint? }
 *   baseRevenue  – the entity's annual revenue (bar 100% reference)
 *   accentColor  – 'emerald' | 'blue' | 'amber' (entity brand)
 */

import clsx from 'clsx';
import { formatCurrency } from '../../lib/finance/format';

// ─── Bar colour mapping by type × accent ─────────────────────────────────────

const ACCENT_BAR = {
  emerald: 'bg-emerald-500',
  blue:    'bg-blue-500',
  amber:   'bg-amber-400',
};
const ACCENT_TEXT = {
  emerald: 'text-emerald-700',
  blue:    'text-blue-700',
  amber:   'text-amber-700',
};
const ACCENT_TOTAL_BG = {
  emerald: 'bg-emerald-50',
  blue:    'bg-blue-50',
  amber:   'bg-amber-50',
};

function barClass(type, accent) {
  if (type === 'revenue' || type === 'total')  return ACCENT_BAR[accent] ?? 'bg-slate-400';
  if (type === 'subtotal')                      return 'bg-slate-400';
  return 'bg-red-400';   // cost / deduct
}

function textClass(type, accent) {
  if (type === 'revenue' || type === 'total')  return ACCENT_TEXT[accent] ?? 'text-slate-700';
  if (type === 'subtotal')                     return 'text-slate-700';
  if (type === 'cost' || type === 'deduct')    return 'text-red-600';
  return 'text-slate-700';
}

function rowBg(type, accent) {
  if (type === 'total')    return ACCENT_TOTAL_BG[accent] ?? 'bg-slate-50';
  if (type === 'subtotal') return 'bg-slate-50';
  return '';
}

// ─── Divider row ──────────────────────────────────────────────────────────────

function DividerRow() {
  return (
    <tr>
      <td colSpan={4} className="py-0">
        <div className="border-t border-slate-100" />
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IncomeWaterfall({ lines, baseRevenue, accentColor = 'blue' }) {
  const base = Math.max(Math.abs(baseRevenue), 1);

  return (
    <table className="w-full text-xs">
      <colgroup>
        <col className="w-[38%]" />
        <col className="w-[24%]" />
        <col className="w-[32%]" />
        <col className="w-[6%]" />
      </colgroup>
      <tbody>
        {lines.map((line, i) => {
          if (line.type === 'divider') return <DividerRow key={i} />;

          const isCost     = line.type === 'cost' || line.type === 'deduct';
          const displayVal = isCost ? -Math.abs(line.value) : line.value;
          const barWidth   = Math.min(100, (Math.abs(line.value) / base) * 100);
          const pct        = ((Math.abs(line.value) / base) * 100).toFixed(0);
          const isTotal    = line.type === 'total' || line.type === 'subtotal';

          return (
            <tr
              key={i}
              className={clsx(
                'border-b border-slate-50',
                rowBg(line.type, accentColor),
              )}
            >
              {/* Label */}
              <td className={clsx(
                'pl-4 pr-2 py-2.5 leading-tight',
                isTotal ? 'font-semibold text-slate-800' : 'font-medium text-slate-600',
                line.type === 'cost' || line.type === 'deduct' ? 'pl-6' : '',
              )}>
                {/* Prefix operator */}
                {(line.type === 'cost' || line.type === 'deduct') && (
                  <span className="text-slate-400 mr-1.5">−</span>
                )}
                {(line.type === 'subtotal' || line.type === 'total') && (
                  <span className="text-slate-400 mr-1.5">=</span>
                )}
                {line.label}
                {line.hint && (
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">{line.hint}</p>
                )}
              </td>

              {/* Dollar value */}
              <td className={clsx(
                'pr-3 py-2.5 text-right tabular-nums whitespace-nowrap',
                isTotal ? 'font-bold text-sm' : 'font-semibold',
                textClass(line.type, accentColor),
                displayVal < 0 && line.type !== 'revenue' ? 'text-red-600' : '',
              )}>
                {typeof displayVal === 'number' && isFinite(displayVal)
                  ? formatCurrency(displayVal)
                  : '—'}
              </td>

              {/* Bar */}
              <td className="pr-3 py-2.5">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-500', barClass(line.type, accentColor))}
                    style={{ width: `${Math.max(1, barWidth)}%` }}
                  />
                </div>
              </td>

              {/* % share */}
              <td className={clsx(
                'pr-4 py-2.5 text-right tabular-nums text-[10px]',
                isCost ? 'text-red-400' : 'text-slate-400',
              )}>
                {pct}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
