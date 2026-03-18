/** Range slider with label and live value display. */

export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
  format = (v) => String(v),
  hint,
  accentClass = 'accent-blue-600',
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        <span className="text-sm font-bold text-slate-800 tabular-nums">
          {format(value)}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${accentClass}`}
      />

      <div className="flex justify-between text-xs text-slate-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>

      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
