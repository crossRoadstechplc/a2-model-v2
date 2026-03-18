/**
 * Battery Company engine.
 *
 * Revenue source:
 *   Battery lease fees from Fleet (per truck/month × number of trucks)
 *
 * Cost structure:
 *   1. Battery capex amortized over batteryLifeYears (replacement cycle)
 *   2. Maintenance per pack per month
 *   3. Platform infrastructure fee (paid to Platform Co.)
 *
 * Note: Battery pack count = numTrucks × packsPerTruck, grows with fleet.
 *
 * @param {object} batteryAssumptions
 * @param {object} fleetAssumptions
 * @param {number} projectionYears
 * @param {object} multipliers
 * @returns {Array} one object per projected year
 */
export function projectBattery(batteryAssumptions, fleetAssumptions, projectionYears, multipliers) {
  const b = batteryAssumptions;
  const { revenueMultiplier, costMultiplier, growthMultiplier } = multipliers;

  const years = [];

  for (let yr = 1; yr <= projectionYears; yr++) {
    // Truck count and pack count for this year
    const fleetGrowthFactor = Math.pow(
      1 + fleetAssumptions.annualGrowthRate * growthMultiplier,
      yr - 1,
    );
    const trucksThisYear = Math.round(fleetAssumptions.numTrucks * fleetGrowthFactor);
    const packsThisYear  = Math.ceil(trucksThisYear * b.packsPerTruck);

    // ── Revenue ──────────────────────────────────────────────────────────
    const leaseRevenue =
      trucksThisYear * b.leasePerTruckPerMonth * 12 * revenueMultiplier;

    const totalRevenue = leaseRevenue;

    // ── Costs ─────────────────────────────────────────────────────────────
    // Amortize pack capex over battery life (treat initial fleet pack investment)
    const annualPackCapex = (packsThisYear * b.costPerPack) / b.batteryLifeYears;

    const maintenanceCost =
      packsThisYear * b.maintenancePerPackPerMonth * 12 * costMultiplier;

    const platformFee = b.platformFeePerMonth * 12 * costMultiplier;

    const totalOpex  = maintenanceCost + platformFee;
    const totalCosts = totalOpex + annualPackCapex;

    // ── P&L ───────────────────────────────────────────────────────────────
    const ebitda       = totalRevenue - totalOpex;
    const ebit         = totalRevenue - totalCosts;
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    years.push({
      year: yr,
      trucksThisYear,
      packsThisYear,
      // Revenue
      leaseRevenue,
      totalRevenue,
      // Costs
      annualPackCapex,
      maintenanceCost,
      platformFee,
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
