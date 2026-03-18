/**
 * DashboardPage – consolidated investor overview.
 *
 * ── Layout (top → bottom) ────────────────────────────────────────────────────
 *
 *   1. ConstraintBanner  – operational warnings (dismissable strip)
 *   2. KpiRow            – 7 KPI tiles: trucks · kWh · capex · revenue pool
 *                                        fleet IRR · battery IRR · platform IRR
 *   3. PricingStack      – $/kWh waterfall + $/km vs diesel + viability verdict
 *   4. Charts row        – Revenue stacked bar  |  EBITDA grouped bar
 *   5. Margin + table    – EBITDA margin line   |  Consolidated projection table
 *
 * All KPIs and pricing data are sourced from results.snapshot (runScenario).
 * Multi-year chart data comes from results.platform/battery/fleet/consolidated
 * (runModel output). Nothing is recalculated in this file.
 */

import {
  useSimulatorStore,
  selectResults,
  selectSettings,
  selectSystem,
  selectBattery,
  selectPlatform,
  selectSnapshot,
} from '../store/useSimulatorStore';

import { Card }            from '../components/ui/Card';
import { SectionTitle }    from '../components/ui/SectionTitle';
import { RevenueBarChart } from '../components/charts/RevenueBarChart';
import { EbitdaChart }     from '../components/charts/EbitdaChart';
import { MarginChart }     from '../components/charts/MarginChart';

import { KpiRow }              from '../components/dashboard/KpiRow';
import { PricingStack }        from '../components/dashboard/PricingStack';
import { ConstraintBanner }    from '../components/dashboard/ConstraintBanner';
import { InfrastructurePanel } from '../components/dashboard/InfrastructurePanel';
import { ConstraintsPanel }    from '../components/dashboard/ConstraintsPanel';

import {
  formatCurrency,
  formatPercent,
  formatInt,
} from '../lib/finance/format';

export function DashboardPage() {
  const results   = useSimulatorStore(selectResults);
  const settings  = useSimulatorStore(selectSettings);
  const system    = useSimulatorStore(selectSystem);
  const battery   = useSimulatorStore(selectBattery);
  const platform  = useSimulatorStore(selectPlatform);
  const snapshot  = useSimulatorStore(selectSnapshot);

  const { consolidated, platform: platYears, battery: battYears, fleet: fleetYears, summary } = results;

  return (
    <div className="space-y-6">

      {/* ── 1. Constraint banner ─────────────────────────────────────── */}
      <ConstraintBanner constraints={snapshot?.constraints} />

      {/* ── 2. KPI tiles ─────────────────────────────────────────────── */}
      <KpiRow
        snapshot={snapshot}
        system={system}
        battery={battery}
        platform={platform}
      />

      {/* ── 3. Pricing stack ─────────────────────────────────────────── */}
      <PricingStack snapshot={snapshot} />

      {/* ── 4. Infrastructure sizing ─────────────────────────────────── */}
      <InfrastructurePanel
        infrastructure={snapshot?.infrastructure}
        constraints={snapshot?.constraints}
        battery={battery}
      />

      {/* ── 5. Constraints health board ──────────────────────────────── */}
      <ConstraintsPanel constraints={snapshot?.constraints} />

      {/* ── Section divider ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Multi-year projections · {settings.projectionYears}-year model
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ── 6. Charts row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <SectionTitle
            title="Gross Revenue by Entity"
            subtitle="Before intercompany eliminations"
          />
          <RevenueBarChart
            consolidated={consolidated}
            platform={platYears}
            battery={battYears}
            fleet={fleetYears}
          />
        </Card>

        <Card>
          <SectionTitle title="EBITDA by Entity" subtitle="Operating earnings per year" />
          <EbitdaChart platform={platYears} battery={battYears} fleet={fleetYears} />
        </Card>
      </div>

      {/* ── 7. Margin chart + consolidated table ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <SectionTitle
            title="EBITDA Margin Progression"
            subtitle="Operating leverage by entity"
          />
          <MarginChart platform={platYears} battery={battYears} fleet={fleetYears} />
        </Card>

        {/* Consolidated summary table */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-0">
            <SectionTitle
              title="Consolidated Projection"
              subtitle="Net of intercompany fees"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left pl-5 pr-2 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">
                    Metric
                  </th>
                  {consolidated.map((c) => (
                    <th
                      key={c.year}
                      className="text-right px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      Yr {c.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Net Revenue',   key: 'totalRevenue',   fmt: formatCurrency },
                  { label: 'Platform Rev',  key: 'platformRevenue', fmt: formatCurrency },
                  { label: 'Battery Rev',   key: 'batteryRevenue',  fmt: formatCurrency },
                  { label: 'Fleet Rev',     key: 'fleetRevenue',    fmt: formatCurrency },
                  { label: 'Total EBITDA',  key: 'totalEbitda',    fmt: formatCurrency },
                  { label: 'EBITDA Margin', key: 'ebitdaMargin',   fmt: (v) => formatPercent(v) },
                  { label: 'Trucks',        key: 'trucksThisYear', fmt: formatInt },
                ].map((row, ri) => (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="pl-5 pr-2 py-2.5 text-slate-600 font-medium whitespace-nowrap">
                      {row.label}
                    </td>
                    {consolidated.map((c) => {
                      const val   = c[row.key] ?? 0;
                      const isNeg = typeof val === 'number' && val < 0;
                      return (
                        <td
                          key={c.year}
                          className={`text-right px-3 py-2.5 tabular-nums font-medium whitespace-nowrap ${
                            isNeg ? 'text-red-500' : 'text-slate-800'
                          }`}
                        >
                          {row.fmt(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
