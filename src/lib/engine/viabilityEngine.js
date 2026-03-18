/**
 * viabilityEngine.js – Step 6 of the simulation pipeline
 *
 * Answers the fundamental question: Is operating an electric truck on this
 * corridor cheaper per km than a diesel truck?
 *
 * ── Electric cost per km ─────────────────────────────────────────────────────
 *   The fleet pays `totalCostPerKwh` for energy (electricity + battery lease +
 *   platform fee). The daily energy use per truck is:
 *
 *     kwhPerTruckPerDay = kwhPerSwap × swapsPerTruck
 *
 *   The daily km driven per truck is `kmPerTruckPerDay`. Therefore:
 *
 *     electricCostPerKm = totalCostPerKwh × kwhPerTruckPerDay / kmPerTruckPerDay
 *
 * ── Diesel baseline ──────────────────────────────────────────────────────────
 *   dieselCostPerKm is provided directly as a system assumption.
 *
 * ── Savings ──────────────────────────────────────────────────────────────────
 *   savingsPerKm   = dieselCostPerKm − electricCostPerKm
 *   savingsPercent = savingsPerKm / dieselCostPerKm × 100
 *
 *   Positive = EV is cheaper.  Negative = EV is more expensive.
 *
 * ── Viability label ──────────────────────────────────────────────────────────
 *   viable    → electric is >5% cheaper than diesel
 *   marginal  → within ±5% of diesel cost
 *   not viable → electric is >5% more expensive
 */

const MARGIN_BAND = 0.05; // ±5% of diesel cost = "marginal" zone

/**
 * @param {object} system    – { electricityCost, dieselCostPerKm, kmPerTruckPerDay }
 * @param {object} demand    – output of computeDemand()  (has kwhPerTruckPerDay)
 * @param {object} pricing   – output of computePricing() (has totalCostPerKwh)
 * @returns {object}         viability metrics
 */
export function computeViability(system, demand, pricing) {
  const { dieselCostPerKm, kmPerTruckPerDay } = system;
  const { kwhPerTruckPerDay }                 = demand;
  const { totalCostPerKwh }                   = pricing;

  // ── Electric cost per km ──────────────────────────────────────────────────
  const electricCostPerKm =
    kmPerTruckPerDay > 0
      ? (totalCostPerKwh * kwhPerTruckPerDay) / kmPerTruckPerDay
      : 0;

  // ── Savings ───────────────────────────────────────────────────────────────
  const savingsPerKm    = (dieselCostPerKm ?? 0) - electricCostPerKm;
  const savingsPercent  = dieselCostPerKm > 0
    ? (savingsPerKm / dieselCostPerKm) * 100
    : 0;

  // ── Annual savings at scale ───────────────────────────────────────────────
  const { trucks }          = system;
  const { kwhPerTruckPerYear } = demand;
  const annualKmPerTruck    = (kmPerTruckPerDay ?? 0) * (system.operatingDays ?? 0);
  const annualSavingsPerTruck = savingsPerKm * annualKmPerTruck;
  const totalAnnualSavings    = annualSavingsPerTruck * trucks;

  // ── Viability classification ──────────────────────────────────────────────
  const relativeSaving = dieselCostPerKm > 0 ? savingsPerKm / dieselCostPerKm : 0;

  let viable = false;
  let label;

  if (relativeSaving > MARGIN_BAND) {
    viable = true;
    label  = 'Viable';
  } else if (relativeSaving >= -MARGIN_BAND) {
    viable = false;
    label  = 'Marginal';
  } else {
    viable = false;
    label  = 'Not Viable';
  }

  // ── Cost split breakdown (for waterfall chart) ────────────────────────────
  // Show how the total electric cost per km is built up
  const electricitySharePerKm = kmPerTruckPerDay > 0
    ? ((system.electricityCost ?? 0) * kwhPerTruckPerDay) / kmPerTruckPerDay
    : 0;
  const batterySharePerKm = kmPerTruckPerDay > 0
    ? (pricing.batteryLeasePerKwh * kwhPerTruckPerDay) / kmPerTruckPerDay
    : 0;
  const platformSharePerKm = kmPerTruckPerDay > 0
    ? (pricing.platformFeePerKwh * kwhPerTruckPerDay) / kmPerTruckPerDay
    : 0;

  return {
    electricCostPerKm,
    dieselCostPerKm: dieselCostPerKm ?? 0,
    savingsPerKm,
    savingsPercent,
    annualSavingsPerTruck,
    totalAnnualSavings,
    viable,
    label,
    // Cost component breakdown per km
    costBreakdownPerKm: {
      electricity: electricitySharePerKm,
      batteryLease: batterySharePerKm,
      platformFee:  platformSharePerKm,
    },
  };
}
