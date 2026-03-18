/**
 * Platform Company engine.
 *
 * Revenue sources:
 *   1. Platform access fees from Fleet trucks (per truck/month)
 *   2. Infrastructure slot fees from Battery Company (fixed monthly)
 *
 * Cost structure:
 *   1. Station opex (power, field maintenance) – scales with stations
 *   2. Staff costs (fixed, may grow with scale)
 *   3. Software / monitoring
 *   4. Capex amortization (straight-line over capexAmortizationYears)
 *
 * @param {object} platformAssumptions  – from store.platform
 * @param {object} fleetAssumptions     – needed for truck count (shared driver)
 * @param {number} projectionYears
 * @param {object} multipliers          – { revenueMultiplier, costMultiplier, growthMultiplier }
 * @returns {Array} one object per projected year
 */
export function projectPlatform(platformAssumptions, fleetAssumptions, projectionYears, multipliers) {
  const p = platformAssumptions;
  const { revenueMultiplier, costMultiplier, growthMultiplier } = multipliers;

  // Capex amortized annually (straight-line, all stations built at start)
  const annualCapexAmortization =
    (p.numStations * p.capexPerStation) / p.capexAmortizationYears;

  const years = [];

  for (let yr = 1; yr <= projectionYears; yr++) {
    // Fleet truck count grows each year (driven by fleet growth rate)
    const fleetGrowthFactor = Math.pow(
      1 + fleetAssumptions.annualGrowthRate * growthMultiplier,
      yr - 1,
    );
    const trucksThisYear = Math.round(fleetAssumptions.numTrucks * fleetGrowthFactor);

    // ── Revenue ──────────────────────────────────────────────────────────
    const platformFeeRevenue =
      trucksThisYear * p.platformFeePerTruckPerMonth * 12 * revenueMultiplier;

    const batteryInfraRevenue =
      p.infraFeeFromBatteryPerMonth * 12 * revenueMultiplier;

    const totalRevenue = platformFeeRevenue + batteryInfraRevenue;

    // ── Costs ─────────────────────────────────────────────────────────────
    const stationOpex = p.numStations * p.opexPerStationPerMonth * 12 * costMultiplier;
    const staffCost   = p.staffCostPerMonth * 12 * costMultiplier;
    const softwareCost = p.softwareCostPerMonth * 12 * costMultiplier;
    const totalOpex   = stationOpex + staffCost + softwareCost;
    const totalCosts  = totalOpex + annualCapexAmortization;

    // ── P&L ───────────────────────────────────────────────────────────────
    const ebitda       = totalRevenue - totalOpex;           // before capex amortization
    const ebit         = totalRevenue - totalCosts;          // after amortization
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    years.push({
      year: yr,
      trucksThisYear,
      // Revenue breakdown
      platformFeeRevenue,
      batteryInfraRevenue,
      totalRevenue,
      // Cost breakdown
      stationOpex,
      staffCost,
      softwareCost,
      annualCapexAmortization,
      totalOpex,
      totalCosts,
      // Earnings
      ebitda,
      ebit,
      ebitdaMargin,
    });
  }

  return years;
}
