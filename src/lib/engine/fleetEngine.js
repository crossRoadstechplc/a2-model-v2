/**
 * Fleet Company engine.
 *
 * Revenue source:
 *   Freight revenue per truck per month (contracted haulage rates)
 *
 * Cost structure:
 *   1. Truck depreciation (purchase price / truckLifeYears)
 *   2. Driver cost per truck
 *   3. Maintenance per truck
 *   4. Insurance per truck
 *   5. Platform access fee (paid to Platform Co.)
 *   6. Battery lease (paid to Battery Co.)
 *
 * Fleet grows by annualGrowthRate each year (numTrucks compounds).
 *
 * @param {object} fleetAssumptions
 * @param {number} projectionYears
 * @param {object} multipliers
 * @returns {Array} one object per projected year
 */
export function projectFleet(fleetAssumptions, projectionYears, multipliers) {
  const f = fleetAssumptions;
  const { revenueMultiplier, costMultiplier, growthMultiplier } = multipliers;

  const years = [];

  for (let yr = 1; yr <= projectionYears; yr++) {
    // Truck count grows each year
    const growthFactor = Math.pow(1 + f.annualGrowthRate * growthMultiplier, yr - 1);
    const trucksThisYear = Math.round(f.numTrucks * growthFactor);

    // ── Revenue ──────────────────────────────────────────────────────────
    const freightRevenue =
      trucksThisYear * f.freightRevenuePerTruckPerMonth * 12 * revenueMultiplier;

    const totalRevenue = freightRevenue;

    // ── Costs ─────────────────────────────────────────────────────────────
    const truckDepreciation =
      (trucksThisYear * f.truckPurchasePrice) / f.truckLifeYears;

    const driverCost =
      trucksThisYear * f.driverCostPerTruckPerMonth * 12 * costMultiplier;

    const maintenanceCost =
      trucksThisYear * f.maintenancePerTruckPerMonth * 12 * costMultiplier;

    const insuranceCost =
      trucksThisYear * f.insurancePerTruckPerMonth * 12 * costMultiplier;

    // Inter-company fees (these are revenues for Platform and Battery)
    const platformFees =
      trucksThisYear * f.platformFeePerTruckPerMonth * 12;

    const batteryLeaseFees =
      trucksThisYear * f.batteryLeasePerTruckPerMonth * 12;

    const totalOpex =
      driverCost + maintenanceCost + insuranceCost + platformFees + batteryLeaseFees;

    const totalCosts = totalOpex + truckDepreciation;

    // ── P&L ───────────────────────────────────────────────────────────────
    const grossProfit  = totalRevenue - driverCost - maintenanceCost - insuranceCost;
    const ebitda       = totalRevenue - totalOpex;
    const ebit         = totalRevenue - totalCosts;
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    years.push({
      year: yr,
      trucksThisYear,
      // Revenue
      freightRevenue,
      totalRevenue,
      // Cost breakdown
      truckDepreciation,
      driverCost,
      maintenanceCost,
      insuranceCost,
      platformFees,
      batteryLeaseFees,
      totalOpex,
      totalCosts,
      // Earnings
      grossProfit,
      grossMarginPct,
      ebitda,
      ebit,
      ebitdaMargin,
    });
  }

  return years;
}
