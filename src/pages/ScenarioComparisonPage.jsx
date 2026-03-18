/**
 * ScenarioComparisonPage – side-by-side scenario analysis.
 *
 * Layout:
 *   1. Intro banner with context text
 *   2. Quick-load scenario buttons (apply preset to workspace)
 *   3. Three scenario result cards: Base | Optimistic | Stress
 *   4. Cost-per-km summary chart (horizontal bar — visual viability check)
 *   5. Key assumptions comparison table
 *
 * The three scenario cards always show preset-derived results, regardless
 * of whatever assumptions are currently loaded in the workspace.
 * The comparison is static and deterministic — no store state needed.
 */

import { useMemo }  from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend,
} from 'recharts';
import clsx from 'clsx';
import { Layers, Info } from 'lucide-react';

import { useSimulatorStore, selectControls } from '../store/useSimulatorStore';
import {
  runAllComparisonScenarios,
  COMPARISON_ORDER,
  COMPARISON_SCENARIOS,
} from '../lib/scenarios/presets';
import { ScenarioCard }    from '../components/scenarios/ScenarioCard';
import { Card }            from '../components/ui/Card';
import { SectionTitle }    from '../components/ui/SectionTitle';
import { formatPercent, formatCurrency } from '../lib/finance/format';

// ─── Color tokens for Recharts ────────────────────────────────────────────────
const COLORS = {
  base:       '#3b82f6',   // blue-500
  optimistic: '#10b981',   // emerald-500
  stress:     '#ef4444',   // red-500
};

// ─── Custom Tooltip for cost-per-km chart ─────────────────────────────────────
function CostTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
          {p.name}: ${p.value.toFixed(3)}/km
        </p>
      ))}
    </div>
  );
}

