/**
 * pricingEngine.js – Step 4 of the simulation pipeline
 *
 * Determines the price each entity must charge to hit its target IRR.
 * This is the "first-principles pricing" approach: rather than assuming
 * a price, we solve for the minimum price that makes each investment viable.
 *
 * ── Price basis: $/kWh ───────────────────────────────────────────────────────
 * Pricing is denominated in $/kWh (energy throughput) because kWh is the
 * natural unit that connects demand, infrastructure, and cost recovery.
 * The implied monthly lease per truck is derived as:
 *
 *   leasePerTruckPerMonth = pricePerKwh × kwhPerTruckPerYear / 12
 *
 * ── Battery pricing ──────────────────────────────────────────────────────────
 * Battery Co recovers its pack capex + opex by charging Fleet per kWh.
 * We solve for the $/kWh such that NPV(battery cash flows, batteryIRR) = 0.
 *
 *   annualVolume = kwhPerYear         (kWh delivered = units sold)
 *   annualOpex   = maintenance + platform infra fee
 *   capex        = batteryPool × batteryCost
 *
 * ── Platform pricing ─────────────────────────────────────────────────────────
 * Platform Co recovers its infrastructure capex + opex by charging Fleet per kWh.
 * We solve the same way at the platform's target IRR.
 *
 *   annualVolume = kwhPerYear
 *   annualOpex   = platformOpex (total annual operating cost)
 *   capex        = totalPlatformCapex
 *
 * ── Total cost to Fleet per kWh ──────────────────────────────────────────────
 *   totalCostPerKwh = electricityCost + batteryLeasePerKwh + platformFeePerKwh
 *
 * The Fleet's total annual energy spend:
 *   totalEnergyCost = kwhPerYear × totalCostPerKwh
 */

import { solvePriceForTargetIRR } from '../finance/priceSolver';

/**
 * @param {object} battery          – { batteryCost, batteryIRR, batteryBufferMultiplier,
 *                                      batteryReservePercent, maintenancePerPackPerMonth,
 *                                      platformFeePerMonth, batteryLifeYears }
 * @param {object} platform         – { platformIRR, platformOpex }
 * @param {object} capex            – output of computeCapex()
 * @param {object} demand           – output of computeDemand()
 * @param {object} system           – { electricityCost, trucks }
 * @param {object} settings         – { projectionYears }
 * @returns {object}                pricing solution
 */
export function computePricing(battery, platform, capex, demand, system, settings) {
  const { kwhPerYear, kwhPerTruckPerYear } = demand;
  const { electricityCost }                = system;
  const { projectionYears }                = settings;

  // ── Battery Company annual opex ───────────────────────────────────────────
  // Maintenance on all packs + the platform infrastructure fee Battery pays
  const batteryMaintenanceAnnual = capex.battery.packsRequired
    * (battery.maintenancePerPackPerMonth ?? 0) * 12;
  const batteryPlatformFeeAnnual = (battery.platformFeePerMonth ?? 0) * 12;
  const batteryAnnualOpex        = batteryMaintenanceAnnual + batteryPlatformFeeAnnual;

  // ── Solve: Battery lease $/kWh ────────────────────────────────────────────
  const batteryLeaseResult = kwhPerYear > 0 && capex.battery.total > 0
    ? solvePriceForTargetIRR({
        targetIRR:    battery.batteryIRR ?? 0.18,
        capex:        capex.battery.total,
        annualVolume: kwhPerYear,
        annualOpex:   batteryAnnualOpex,
        years:        Math.max(1, Math.round(projectionYears)),
        minPrice:     0,
        maxPrice:     50,       // $/kWh upper bound (battery lease alone)
      })
    : { pricePerUnit: 0, found: false, iterations: 0, reason: 'No volume or capex' };

  const batteryLeasePerKwh = batteryLeaseResult.pricePerUnit ?? 0;

  // ── Platform Company annual opex ──────────────────────────────────────────
  // Use the all-in platformOpex figure directly (staff, power, software, etc.)
  const platformAnnualOpex = platform.platformOpex ?? 0;

  // ── Solve: Platform fee $/kWh ─────────────────────────────────────────────
  const platformFeeResult = kwhPerYear > 0 && capex.platform.total > 0
    ? solvePriceForTargetIRR({
        targetIRR:    platform.platformIRR ?? 0.15,
        capex:        capex.platform.total,
        annualVolume: kwhPerYear,
        annualOpex:   platformAnnualOpex,
        years:        Math.max(1, Math.round(projectionYears)),
        minPrice:     0,
        maxPrice:     100,      // $/kWh upper bound (platform fee)
      })
    : { pricePerUnit: 0, found: false, iterations: 0, reason: 'No volume or capex' };

  const platformFeePerKwh = platformFeeResult.pricePerUnit ?? 0;

  // ── Total cost stack ──────────────────────────────────────────────────────
  const totalCostPerKwh = (electricityCost ?? 0) + batteryLeasePerKwh + platformFeePerKwh;

  // ── Derive monthly truck-level equivalents ────────────────────────────────
  // Useful for comparing against the "old" per-truck-per-month pricing model
  const kwhPerTruckPerMonth = kwhPerTruckPerYear / 12;

  const batteryLeasePerTruckMonth  = batteryLeasePerKwh  * kwhPerTruckPerMonth;
  const platformFeePerTruckMonth   = platformFeePerKwh   * kwhPerTruckPerMonth;
  const electricityPerTruckMonth   = (electricityCost ?? 0) * kwhPerTruckPerMonth;
  const totalEnergyPerTruckMonth   = totalCostPerKwh      * kwhPerTruckPerMonth;

  return {
    // Per-kWh prices (the primary pricing basis)
    electricityCostPerKwh: electricityCost ?? 0,
    batteryLeasePerKwh,
    platformFeePerKwh,
    totalCostPerKwh,

    // Per-truck-per-month equivalents (for display and comparison)
    batteryLeasePerTruckMonth,
    platformFeePerTruckMonth,
    electricityPerTruckMonth,
    totalEnergyPerTruckMonth,

    // Annual opex references (used by entity financials engine)
    batteryAnnualOpex,
    platformAnnualOpex,

    // Solver metadata (for debugging / UI flags)
    solverDetails: {
      batteryFound:      batteryLeaseResult.found,
      batteryIterations: batteryLeaseResult.iterations,
      batteryReason:     batteryLeaseResult.reason,
      platformFound:     platformFeeResult.found,
      platformIterations: platformFeeResult.iterations,
      platformReason:    platformFeeResult.reason,
    },
  };
}
