/**
 * constraintEngine.js – Step 7 of the simulation pipeline
 *
 * Evaluates operational constraints and emits structured warnings.
 * Warnings do not block computation — they are advisory flags that the UI
 * can surface to the user.
 *
 * ── Charging bottleneck ───────────────────────────────────────────────────────
 *   Triggered when charger utilization exceeds 85%.
 *   High utilization means any demand spike or charger downtime will cause
 *   trucks to queue, increasing swap turnaround time and reducing asset utilization.
 *
 * ── Bay congestion ────────────────────────────────────────────────────────────
 *   Triggered when swap bay utilization exceeds 80%.
 *   Bays are the physical bottleneck for truck throughput — congestion here
 *   directly impacts the number of routes that can be served per day.
 *
 * ── Battery stress ────────────────────────────────────────────────────────────
 *   Triggered when the estimated annual cycles per pack exceeds the designed
 *   annual degradation rate (= rated lifetime cycles / batteryLifeYears).
 *
 *   If packs cycle faster than their rated pace, they will degrade before
 *   the assumed replacement date, increasing actual battery capex.
 *
 * ── Low Fleet IRR ─────────────────────────────────────────────────────────────
 *   Triggered when the Fleet Company IRR falls below 10%.
 *   Low fleet returns indicate that pricing is too high relative to freight
 *   revenue, making it difficult to attract fleet operators.
 *
 * ── Unsolved pricing ─────────────────────────────────────────────────────────
 *   Triggered when the price solver failed to find a solution for Battery
 *   or Platform pricing.
 */

// ─── Thresholds ───────────────────────────────────────────────────────────────
const CHARGER_UTILIZATION_WARN  = 85;  // % – charging bottleneck
const BAY_UTILIZATION_WARN      = 80;  // % – bay congestion
const FLEET_IRR_MIN             = 0.10; // 10% – minimum fleet return
const CYCLE_STRESS_MULTIPLIER   = 1.0;  // cycles/year > rated rate → stress

// ─── Constraint builder helper ────────────────────────────────────────────────
function constraint(code, severity, triggered, message, detail = null) {
  return { code, severity, triggered, message, detail };
}

/**
 * @param {object} infrastructure  – output of computeInfrastructure()
 * @param {object} entityFinancials – output of computeEntityFinancials()
 * @param {object} battery          – battery assumption group
 * @param {object} pricing          – output of computePricing()
 * @returns {object}                constraint evaluation results
 */
export function computeConstraints(infrastructure, entityFinancials, battery, pricing) {
  const {
    chargerUtilization,
    bayUtilization,
    estimatedCyclesPerPackPerYear,
    chargersNeeded,
    baysNeeded,
    batteryPool,
  } = infrastructure;

  const { fleetCompany } = entityFinancials;
  const { solverDetails } = pricing;

  // ── Constraint 1: Charging bottleneck ─────────────────────────────────────
  const chargingBottleneck = constraint(
    'CHARGING_BOTTLENECK',
    'high',
    chargerUtilization >= CHARGER_UTILIZATION_WARN,
    `Charger utilization is ${chargerUtilization.toFixed(1)}% — consider adding ` +
    `${Math.ceil(chargersNeeded * 0.25)} more chargers as buffer capacity.`,
    { chargerUtilization, chargersNeeded, threshold: CHARGER_UTILIZATION_WARN },
  );

  // ── Constraint 2: Bay congestion ──────────────────────────────────────────
  const bayCongestion = constraint(
    'BAY_CONGESTION',
    'medium',
    bayUtilization >= BAY_UTILIZATION_WARN,
    `Swap bay utilization is ${bayUtilization.toFixed(1)}% — ` +
    (bayUtilization >= BAY_UTILIZATION_WARN
      ? `add at least ${Math.max(1, Math.ceil(baysNeeded * 0.25))} additional bay(s) to reduce congestion.`
      : 'bay capacity is adequate.'),
    { bayUtilization, baysNeeded, threshold: BAY_UTILIZATION_WARN },
  );

  // ── Constraint 3: Battery stress ──────────────────────────────────────────
  const ratedCyclesPerYear = battery.batteryLifeYears > 0
    ? (battery.batteryCycles ?? 0) / battery.batteryLifeYears
    : 0;

  const cycleRatio = ratedCyclesPerYear > 0
    ? estimatedCyclesPerPackPerYear / ratedCyclesPerYear
    : 0;

  const batteryStress = constraint(
    'BATTERY_STRESS',
    'high',
    estimatedCyclesPerPackPerYear > ratedCyclesPerYear * CYCLE_STRESS_MULTIPLIER,
    `Packs are cycling at ${estimatedCyclesPerPackPerYear.toFixed(0)} cycles/year ` +
    `vs rated ${ratedCyclesPerYear.toFixed(0)} cycles/year — ` +
    `packs will degrade ${((cycleRatio - 1) * 100).toFixed(0)}% faster than modelled. ` +
    `Consider increasing the battery buffer multiplier (current: ${batteryPool} packs).`,
    { estimatedCyclesPerPackPerYear, ratedCyclesPerYear, cycleRatio, batteryPool },
  );

  // ── Constraint 4: Low fleet IRR ───────────────────────────────────────────
  const fleetIRR        = fleetCompany.irr ?? 0;
  const lowFleetReturn  = constraint(
    'LOW_FLEET_IRR',
    'medium',
    fleetIRR !== null && fleetIRR < FLEET_IRR_MIN,
    `Fleet Company IRR is ${fleetIRR !== null ? (fleetIRR * 100).toFixed(1) : 'N/A'}% ` +
    `— below the ${FLEET_IRR_MIN * 100}% minimum. Consider raising freight rates ` +
    `or renegotiating energy pricing to attract fleet operators.`,
    { fleetIRR, threshold: FLEET_IRR_MIN },
  );

  // ── Constraint 5: Unsolved pricing ────────────────────────────────────────
  const pricingUnsolved = constraint(
    'PRICING_UNSOLVED',
    'high',
    !solverDetails.batteryFound || !solverDetails.platformFound,
    !solverDetails.batteryFound && !solverDetails.platformFound
      ? 'Both Battery and Platform pricing solvers failed — check capex, volume, and IRR targets.'
      : !solverDetails.batteryFound
        ? `Battery pricing solver failed: ${solverDetails.batteryReason ?? 'unknown reason'}.`
        : `Platform pricing solver failed: ${solverDetails.platformReason ?? 'unknown reason'}.`,
    {
      batteryFound:  solverDetails.batteryFound,
      platformFound: solverDetails.platformFound,
    },
  );

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const allConstraints = [
    chargingBottleneck,
    bayCongestion,
    batteryStress,
    lowFleetReturn,
    pricingUnsolved,
  ];

  const warnings    = allConstraints.filter((c) => c.triggered);
  const hasWarnings = warnings.length > 0;
  const hasHighSeverity = warnings.some((w) => w.severity === 'high');

  return {
    chargingBottleneck,
    bayCongestion,
    batteryStress,
    lowFleetReturn,
    pricingUnsolved,
    warnings,
    hasWarnings,
    hasHighSeverity,
    warningCount: warnings.length,
  };
}
