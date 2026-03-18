/**
 * MetricCard – investor-grade KPI tile.
 *
 * Props:
 *   title       – metric label (e.g. "Total Revenue")
 *   value       – formatted display value (e.g. "$4.2M")
 *   sub         – secondary line (e.g. "Year 5 projection")
 *   delta       – optional change string (e.g. "+18% YoY"), coloured by sign
 *   icon        – optional Lucide icon component
 *   accentColor – Tailwind color key: 'blue' | 'emerald' | 'amber' | 'red' | 'slate'
 */

import clsx from 'clsx';

const ACCENT_MAP = {
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    border: 'border-blue-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',  border: 'border-amber-100' },
  red:     { bg: 'bg-red-50',     icon: 'bg-red-100 text-red-600',      border: 'border-red-100' },
  slate:   { bg: 'bg-slate-50',   icon: 'bg-slate-100 text-slate-600',  border: 'border-slate-200' },
};

export function MetricCard({ title, value, sub, delta, icon: Icon, accentColor = 'slate' }) {
  const accent = ACCENT_MAP[accentColor] ?? ACCENT_MAP.slate;

  // Determine delta colour
  const deltaIsPositive = delta && (delta.startsWith('+') || (!delta.startsWith('-') && !delta.startsWith('−')));
  const deltaIsNegative = delta && (delta.startsWith('-') || delta.startsWith('−'));

  return (
    <div
      className={clsx(
        'rounded-xl border p-5 flex flex-col gap-3',
        accent.bg,
        accent.border,
      )}
    >
      {/* Top row: title + icon */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">
          {title}
        </p>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', accent.icon)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main value */}
      <div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>

      {/* Delta badge */}
      {delta && (
        <span
          className={clsx(
            'self-start text-xs font-semibold px-2 py-0.5 rounded-full',
            deltaIsPositive && 'bg-emerald-100 text-emerald-700',
            deltaIsNegative && 'bg-red-100 text-red-600',
            !deltaIsPositive && !deltaIsNegative && 'bg-slate-100 text-slate-600',
          )}
        >
          {delta}
        </span>
      )}
    </div>
  );
}
