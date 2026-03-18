/**
 * Line chart – EBITDA margin % per entity over time.
 * Helps investors assess operating leverage trajectory.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  Platform: '#3B82F6',
  Battery:  '#10B981',
  Fleet:    '#F59E0B',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
            <span className="text-slate-600">{entry.name}</span>
          </span>
          <span className={`font-semibold ${entry.value >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
            {entry.value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function MarginChart({ platform, battery, fleet }) {
  const data = platform.map((p, i) => ({
    year:     `Yr ${p.year}`,
    Platform: parseFloat(p.ebitdaMargin.toFixed(1)),
    Battery:  parseFloat((battery[i]?.ebitdaMargin ?? 0).toFixed(1)),
    Fleet:    parseFloat((fleet[i]?.ebitdaMargin ?? 0).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 2" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        {Object.entries(COLORS).map(([key, color]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
