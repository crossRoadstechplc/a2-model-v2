/**
 * IrrSweepChart – IRR vs fleet scale for all three entities.
 *
 * Shows how each entity's Internal Rate of Return changes as the number of
 * trucks on the corridor grows. The dashed reference lines mark each entity's
 * hurdle rate — the first truck count where all lines cross their hurdle is the
 * "minimum viable scale" for the corridor.
 *
 * Props:
 *   data            – array of SweepPoint objects from buildTruckSweep()
 *   batteryTarget   – Battery Co. target IRR (fraction, e.g. 0.18)
 *   platformTarget  – Platform Co. target IRR (fraction, e.g. 0.15)
 *   currentTrucks   – current store value (draws a vertical highlight)
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  battery:  '#10B981',   // emerald-500
  platform: '#3B82F6',   // blue-500
  fleet:    '#F59E0B',   // amber-500
  tick:     '#94A3B8',
  grid:     '#F1F5F9',
};

const TICK  = { fontSize: 11, fill: C.tick };
const LABEL = { fontSize: 10, fill: C.tick };

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tip({ active, payload, label, batteryTarget, platformTarget }) {
  if (!active || !payload?.length) return null;

  const byKey = {};
  payload.forEach((p) => { byKey[p.dataKey] = p.value; });

  const bTgt = (batteryTarget ?? 0.18) * 100;
  const pTgt = (platformTarget ?? 0.15) * 100;

  const row = (color, name, val, target) => (
    <div key={name} className="flex items-center justify-between gap-5">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-slate-600">{name}</span>
      </span>
      <span className="font-bold text-slate-900 tabular-nums">
        {val !== null && val !== undefined ? `${val.toFixed(1)}%` : '—'}
        {target && val !== null && (
          <span className={`ml-1 text-[10px] ${val >= target ? 'text-emerald-500' : 'text-red-400'}`}>
            {val >= target ? '✓' : '✗'} {target.toFixed(0)}%
          </span>
        )}
      </span>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[200px]">
      <p className="font-semibold text-slate-700 mb-2">{label} trucks</p>
      {row(C.battery,  'Battery IRR',  byKey.batteryIRR,  bTgt)}
      {row(C.platform, 'Platform IRR', byKey.platformIRR, pTgt)}
      {row(C.fleet,    'Fleet IRR',    byKey.fleetIRR,    10)}
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export function IrrSweepChart({ data, batteryTarget, platformTarget, currentTrucks }) {
  if (!data?.length) return null;

  const bTgt  = (batteryTarget  ?? 0.18) * 100;
  const pTgt  = (platformTarget ?? 0.15) * 100;
  const fTgt  = 10; // fleet minimum return threshold

  return (
    <ResponsiveContainer width="100%" height={310}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 16, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={C.grid}
          vertical={false}
        />

        <XAxis
          dataKey="trucks"
          tick={TICK}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Trucks on corridor', position: 'insideBottom', offset: -8, style: LABEL }}
        />

        <YAxis
          tickFormatter={(v) => `${v}%`}
          tick={TICK}
          axisLine={false}
          tickLine={false}
          width={42}
        />

        {/* Hurdle rate reference lines */}
        <ReferenceLine
          y={bTgt}
          stroke={C.battery}
          strokeDasharray="4 3"
          strokeOpacity={0.45}
          label={{ value: `Batt ${bTgt.toFixed(0)}%`, position: 'right', fontSize: 9, fill: C.battery }}
        />
        <ReferenceLine
          y={pTgt}
          stroke={C.platform}
          strokeDasharray="4 3"
          strokeOpacity={0.45}
          label={{ value: `Plat ${pTgt.toFixed(0)}%`, position: 'right', fontSize: 9, fill: C.platform }}
        />
        <ReferenceLine
          y={fTgt}
          stroke={C.fleet}
          strokeDasharray="4 3"
          strokeOpacity={0.40}
          label={{ value: `Fleet min`, position: 'right', fontSize: 9, fill: C.fleet }}
        />

        {/* Current truck count marker */}
        {currentTrucks && (
          <ReferenceLine
            x={currentTrucks}
            stroke="#CBD5E1"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            label={{ value: 'Current', position: 'top', fontSize: 9, fill: '#94A3B8' }}
          />
        )}

        <Tooltip
          content={<Tip batteryTarget={batteryTarget} platformTarget={platformTarget} />}
          cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
        />

        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
        />

        <Line
          dataKey="batteryIRR"
          name="Battery Co. IRR"
          type="monotone"
          stroke={C.battery}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls={false}
        />
        <Line
          dataKey="platformIRR"
          name="Platform Co. IRR"
          type="monotone"
          stroke={C.platform}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls={false}
        />
        <Line
          dataKey="fleetIRR"
          name="Fleet Co. IRR"
          type="monotone"
          stroke={C.fleet}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
