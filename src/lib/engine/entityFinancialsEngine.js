/**
 * entityFinancialsEngine.js – Step 5 of the simulation pipeline
 *
 * Computes P&L, cash flows, IRR, NPV, and payback for each of the three
 * entities: Battery Company, Platform Company, and Fleet Company.
 *
 * ── Cash flow model ──────────────────────────────────────────────────────────
 * Each entity's cash flow array has the form:
 *   [−capex, EBITDA_yr1, EBITDA_yr2, …, EBITDA_yrN]
 *
 * For this snapshot engine we assume flat (Year-1 steady-state) EBITDA
 * across all projection years. Growth-adjusted multi-year projections are
 * handled separately by the annual runModel projector.
 *
 * ── Revenue model per entity ─────────────────────────────────────────────────
 *
 * Battery Co:
 *   Revenue = kwhPerYear × batteryLeasePerKwh
 *   Opex    = pack maintenance + platform infra fee
 *   EBITDA  = Revenue − Opex
 *
 * Platform Co:
 *   Revenue = kwhPerYear × platformFeePerKwh
 *   Opex    = all-in platformOpex
 *   EBITDA  = Revenue − Opex
 *
 * Fleet Co:
 *   Revenue     = freightRevenuePerTruck × trucks × 12
 *   EnergyCost  = kwhPerYear × totalCostPerKwh  (pays Battery + Platform + Grid)
 *   OtherOpex   = fleetOpexPerTruck × trucks × 12  (drivers, maintenance, insurance)
 *   EBITDA      = Revenue − EnergyCost − OtherOpex
 *   (Truck depreciation is tracked but excluded from EBITDA per standard convention)
 */

import { irr }          from '../finance/irr';
import { npv }          from '../finance/npv';
import { paybackPeriod } from '../finance/payback';

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Build a flat annual cash flow array and compute IRR / NPV / payback.
 * @param {number} capexAmount    upfront investment (positive number, Year 0 = -capexAmount)
 * @param {number} annualEBITDA   flat EBITDA repeated for each projection year
 * @param {number} years          number of projection years
 * @param {number} [discountRate] rate for NPV calculation (default 0.12)
 * @returns {{ cashFlows, irr, npv, payback }}
 */
