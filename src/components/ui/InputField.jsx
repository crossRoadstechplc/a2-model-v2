/** Labelled numeric input with optional prefix/suffix decorators. */

import clsx from 'clsx';

export function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step = 1,
  hint,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>

      <div className="flex items-stretch">
        {prefix && (
          <span className="flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-md text-slate-500 text-sm font-medium select-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className={clsx(
            'flex-1 px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors min-w-0',
            prefix ? '' : 'rounded-l-md',
            suffix ? '' : 'rounded-r-md',
          )}
        />
        {suffix && (
          <span className="flex items-center px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-slate-500 text-sm font-medium select-none">
            {suffix}
          </span>
        )}
      </div>

      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
