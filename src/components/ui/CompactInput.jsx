/**
 * CompactInput – slim two-column number field for the assumptions sidebar.
 *
 * Layout: [label + hint]  [prefix · input · suffix]
 *
 * Props:
 *   label       – field name
 *   hint        – muted helper text (optional)
 *   value       – controlled numeric value
 *   onChange    – (number) => void
 *   prefix      – decorative left text e.g. "$"
 *   suffix      – decorative right text e.g. "/kWh"
 *   min         – minimum allowed value (default 0 — guards against negatives)
 *   max         – maximum allowed value
 *   step        – input step increment
 *   inputWidth  – Tailwind width class for the input (default "w-20")
 */

import clsx from 'clsx';

export function CompactInput({
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
  inputWidth = 'w-20',
}) {
  function handleChange(e) {
    const raw = parseFloat(e.target.value);
    if (isNaN(raw)) return;
    // Guard: clamp to [min, max]
    const clamped = Math.max(min, max !== undefined ? Math.min(max, raw) : raw);
    onChange(clamped);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
      {/* Label column */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-700 leading-tight truncate">
          {label}
        </p>
        {hint && (
          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
            {hint}
          </p>
        )}
      </div>

      {/* Input column */}
      <div className="flex items-center gap-0.5 shrink-0">
        {prefix && (
          <span className="text-[11px] font-medium text-slate-400 select-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          className={clsx(
            inputWidth,
            'h-7 text-xs text-right tabular-nums',
            'bg-slate-50 border border-slate-200 rounded-md px-2',
            'focus:outline-none focus:ring-1 focus:ring-blue-400',
            'focus:border-blue-400 focus:bg-white transition-colors',
          )}
        />
        {suffix && (
          <span className="text-[11px] text-slate-400 ml-0.5 select-none whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
