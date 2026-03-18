/**
 * Reusable entity detail page (Platform / Battery / Fleet).
 * Renders KPI cards, a revenue/cost bar chart, and a full P&L table.
 *
 * Props:
 *   entityKey   – 'platform' | 'battery' | 'fleet'
 *   rows        – array of year projection objects from the engine
 *   revenueKeys – [{ key, label }] revenue line items to display
 *   costKeys    – [{ key, label }] cost line items to display
 *   accentColor – MetricCard accent color
 *   icon        – Lucide icon for KPI cards
 */

import { Card }           from '../components/ui/Card';
import { MetricCard }     from '../components/ui/MetricCard';
import { SectionTitle }   from '../components/ui/SectionTitle';
import { formatDollars, formatPercent, formatInt } from '../lib/finance/formatters';
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
} from 'recharts';

function PnLTable({ rows, revenueKeys, costKeys }) {
  const years = rows.map((r) => r.year);

  const renderRow = (label, key, isNegative = false, isBold = false, isSection = false) => {
    if (isSection) {
      return (
        <tr key={label} className="bg-slate-100">
          <td
            colSpan={years.length + 1}
            className="pl-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide"
          >
            {label}
          </td>
        </tr>
      );
    }
    return (
      <tr key={label} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
        <td className={`pl-5 pr-2 py-2.5 text-xs whitespace-nowrap ${isBold ? 'font-semibold text-slate-800' : 'text-slate-600 font-medium'}`}>
          {label}
        </td>
        {rows.map((r) => {
          const raw = r[key] ?? 0;
          const display = isNegative ? -Math.abs(raw) : raw;
          const isRed = display < 0;
          return (
            <td
              key={r.year}
              className={`text-right px-3 py-2.5 text-xs tabular-nums whitespace-nowrap ${
                isBold ? 'font-bold' : 'font-medium'
              } ${isRed ? 'text-red-500' : 'text-slate-800'}`}
            >
              {formatDollars(display)}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left pl-5 pr-2 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
              ($USD)
            </th>
            {years.map((y) => (
              <th
                key={y}
                className="text-right px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap"
              >
                Year {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRow('REVENUE', null, false, false, true)}
          {revenueKeys.map((rk) => renderRow(rk.label, rk.key))}
          {renderRow('Total Revenue', 'totalRevenue', false, true)}

          {renderRow('OPERATING COSTS', null, false, false, true)}
          {costKeys.map((ck) => renderRow(ck.label, ck.key, true))}
          {renderRow('Total Costs', 'totalCosts', true, true)}

          {renderRow('EARNINGS', null, false, false, true)}
          {renderRow('EBITDA', 'ebitda', false, true)}
          {renderRow('EBIT (after D&A)', 'ebit', false, true)}
        </tbody>
      </table>
    </div>
  );
}

export function EntityPage({ entityKey, rows, revenueKeys, costKeys, accentColor, icon }) {
  if (!rows?.length) return null;

  const lastRow  = rows[rows.length - 1];
  const firstRow = rows[0];

  return (
    <div className="space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Yr 1 Revenue"
          value={formatDollars(firstRow.totalRevenue)}
          sub="Starting year"
          accentColor={accentColor}
          icon={icon}
        />
        <MetricCard
          title={`Yr ${lastRow.year} Revenue`}
          value={formatDollars(lastRow.totalRevenue)}
          sub="Final projected year"
          accentColor={accentColor}
          icon={icon}
        />
        <MetricCard
          title={`Yr ${lastRow.year} EBITDA`}
          value={formatDollars(lastRow.ebitda)}
          sub="Operating earnings"
          delta={formatPercent(lastRow.ebitdaMargin) + ' margin'}
          accentColor={lastRow.ebitda >= 0 ? 'emerald' : 'red'}
        />
        <MetricCard
          title="Yr N Trucks / Assets"
          value={formatInt(lastRow.trucksThisYear ?? lastRow.packsThisYear ?? 0)}
          sub={entityKey === 'battery' ? 'Battery packs' : 'Trucks served'}
          accentColor="slate"
        />
      </div>

      {/* P&L Table */}
      <Card padding="none">
        <div className="px-5 pt-5">
          <SectionTitle
            title="Annual P&L Statement"
            subtitle={`${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)} Company — all figures in USD`}
          />
        </div>
        <PnLTable rows={rows} revenueKeys={revenueKeys} costKeys={costKeys} />
      </Card>
    </div>
  );
}
