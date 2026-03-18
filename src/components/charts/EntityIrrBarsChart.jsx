/**
 * EntityIrrBarsChart – current scenario entity IRR comparison (bar chart).
 *
 * Displays the three entity IRRs as vertical bars, with the target IRR
 * shown as a small label marker on each bar. Bar colour indicates whether
 * the IRR meets the target: entity colour = meets/exceeds, slate = no target.
 *
 * Props:
 *   snapshot        – results.snapshot from Zustand
 *   batteryTarget   – Battery Co. target IRR (fraction)
 *   platformTarget  – Platform Co. target IRR (fraction)
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ReferenceLine, ResponsiveContainer,
  LabelList,
} from 'recharts';

const C = {
  battery:  '#10B981',
  platform: '#3B82F6',
  fleet:    '#F59E0B',
  miss:     '#F87171',   // red-400 — entity missed its target
  tick:     '#94A3B8',
  grid:     '#F1F5F9',
};

const TICK = { fontSize: 11, fill: C.tick };

function irrPct(v) {
  if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return null;
  return parseFloat(Math.min(200, Math.max(-50, v * 100)).toFixed(2));
}

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[170px]">
      <p className="font-semibold text-slate-700 mb-2">{d.entity}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Actual IRR</span>
          <span className="font-bold text-slate-900 tabular-nums">
            {d.irr != null ? `${d.irr.toFixed(1)}%` : '—'}
          </span>
        </div>
        {d.target != null && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Target IRR</span>
            <span className="font-medium text-slate-700 tabular-nums">
              {d.target.toFixed(1)}%
            </span>
          </div>
        )}
        {d.irr != null && d.target != null && (
          <div className={`text-[11px] font-semibold mt-1 pt-1 border-t border-slate-100 ${
            d.irr >= d.target ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {d.irr >= d.target
              ? `✓ Exceeds target by ${(d.irr - d.target).toFixed(1)}pp`
              : `✗ Below target by ${(d.target - d.irr).toFixed(1)}pp`}
          </div>
        )}
      </div>
    </div>
  );
}

export function EntityIrrBarsChart({ snapshot, batteryTarget, platformTarget }) {
  const bTgt = (batteryTarget  ?? 0.18) * 100;
  const pTgt = (platformTarget ?? 0.15) * 100;

  const chartData = [
    {
      entity:  'Battery Co.',
      irr:     irrPct(snapshot?.batteryCompany?.irr),
      target:  bTgt,
      color:   C.battery,
    },
    {
      entity:  'Platform Co.',
      irr:     irrPct(snapshot?.platformCompany?.irr),
      target:  pTgt,
      color:   C.platform,
    },
    {
      entity:  'Fleet Co.',
      irr:     irrPct(snapshot?.fleetCompany?.irr),
      target:  10,  // fleet minimum return reference
      color:   C.fleet,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        barSize={44}
        margin={{ top: 16, right: 12, bottom: 4, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        <XAxis dataKey="entity" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `${v}%`}
          tick={TICK}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
        <Tooltip content={<Tip />} cursor={{ fill: '#F8FAFC' }} />

        <Bar dataKey="irr" name="IRR" radius={[4, 4, 0, 0]}>
          {chartData.map((d) => {
            const meetsTarget = d.irr !== null && d.irr >= d.target;
            return (
              <Cell
                key={d.entity}
                fill={d.irr === null ? '#E2E8F0' : meetsTarget ? d.color : C.miss}
                fillOpacity={0.9}
              />
            );
          })}
          {/* IRR value label above each bar */}
          <LabelList
            dataKey="irr"
            position="top"
            formatter={(v) => v != null ? `${v.toFixed(1)}%` : '—'}
            style={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
