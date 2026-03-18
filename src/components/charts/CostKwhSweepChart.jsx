/**
 * CostKwhSweepChart – Total cost per kWh vs fleet scale (stacked area).
 *
 * Shows the three components of total energy cost stacked on top of each other:
 *   1. Electricity (bottom, yellow) – flat, set by grid tariff
 *   2. Battery lease (middle, emerald) – slight scale effect
 *   3. Platform fee (top, blue) – large scale effect (fixed capex ÷ volume)
 *
 * The dramatic drop in the top "Platform fee" band as trucks increase is the
 * core economic insight of the A2 model: fixed infrastructure costs are
 * amortised over a larger energy throughput.
 *
 * Props:
 *   data           – array of SweepPoint objects from buildTruckSweep()
 *   currentTrucks  – draws a vertical marker at the current store value
 */

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const C = {
  electricity: '#FCD34D',   // amber-300 (warm, readable)
  battery:     '#34D399',   // emerald-400
  platform:    '#60A5FA',   // blue-400
  tick:        '#94A3B8',
  grid:        '#F1F5F9',
};

const TICK = { fontSize: 11, fill: C.tick };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const byKey = {};
  payload.forEach((p) => { byKey[p.dataKey] = p.value; });

  const total = (byKey.electricityCostPerKwh ?? 0) +
                (byKey.batteryLeasePerKwh    ?? 0) +
                (byKey.platformFeePerKwh     ?? 0);

  const fmtKwh = (v) => v != null ? `$${v.toFixed(3)}/kWh` : '—';
  const pct    = (v) => total > 0 ? ` (${((v / total) * 100).toFixed(0)}%)` : '';

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[195px]">
      <p className="font-semibold text-slate-700 mb-2">{label} trucks</p>
      {[
        { key: 'electricityCostPerKwh', label: 'Electricity',    color: C.electricity },
        { key: 'batteryLeasePerKwh',    label: 'Battery Lease',  color: C.battery     },
        { key: 'platformFeePerKwh',     label: 'Platform Fee',   color: C.platform    },
      ].map(({ key, label: lbl, color }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
            <span className="text-slate-600">{lbl}</span>
          </span>
          <span className="text-slate-800 font-medium tabular-nums">
            {fmtKwh(byKey[key])}<span className="text-slate-400">{pct(byKey[key] ?? 0)}</span>
          </span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between">
        <span className="font-semibold text-slate-700">Total</span>
        <span className="font-bold text-slate-900 tabular-nums">{fmtKwh(total)}</span>
      </div>
    </div>
  );
}

export function CostKwhSweepChart({ data, currentTrucks }) {
  if (!data?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={270}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 16, left: 0 }}
        stackOffset="none"
      >
        <defs>
          <linearGradient id="gradElec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.electricity} stopOpacity={0.85} />
            <stop offset="95%" stopColor={C.electricity} stopOpacity={0.75} />
          </linearGradient>
          <linearGradient id="gradBatt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.battery} stopOpacity={0.85} />
            <stop offset="95%" stopColor={C.battery} stopOpacity={0.75} />
          </linearGradient>
          <linearGradient id="gradPlat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.platform} stopOpacity={0.85} />
            <stop offset="95%" stopColor={C.platform} stopOpacity={0.75} />
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
        <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

        <Area
          dataKey="electricityCostPerKwh"
          name="Electricity"
          type="monotone"
          stackId="cost"
          stroke={C.electricity}
          fill="url(#gradElec)"
          strokeWidth={0}
        />
        <Area
          dataKey="batteryLeasePerKwh"
          name="Battery Lease"
          type="monotone"
          stackId="cost"
          stroke={C.battery}
          fill="url(#gradBatt)"
          strokeWidth={0}
        />
        <Area
          dataKey="platformFeePerKwh"
          name="Platform Fee"
          type="monotone"
          stackId="cost"
          stroke={C.platform}
          fill="url(#gradPlat)"
          strokeWidth={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
