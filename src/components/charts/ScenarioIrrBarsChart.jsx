/**
 * ScenarioIrrBarsChart – grouped IRR bars for Base / Optimistic / Stress.
 *
 * Shows Battery, Platform, and Fleet IRR side-by-side for each of the three
 * preset comparison scenarios. Investors can see at a glance how returns
 * vary under different market conditions.
 *
 * A 10% reference line marks the minimum viable fleet return.
 *
 * Props:
 *   irrData  – array from buildScenarioCompareData().irrData
 *              [{ scenario, key, Battery, Platform, Fleet, trucks }]
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const C = {
  battery:  '#10B981',
  platform: '#3B82F6',
  fleet:    '#F59E0B',
  tick:     '#94A3B8',
  grid:     '#F1F5F9',
};

const TICK = { fontSize: 11, fill: C.tick };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  // find trucks count from first payload entry's payload
  const trucks = payload[0]?.payload?.trucks;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[170px]">
      <div className="mb-2">
        <p className="font-semibold text-slate-700">{label}</p>
        {trucks && <p className="text-slate-400">{trucks} trucks</p>}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
            <span className="text-slate-600">{p.name}</span>
          </span>
          <span className="font-bold text-slate-900 tabular-nums">
            {p.value !== null && p.value !== undefined
              ? `${p.value.toFixed(1)}%`
              : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScenarioIrrBarsChart({ irrData }) {
  if (!irrData?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={irrData}
        barSize={16}
        barGap={2}
        barCategoryGap="30%"
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        <XAxis dataKey="scenario" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `${v}%`}
          tick={TICK}
          axisLine={false}
          tickLine={false}
          width={40}
        />

        {/* Minimum viable fleet return reference */}
        <ReferenceLine
          y={10}
          stroke={C.fleet}
          strokeDasharray="4 3"
          strokeOpacity={0.50}
          label={{ value: '10% min', position: 'right', fontSize: 9, fill: C.fleet }}
        />
        <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />

        <Tooltip content={<Tip />} cursor={{ fill: '#F8FAFC' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />

        <Bar dataKey="Battery"  name="Battery Co."  fill={C.battery}  radius={[3, 3, 0, 0]} />
        <Bar dataKey="Platform" name="Platform Co." fill={C.platform} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Fleet"    name="Fleet Co."    fill={C.fleet}    radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