// ─── Assumption comparison table ──────────────────────────────────────────────
const ASSUMPTION_ROWS = [
  { label: 'Trucks',             group: 'system',   key: 'trucks',            fmt: (v) => `${v}` },
  { label: 'Electricity cost',   group: 'system',   key: 'electricityCost',   fmt: (v) => `$${v.toFixed(2)}/kWh` },
  { label: 'Diesel cost',        group: 'system',   key: 'dieselCostPerKm',   fmt: (v) => `$${v.toFixed(2)}/km` },
  { label: 'kWh per swap',       group: 'system',   key: 'kwhPerSwap',        fmt: (v) => `${v} kWh` },
  { label: 'Battery cost',       group: 'battery',  key: 'batteryCost',       fmt: (v) => formatCurrency(v) },
  { label: 'Battery IRR target', group: 'battery',  key: 'batteryIRR',        fmt: (v) => formatPercent(v * 100, { decimals: 0 }) },
  { label: 'Buffer multiplier',  group: 'battery',  key: 'batteryBufferMultiplier', fmt: (v) => `${v}×` },
  { label: 'Platform capex',     group: 'platform', key: 'platformFixedCapex',fmt: (v) => formatCurrency(v) },
  { label: 'Platform opex',      group: 'platform', key: 'platformOpex',      fmt: (v) => formatCurrency(v) },
  { label: 'Platform IRR target',group: 'platform', key: 'platformIRR',       fmt: (v) => formatPercent(v * 100, { decimals: 0 }) },
  { label: 'Freight rev/truck',  group: 'fleet',    key: 'freightRevenuePerTruck', fmt: (v) => formatCurrency(v) + '/mo' },
  { label: 'Fleet opex/truck',   group: 'fleet',    key: 'fleetOpexPerTruck', fmt: (v) => formatCurrency(v) + '/mo' },
  { label: 'Projection years',   group: 'settings', key: 'projectionYears',   fmt: (v) => `${v} yrs` },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function ScenarioComparisonPage() {
  const controls    = useSimulatorStore(selectControls);
  const loadScenario = useSimulatorStore((s) => s.loadScenario);

  // Run all three scenarios — only changes if the module reloads (static presets)
  const scenarios = useMemo(() => runAllComparisonScenarios(), []);

  // Which scenario is currently loaded in the workspace?
  const activeKey = controls.selectedScenario;

  // Build cost-per-km chart data
  const costChartData = useMemo(() => {
    return scenarios.map(({ key, meta, snapshot }) => {
      const elec  = snapshot?.viability?.electricCostPerKm ?? 0;
      const diesel = snapshot?.viability?.dieselCostPerKm  ?? 0;
      return {
        name:   meta.label,
        key,
        electric: Math.round(elec * 1000) / 1000,
        diesel:   Math.round(diesel * 1000) / 1000,
      };
    });
  }, [scenarios]);

  // IRR comparison chart data — Battery, Platform, Fleet side by side
  const irrChartData = useMemo(() => {
    return [
      {
        metric: 'Battery IRR',
        base:       clampIRR(scenarios[0]?.snapshot?.batteryCompany?.irr),
        optimistic: clampIRR(scenarios[1]?.snapshot?.batteryCompany?.irr),
        stress:     clampIRR(scenarios[2]?.snapshot?.batteryCompany?.irr),
      },
      {
        metric: 'Platform IRR',
        base:       clampIRR(scenarios[0]?.snapshot?.platformCompany?.irr),
        optimistic: clampIRR(scenarios[1]?.snapshot?.platformCompany?.irr),
        stress:     clampIRR(scenarios[2]?.snapshot?.platformCompany?.irr),
      },
      {
        metric: 'Fleet IRR',
        base:       clampIRR(scenarios[0]?.snapshot?.fleetCompany?.irr),
        optimistic: clampIRR(scenarios[1]?.snapshot?.fleetCompany?.irr),
        stress:     clampIRR(scenarios[2]?.snapshot?.fleetCompany?.irr),
      },
    ];
  }, [scenarios]);

  return (
    <div className="space-y-6">

      {/* ── Intro banner ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-xl px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-base mb-1">Scenario Comparison</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Three scenarios run the same physics-first engine with different assumptions.
            The primary viability driver is <span className="text-white font-medium">fleet scale</span> —
            the platform's fixed infrastructure cost becomes affordable only when spread across
            a large number of trucks and high kWh throughput.
          </p>
        </div>
      </div>

      {/* ── Quick-load buttons ────────────────────────────────────────── */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5" />
            Load scenario into workspace:
          </div>
          {COMPARISON_ORDER.map((key) => {
            const s = COMPARISON_SCENARIOS[key];
            const isLoaded = activeKey === key;
            return (
              <button
                key={key}
                onClick={() => loadScenario(key)}
                className={clsx(
                  'px-4 py-2 text-xs font-semibold rounded-lg border transition-all',
                  isLoaded
                    ? `${s.meta.theme.bg} ${s.meta.theme.text} ${s.meta.theme.border} shadow-sm`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                {s.meta.label}
                {isLoaded && ' ✓'}
              </button>
            );
          })}
          <span className="text-xs text-slate-400 ml-auto hidden sm:block">
            Changes all pages — revert via Assumptions tab
          </span>
        </div>
      </Card>

      {/* ── Scenario cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {scenarios.map(({ key, meta, inputs, snapshot }) => (
          <ScenarioCard
            key={key}
            scenarioKey={key}
            meta={meta}
            inputs={inputs}
            snapshot={snapshot}
            isActive={activeKey === key}
            onLoad={() => loadScenario(key)}
          />
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Cost per km chart */}
        <Card>
          <SectionTitle
            title="Cost per km — Electric vs Diesel"
            subtitle="Electric is viable when the blue bar is shorter than the orange bar"
          />
          <div className="mt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={costChartData}
                layout="vertical"
                margin={{ top: 0, right: 20, bottom: 0, left: 20 }}
                barCategoryGap="25%"
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CostTooltip />} />
                <Legend
                  iconType="square"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                <Bar dataKey="electric" name="Electric" radius={[0, 4, 4, 0]} barSize={14}>
                  {costChartData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Bar dataKey="diesel" name="Diesel" fill="#f59e0b" fillOpacity={0.5} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Viability verdict strip */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {scenarios.map(({ key, meta, snapshot }) => {
              const label = snapshot?.viability?.label ?? '—';
              const colorMap = { 'Viable': 'emerald', 'Marginal': 'amber', 'Not Viable': 'red' };
              const c = colorMap[label] ?? 'slate';
              const cls = {
                emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                amber:   'bg-amber-50 text-amber-700 border-amber-200',
                red:     'bg-red-50 text-red-600 border-red-200',
                slate:   'bg-slate-50 text-slate-500 border-slate-200',
              }[c];
              return (
                <div key={key} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium', cls)}>
                  <span className="font-semibold">{meta.label}:</span>
                  {label}
                </div>
              );
            })}
          </div>
        </Card>

        {/* IRR comparison */}
        <Card>
          <SectionTitle
            title="IRR by Entity"
            subtitle="Capped at 50% for readability — Fleet Co. can exceed this at scale"
          />
          <div className="mt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={irrChartData}
                margin={{ top: 0, right: 10, bottom: 0, left: -10 }}
                barCategoryGap="20%"
                barGap={2}
              >
                <XAxis
                  dataKey="metric"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 50]}
                />
                <Tooltip
                  formatter={(v, name) => [`${v !== null ? v.toFixed(1) : '—'}%`, name]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {/* 10% hurdle line */}
                <ReferenceLine y={10} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '10% hurdle', position: 'right', fontSize: 9, fill: '#94a3b8' }} />
                <Bar dataKey="base"       name="Base"       fill={COLORS.base}       radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="optimistic" name="Optimistic" fill={COLORS.optimistic} radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="stress"     name="Stress"     fill={COLORS.stress}     radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* ── Assumptions comparison table ──────────────────────────────── */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <SectionTitle
            title="Key Assumption Differences"
            subtitle="Base values shown where scenarios do not override the default"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left pl-5 pr-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap w-44">
                  Assumption
                </th>
                {scenarios.map(({ key, meta }) => (
                  <th
                    key={key}
                    className={clsx(
                      'text-right px-4 py-2.5 font-semibold uppercase tracking-wide whitespace-nowrap',
                      meta.theme.text,
                    )}
                  >
                    {meta.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSUMPTION_ROWS.map((row, ri) => {
                const values = scenarios.map(({ inputs }) => {
                  const grp = inputs[row.group];
                  const v   = grp?.[row.key];
                  return v !== undefined ? row.fmt(v) : '—';
                });

                // Highlight cells that differ from base
                const baseVal = values[0];
                return (
                  <tr
                    key={row.key}
                    className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                  >
                    <td className="pl-5 pr-4 py-2.5 text-slate-600 font-medium whitespace-nowrap">
                      {row.label}
                    </td>
                    {values.map((val, ci) => {
                      const isDifferent = ci > 0 && val !== baseVal;
                      const scenKey = COMPARISON_ORDER[ci];
                      const theme   = COMPARISON_SCENARIOS[scenKey].meta.theme;
                      return (
                        <td
                          key={ci}
                          className={clsx(
                            'text-right px-4 py-2.5 tabular-nums font-medium whitespace-nowrap',
                            isDifferent ? `${theme.text} font-semibold` : 'text-slate-700',
                          )}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

// ─── Helper: clamp IRR for chart display ──────────────────────────────────────
/** Cap IRR at 50% for chart readability; return null for invalid values. */
function clampIRR(v) {
  if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return 0;
  const pct = v * 100;
  return Math.min(50, Math.max(0, pct));
}
