/**
 * CostKmSweepChart – EV vs diesel cost per km across fleet scale.
 *
 * The electric cost per km falls as the platform fee per kWh decreases
 * with higher truck counts. The diesel cost per km is a flat horizontal
 * reference line (it's a constant system assumption in the sweep).
 *
 * When the EV line crosses below the diesel line the corridor becomes
 * economically competitive — this crossover truck count is a key investor metric.
 * A vertical reference line marks the first point where `viable === true`.
 *
 * Props:
 *   data           – array of SweepPoint objects from buildTruckSweep()
 *   currentTrucks  – draws a vertical marker for the current store value
 */

import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  Area,
} from 'recharts';

const C = {
  electric: '#3B82F6',   // blue-500
  diesel:   '#94A3B8',   // slate-400
  viable:   '#10B981',   // emerald-500
  notVia:   '#FCA5A5',   // red-300
  tick:     '#94A3B8',
  grid:     '#F1F5F9',
};

const TICK = { fontSize: 11, fill: C.tick };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const byKey = {};
  payload.forEach((p) => { byKey[p.dataKey] = p.value; });

  const ev     = byKey.electricCostPerKm;
  const diesel = byKey.dieselCostPerKm;
  const cheaper = ev != null && diesel != null && ev < diesel;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[185px]">
      <p className="font-semibold text-slate-700 mb-2">{label} trucks</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: C.electric }} />
          <span className="text-slate-600">Electric / km</span>
        </span>
        <span className={`font-bold tabular-nums ${cheaper ? 'text-emerald-700' : 'text-red-600'}`}>
          {ev != null ? `$${ev.toFixed(3)}` : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: C.diesel }} />
          <span className="text-slate-600">Diesel / km</span>
        </span>
        <span className="font-medium text-slate-700 tabular-nums">
          {diesel != null ? `$${diesel.toFixed(3)}` : '—'}
        </span>
      </div>
      {ev != null && diesel != null && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className={`text-[11px] font-semibold ${cheaper ? 'text-emerald-600' : 'text-red-500'}`}>
            {cheaper
              ? `EV saves $${(diesel - ev).toFixed(3)}/km`
              : `EV costs $${(ev - diesel).toFixed(3)}/km more`}
          </span>
        </div>
      )}
    </div>
  );
}

export function CostKmSweepChart({ data, currentTrucks }) {
  if (!data?.length) return null;

  // Find first truck count where EV becomes cheaper than diesel
  const breakevenPoint = data.find((d) => d.viable);
  const dieselFlat = data[0]?.dieselCostPerKm ?? 0.18;

  return (
    <ResponsiveContainer width="100%" height={270}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 16, left: 0 }}
      >
        <defs>
          {/* Subtle fill between lines – shown only below the EV line */}
          <linearGradient id="gradEv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={C.electric} stopOpacity={0.08} />
            <stop offset="100%" stopColor={C.electric} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />

        <XAxis
          dataKey="trucks"
          tick={TICK}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Trucks on corridor', position: 'insideBottom', offset: -8, style: { fontSize: 10, fill: C.tick } }}
        />
        <YAxis
          tickFormatter={(v) => `$${v.toFixed(2)}`}
          tick={TICK}
          axisLine={false}
          tickLine={false}
          width={48}
        />

        {/* Diesel baseline */}
        <ReferenceLine
          y={dieselFlat}
          stroke={C.diesel}
          strokeWidth={1.5}
          strokeDasharray="5 3"
          label={{ value: `Diesel $${dieselFlat.toFixed(3)}/km`, position: 'right', fontSize: 9, fill: C.diesel }}
        />

        {/* Breakeven vertical marker */}
        {breakevenPoint && (
          <ReferenceLine
            x={breakevenPoint.trucks}
            stroke={C.viable}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            label={{ value: `Break-even`, position: 'insideTopLeft', fontSize: 9, fill: C.viable }}
          />
        )}

        {/* Current truck count marker */}
        {currentTrucks && (
          <ReferenceLine
            x={currentTrucks}
            stroke="#CBD5E1"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            label={{ value: 'Now', position: 'top', fontSize: 9, fill: '#94A3B8' }}
          />
        )}

        <Tooltip content={<Tip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

        {/* Subtle area under EV line */}
        <Area
          dataKey="electricCostPerKm"
          name="Electric / km"
          type="monotone"
          stroke="none"
          fill="url(#gradEv)"
          legendType="none"
        />

        <Line
          dataKey="electricCostPerKm"
          name="Electric / km"
          type="monotone"
          stroke={C.electric}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
