/**
 * src/lib/finance/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Barrel export for all finance utilities.
 *
 * Import from this file instead of individual modules:
 *
 *   import { irr, npv, paybackPeriod, solvePriceForTargetIRR,
 *            formatCurrency, formatPercent, formatNumber } from '../lib/finance';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Module map
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  irr.js          irr(cashflows, guess?)
 *                    → number | null
 *
 *  npv.js          npv(rate, cashflows)
 *                    → number
 *                  npvWithCapex(rate, capex, inflows)
 *                    → number
 *
 *  payback.js      paybackPeriod(cashflows)
 *                    → number | null
 *                  discountedPayback(cashflows, rate)
 *                    → number | null
 *
 *  priceSolver.js  solvePriceForTargetIRR({ targetIRR, capex, annualVolume,
 *                    annualOpex, years, volumeGrowthRate?, opexGrowthRate?,
 *                    minPrice?, maxPrice? })
 *                    → { pricePerUnit, found, iterations, reason? }
 *                  solveLeaseForTargetIRR({ targetIRR, capex, numTrucks,
 *                    annualOpex, years, truckGrowthRate?, opexGrowthRate? })
 *                    → { leasePerTruckPerMonth, found, iterations, reason? }
 *
 *  format.js       formatCurrency(value, opts?)
 *                  formatPercent(value, opts?)
 *                  formatNumber(value, opts?)
 *                  formatMillions(value)
 *                  formatCAGR(value, decimals?)
 *                  formatInt(value)
 *                  formatMultiple(value, decimals?)
 *                  formatDelta(value, type?)
 *                  formatPayback(years)
 *
 *  metrics.js      ebitdaMargin(ebitda, revenue)
 *                  grossMargin(grossProfit, revenue)
 *                  cagr(startValue, endValue, years)
 *                    (npv and irr also exported here for backward compat)
 */

// ── Core financial solvers ────────────────────────────────────────────────────
export { irr }                                from './irr';
export { npv, npvWithCapex }                  from './npv';
export { paybackPeriod, discountedPayback }   from './payback';
export {
  solvePriceForTargetIRR,
  solveLeaseForTargetIRR,
}                                             from './priceSolver';

// ── Display formatters ────────────────────────────────────────────────────────
export {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatMillions,
  formatCAGR,
  formatInt,
  formatMultiple,
  formatDelta,
  formatPayback,
  formatIRR,
}                                             from './format';

// ── Margin / ratio metrics ────────────────────────────────────────────────────
export { ebitdaMargin, grossMargin, cagr }    from './metrics';
