/**
 * Grouped bar chart showing EBITDA per entity per year.
 * Negative bars (losses) render in muted red.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatMillions } from '../../lib/finance/formatters';

const BASE_COLORS = {
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
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BASE_COLORS[entry.name] }} />
            <span className="text-slate-600">{entry.name}</span>
          </span>
          <span
            className={`font-semibold ${entry.value >= 0 ? 'text-slate-900' : 'text-red-500'}`}
          >
            {formatMillions(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EbitdaChart({ platform, battery, fleet }) {
  const data = platform.map((p, i) => ({
    year:     `Yr ${p.year}`,
    Platform: Math.round(p.ebitda),
    Battery:  Math.round(battery[i]?.ebitda ?? 0),
    Fleet:    Math.round(fleet[i]?.ebitda ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barSize={18} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatMillions}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="Platform" fill={BASE_COLORS.Platform} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Battery"  fill={BASE_COLORS.Battery}  radius={[3, 3, 0, 0]} />
        <Bar dataKey="Fleet"    fill={BASE_COLORS.Fleet}    radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
