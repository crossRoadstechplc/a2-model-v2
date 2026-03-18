/**
 * InsightsPage – chart-based sensitivity and scenario analysis for investors.
 *
 * ── Layout ────────────────────────────────────────────────────────────────────
 *
 *   1. IRR vs Fleet Scale         – full width line chart (3 entity IRR curves)
 *   2. Cost per kWh vs Scale      – stacked area: electricity / battery / platform
 *      EV vs Diesel per km        – EV declining line + diesel reference
 *   3. Current Scenario IRR bars  – entity bar chart at current assumptions
 *      Scenario Comparison        – grouped IRR bars: Base / Optimistic / Stress
 *
 * ── Data strategy ─────────────────────────────────────────────────────────────
 *
 * Truck sweep:        useMemo on store assumptions — reruns when inputs change.
 *   30 engine runs × ~1 ms each ≈ 30–50 ms; negligible for a memo call.
 *
 * Scenario comparison: useMemo with no dependencies — preset inputs are
 *   compile-time constants so the data never needs to change.
 *
 * All chart logic lives in lib/chartData/ and components/charts/.
 * This file only composes them.
 */

import { useMemo }              from 'react';
import {
  useSimulatorStore,
  selectSystem,
  selectBattery,
  selectPlatform,
  selectFleet,
  selectSettings,
  selectSnapshot,
} from '../store/useSimulatorStore';

import {
  buildTruckSweep,
  deriveSweepInsights,
  buildScenarioCompareData,
} from '../lib/chartData';

import { IrrSweepChart }        from '../components/charts/IrrSweepChart';
import { CostKwhSweepChart }    from '../components/charts/CostKwhSweepChart';
import { CostKmSweepChart }     from '../components/charts/CostKmSweepChart';
import { EntityIrrBarsChart }   from '../components/charts/EntityIrrBarsChart';
import { ScenarioIrrBarsChart } from '../components/charts/ScenarioIrrBarsChart';

import { Card }         from '../components/ui/Card';
import { SectionTitle } from '../components/ui/SectionTitle';
import { formatIRR }    from '../lib/finance/format';
import {
  DEFAULT_BATTERY_IRR,
  DEFAULT_PLATFORM_IRR,
  FLEET_IRR_HURDLE,
  SWEEP_CONFIG,
} from '../lib/constants';

// ─── Small helpers ────────────────────────────────────────────────────────────

function fmtKwh(v) {
  if (v == null || !isFinite(v)) return '—';
  return `$${v.toFixed(2)}/kWh`;
}

