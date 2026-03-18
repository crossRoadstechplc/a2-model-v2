/**
 * CompactSlider – slim labelled range slider for the assumptions sidebar.
 *
 * Layout:
 *   [label]  [formatted value]
 *   [════════ track ════════]
 *   [min]               [max]
 *
 * Props:
 *   label       – field name
 *   hint        – muted helper text (optional)
 *   value       – controlled numeric value
 *   onChange    – (number) => void
 *   min         – slider minimum
 *   max         – slider maximum
 *   step        – slider step
 *   format      – (number) => string  display formatter (default: String)
 *   accentColor – 'blue' | 'emerald' | 'amber' | 'violet' | 'red'
 */

import clsx from 'clsx';

const ACCENT_MAP = {
  blue:    'accent-blue-500',
  emerald: 'accent-emerald-500',
  amber:   'accent-amber-500',
  violet:  'accent-violet-500',
  red:     'accent-red-500',
  slate:   'accent-slate-500',
};

export function CompactSlider({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = String,
  accentColor = 'blue',
}) {
  const accent = ACCENT_MAP[accentColor] ?? ACCENT_MAP.blue;

  return (
    <div className="py-2.5 border-b border-slate-50 last:border-0">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-medium text-slate-700 leading-tight">{label}</p>
        <span className="text-xs font-bold text-slate-800 tabular-nums ml-3 shrink-0">
          {format(value)}
        </span>
      </div>

      {/* Track */}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={clsx('w-full h-1 rounded-full appearance-none cursor-pointer', accent)}
      />

      {/* Min / max labels */}
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>

      {hint && (
        <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
      )}
    </div>
  );
}
