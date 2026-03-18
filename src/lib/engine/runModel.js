/**
 * Master model runner.
 *
 * Orchestrates the three entity engines and derives consolidated metrics.
 * This is the only function the Zustand store needs to call.
 *
 * Returns:
 *   {
 *     platform:     MonthlyProjection[]   (per-year)
 *     battery:      MonthlyProjection[]
 *     fleet:        MonthlyProjection[]
 *     consolidated: ConsolidatedYear[]    (sum of all three entities)
 *     summary:      { totalRevenue, totalEbitda, ... }  (last projected year)
 *   }
 */

import { getMultipliers } from '../scenarios/scenarioMultipliers';
import { projectPlatform } from './platformEngine';
import { projectBattery }  from './batteryEngine';
import { projectFleet }    from './fleetEngine';
import { cagr, npv }       from '../finance/metrics';

export function runModel(settings, platform, battery, fleet, scenario) {
  const { projectionYears } = settings;
  const multipliers = getMultipliers(scenario);

  // ── Run individual engines ───────────────────────────────────────────────
  const platformYears = projectPlatform(platform, fleet, projectionYears, multipliers);
  const batteryYears  = projectBattery(battery, fleet, projectionYears, multipliers);
  const fleetYears    = projectFleet(fleet, projectionYears, multipliers);

  // ── Consolidated (sum all entities per year) ─────────────────────────────
  const consolidated = platformYears.map((p, i) => {
    const b = batteryYears[i];
    const f = fleetYears[i];

    // Intercompany eliminations:
    //   Fleet pays Platform fees  → eliminate from Fleet costs + Platform revenue
    //   Fleet pays Battery fees   → eliminate from Fleet costs + Battery revenue
    //   Battery pays Platform fee → eliminate from Battery costs + Platform revenue
    const eliminationPlatformFromFleet = f.platformFees;
    const eliminationBatteryFromFleet  = f.batteryLeaseFees;
    const eliminationPlatformFromBattery = b.platformFee;

    const consolidatedRevenue =
      p.totalRevenue + b.totalRevenue + f.totalRevenue
      - eliminationPlatformFromFleet
      - eliminationBatteryFromFleet
      - eliminationPlatformFromBattery;

    const consolidatedEbitda = p.ebitda + b.ebitda + f.ebitda;
    const consolidatedEbit   = p.ebit   + b.ebit   + f.ebit;

    return {
      year: p.year,
      trucksThisYear: f.trucksThisYear,
      // Gross revenues before eliminations (for reporting)
      platformRevenue: p.totalRevenue,
      batteryRevenue:  b.totalRevenue,
      fleetRevenue:    f.totalRevenue,
      // Net consolidated revenue (post elimination)
      totalRevenue: consolidatedRevenue,
      // Earnings
      platformEbitda: p.ebitda,
      batteryEbitda:  b.ebitda,
      fleetEbitda:    f.ebitda,
      totalEbitda:    consolidatedEbitda,
      totalEbit:      consolidatedEbit,
      ebitdaMargin:   consolidatedRevenue > 0
        ? (consolidatedEbitda / consolidatedRevenue) * 100
        : 0,
    };
  });

  // ── Summary stats (last year vs first year) ──────────────────────────────
  const yr1 = consolidated[0];
  const yrN = consolidated[consolidated.length - 1];

  const summary = {
    yr1Revenue:   yr1?.totalRevenue   ?? 0,
    yrNRevenue:   yrN?.totalRevenue   ?? 0,
    yr1Ebitda:    yr1?.totalEbitda    ?? 0,
    yrNEbitda:    yrN?.totalEbitda    ?? 0,
    yrNMargin:    yrN?.ebitdaMargin   ?? 0,
    revenueCAGR:  cagr(yr1?.totalRevenue ?? 1, yrN?.totalRevenue ?? 1, projectionYears - 1),
    totalTrucksYrN: yrN?.trucksThisYear ?? 0,
    // NPV of consolidated EBITDA stream at 12% discount rate
    ebitdaNPV:    npv(0.12, consolidated.map((y) => y.totalEbitda)),
  };

  return { platform: platformYears, battery: batteryYears, fleet: fleetYears, consolidated, summary };
}