function _buildFinancials(capexAmount, annualEBITDA, years, discountRate = 0.12) {
  const n = Math.max(1, Math.round(years));

  // Year 0: outflow; Years 1..N: steady-state EBITDA
  const cashFlows = [-Math.abs(capexAmount), ...Array(n).fill(annualEBITDA)];

  const irrValue     = irr(cashFlows);
  const npvValue     = npv(discountRate, cashFlows);
  const paybackValue = paybackPeriod(cashFlows);

  return { cashFlows, irr: irrValue, npv: npvValue, payback: paybackValue };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {object} battery   – battery assumption group
 * @param {object} platform  – platform assumption group
 * @param {object} fleet     – fleet assumption group
 * @param {object} system    – { trucks }
 * @param {object} capex     – output of computeCapex()
 * @param {object} demand    – output of computeDemand()
 * @param {object} pricing   – output of computePricing()
 * @param {object} settings  – { projectionYears }
 * @returns {{ batteryCompany, platformCompany, fleetCompany }}
 */
export function computeEntityFinancials(
  battery, platform, fleet, system, capex, demand, pricing, settings,
) {
  const { kwhPerYear }         = demand;
  const { projectionYears }    = settings;
  const { trucks }             = system;

  const {
    batteryLeasePerKwh,
    platformFeePerKwh,
    totalCostPerKwh,
    batteryAnnualOpex,
    platformAnnualOpex,
  } = pricing;

  // ── Battery Company ───────────────────────────────────────────────────────

  const batteryRevenue    = kwhPerYear * batteryLeasePerKwh;
  const batteryEBITDA     = batteryRevenue - batteryAnnualOpex;
  const batteryEBITDAMargin = batteryRevenue > 0
    ? (batteryEBITDA / batteryRevenue) * 100
    : 0;

  // Straight-line depreciation of pack capex over batteryLifeYears
  const batteryDepreciation = battery.batteryLifeYears > 0
    ? capex.battery.total / battery.batteryLifeYears
    : 0;
  const batteryEBIT = batteryEBITDA - batteryDepreciation;

  const batteryFin = _buildFinancials(
    capex.battery.total,
    batteryEBITDA,
    projectionYears,
    battery.batteryIRR ?? 0.18,  // discount NPV at the entity's own hurdle rate
  );

  // ── Platform Company ──────────────────────────────────────────────────────

  const platformRevenue       = kwhPerYear * platformFeePerKwh;
  const platformEBITDA        = platformRevenue - platformAnnualOpex;
  const platformEBITDAMargin  = platformRevenue > 0
    ? (platformEBITDA / platformRevenue) * 100
    : 0;

  // Straight-line amortization of platform capex
  const capexAmortYears    = platform.capexAmortizationYears ?? 10;
  const platformAmortAnnual = capex.platform.total / capexAmortYears;
  const platformEBIT        = platformEBITDA - platformAmortAnnual;

  const platformFin = _buildFinancials(
    capex.platform.total,
    platformEBITDA,
    projectionYears,
    platform.platformIRR ?? 0.15,
  );

  // ── Fleet Company ─────────────────────────────────────────────────────────

  // Freight revenue (Fleet's top line)
  const freightRevenuePerTruck = fleet.freightRevenuePerTruck ?? 0;
  const fleetRevenue           = freightRevenuePerTruck * trucks * 12;

  // Energy cost: the fleet pays for electricity + battery lease + platform fee
  const fleetEnergyCost = kwhPerYear * totalCostPerKwh;

  // Direct fleet opex: drivers, maintenance, insurance (not including energy or fees)
  // fleetOpexPerTruck is the bundled per-truck per-month cost
  const fleetOpexPerTruck = fleet.fleetOpexPerTruck ?? 0;
  const fleetOtherOpex    = fleetOpexPerTruck * trucks * 12;

  // Gross profit (before energy cost)
  const fleetGrossProfit    = fleetRevenue - fleetOtherOpex;
  const fleetGrossMargin    = fleetRevenue > 0
    ? (fleetGrossProfit / fleetRevenue) * 100
    : 0;

  // EBITDA (after energy, before truck depreciation)
  const fleetEBITDA         = fleetRevenue - fleetEnergyCost - fleetOtherOpex;
  const fleetEBITDAMargin   = fleetRevenue > 0
    ? (fleetEBITDA / fleetRevenue) * 100
    : 0;

  // Truck depreciation (straight-line)
  const truckLifeYears    = fleet.truckLifeYears ?? 8;
  const truckDepreciation = truckLifeYears > 0
    ? capex.fleet.total / truckLifeYears
    : 0;
  const fleetEBIT         = fleetEBITDA - truckDepreciation;

  const fleetFin = _buildFinancials(
    capex.fleet.total,
    fleetEBITDA,
    projectionYears,
    0.20,  // typical fleet/logistics hurdle rate
  );

  return {
    batteryCompany: {
      annualRevenue:   batteryRevenue,
      annualOpex:      batteryAnnualOpex,
      annualEBITDA:    batteryEBITDA,
      ebitdaMargin:    batteryEBITDAMargin,
      depreciation:    batteryDepreciation,
      annualEBIT:      batteryEBIT,
      capex:           capex.battery.total,
      ...batteryFin,
    },

    platformCompany: {
      annualRevenue:   platformRevenue,
      annualOpex:      platformAnnualOpex,
      annualEBITDA:    platformEBITDA,
      ebitdaMargin:    platformEBITDAMargin,
      amortization:    platformAmortAnnual,
      annualEBIT:      platformEBIT,
      capex:           capex.platform.total,
      ...platformFin,
    },

    fleetCompany: {
      annualRevenue:    fleetRevenue,
      annualEnergyCost: fleetEnergyCost,
      annualOtherOpex:  fleetOtherOpex,
      annualEBITDA:     fleetEBITDA,
      ebitdaMargin:     fleetEBITDAMargin,
      grossProfit:      fleetGrossProfit,
      grossMargin:      fleetGrossMargin,
      depreciation:     truckDepreciation,
      annualEBIT:       fleetEBIT,
      capex:            capex.fleet.total,
      ...fleetFin,
    },
  };
}
