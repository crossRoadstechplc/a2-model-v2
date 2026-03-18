/**
 * Stacked bar chart – annual revenue split across the three entities.
 * Entity bars use their brand colours.  Shows consolidated net revenue
 * (after intercompany elimination) as a line overlay.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatMillions } from '../../lib/finance/formatters';

const COLORS = {
  platform: '#3B82F6',  // blue
  battery:  '#10B981',  // emerald
  fleet:    '#F59E0B',  // amber
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
            <span className="text-slate-600 capitalize">{entry.name}</span>
          </span>
          <span className="font-semibold text-slate-900">{formatMillions(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueBarChart({ consolidated, platform, battery, fleet }) {
  // Build chart data from per-entity results
  const data = consolidated.map((c, i) => ({
    year: `Yr ${c.year}`,
    Platform: Math.round(platform[i]?.totalRevenue ?? 0),
    Battery:  Math.round(battery[i]?.totalRevenue ?? 0),
    Fleet:    Math.round(fleet[i]?.totalRevenue ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barSize={28} barGap={4}>
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="Platform" stackId="a" fill={COLORS.platform} radius={[0, 0, 0, 0]} />
        <Bar dataKey="Battery"  stackId="a" fill={COLORS.battery}  radius={[0, 0, 0, 0]} />
        <Bar dataKey="Fleet"    stackId="a" fill={COLORS.fleet}    radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