/** Inline insight callout pill */
function InsightPill({ children, color = 'slate' }) {
  const cls = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    slate:   'bg-slate-100 text-slate-600 border-slate-200',
  }[color] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-block text-[11px] font-semibold border px-2 py-0.5 rounded-full ${cls}`}>
      {children}
    </span>
  );
}

/** Section heading with pill callouts */
function SectionHeader({ title, subtitle, pills = [] }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <SectionTitle title={title} subtitle={subtitle} />
      {pills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {pills}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function InsightsPage() {
  const system   = useSimulatorStore(selectSystem);
  const battery  = useSimulatorStore(selectBattery);
  const platform = useSimulatorStore(selectPlatform);
  const fleet    = useSimulatorStore(selectFleet);
  const settings = useSimulatorStore(selectSettings);
  const snapshot = useSimulatorStore(selectSnapshot);

  // ── Truck sweep: reruns when any store assumption changes ─────────────────
  // Sweep reruns when any assumption changes. Zustand returns stable object
  // references for unchanged slices, so this memo only fires when needed.
  const sweepData = useMemo(
    () => buildTruckSweep({ system, battery, platform, fleet, settings }, SWEEP_CONFIG),
    [system, battery, platform, fleet, settings], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Derived insight callouts ──────────────────────────────────────────────
  const insights = useMemo(
    () => deriveSweepInsights(sweepData, battery?.batteryIRR, platform?.platformIRR),
    [sweepData, battery?.batteryIRR, platform?.platformIRR],
  );

  // ── Scenario comparison: preset data, computed once ───────────────────────
  const { irrData: scenarioIrrData } = useMemo(
    () => buildScenarioCompareData(),
    [],
  );

  const currentTrucks   = system?.trucks;
  const batteryTarget   = battery?.batteryIRR;
  const platformTarget  = platform?.platformIRR;

  return (
    <div className="space-y-6">

      {/* ── Page intro ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Scale &amp; Sensitivity Insights</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          How corridor economics respond to fleet size — charts update live as assumptions change
        </p>
      </div>

      {/* ── Chart 1: IRR vs Fleet Scale (full width) ──────────────────────── */}
      <Card>
        <SectionHeader
          title="IRR vs Fleet Scale"
          subtitle="Each entity's return as a function of trucks on corridor · dashed lines = hurdle rates"
          pills={[
            insights.allViableAt && (
              <InsightPill key="viable" color="emerald">
                All targets met at {insights.allViableAt} trucks
              </InsightPill>
            ),
            <InsightPill key="current" color="slate">
              Current: {currentTrucks} trucks
            </InsightPill>,
          ].filter(Boolean)}
        />
        <div className="mt-4">
          <IrrSweepChart
            data={sweepData}
            batteryTarget={batteryTarget}
            platformTarget={platformTarget}
            currentTrucks={currentTrucks}
          />
        </div>
      </Card>

      {/* ── Charts 2 & 3: Cost per kWh + Cost per km (side by side) ──────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <Card>
          <SectionHeader
            title="Cost per kWh vs Scale"
            subtitle="Stacked composition — platform fee dominates at low scale"
            pills={[
              insights.maxCostPerKwh != null && (
                <InsightPill key="max" color="slate">
                  {fmtKwh(insights.maxCostPerKwh)} at {sweepData[0]?.trucks} trucks
                </InsightPill>
              ),
              insights.minCostPerKwh != null && (
                <InsightPill key="min" color="blue">
                  {fmtKwh(insights.minCostPerKwh)} at {sweepData[sweepData.length - 1]?.trucks} trucks
                </InsightPill>
              ),
            ].filter(Boolean)}
          />
          <div className="mt-4">
            <CostKwhSweepChart data={sweepData} currentTrucks={currentTrucks} />
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="EV vs Diesel — Cost per km"
            subtitle="Electric cost falls with scale · diesel line is baseline assumption"
            pills={[
              insights.evBreakevenAt
                ? <InsightPill key="brk" color="emerald">Break-even at {insights.evBreakevenAt} trucks</InsightPill>
                : <InsightPill key="nobrk" color="amber">No break-even in range</InsightPill>,
            ]}
          />
          <div className="mt-4">
            <CostKmSweepChart data={sweepData} currentTrucks={currentTrucks} />
          </div>
        </Card>
      </div>

      {/* ── Charts 4 & 5: Entity IRR bars + Scenario comparison ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <Card>
          <SectionHeader
            title="Current Scenario — Entity Returns"
            subtitle="IRR at current assumptions · bar turns red if entity misses its target"
          />
          <div className="mt-4">
            <EntityIrrBarsChart
              snapshot={snapshot}
              batteryTarget={batteryTarget}
              platformTarget={platformTarget}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 px-1">
            Battery target {formatIRR(batteryTarget ?? DEFAULT_BATTERY_IRR)} ·
            Platform target {formatIRR(platformTarget ?? DEFAULT_PLATFORM_IRR)} ·
            Fleet minimum {formatIRR(FLEET_IRR_HURDLE)}
          </p>
        </Card>

        <Card>
          <SectionHeader
            title="Scenario Comparison — IRR"
            subtitle="Base · Optimistic · Stress — preset corridor conditions"
          />
          <div className="mt-4">
            <ScenarioIrrBarsChart irrData={scenarioIrrData} />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 px-1">
            Dashed line = {formatIRR(FLEET_IRR_HURDLE)} minimum fleet return · All scenarios use identical engine
          </p>
        </Card>
      </div>

    </div>
  );
}
