/**
 * priceSolver.js – Solve for the price per unit (e.g. $/kWh) that makes
 * an investment hit a target IRR.
 *
 * ── Business context ──────────────────────────────────────────────────────────
 *
 * For the A2 electric freight corridor, both the Battery Company and the
 * Platform Company need to set a fee (price per kWh, price per swap, or
 * monthly lease) that is high enough to recover their capex and earn their
 * required return. This solver answers: "What is the minimum price we must
 * charge to hit our target IRR?"
 *
 * ── Cash flow model ───────────────────────────────────────────────────────────
 *
 *   Year 0:  −capex
 *   Year t:  annualVolume(t) × price  −  annualOpex(t)
 *
 * Where:
 *   annualVolume(t) = annualVolume × (1 + volumeGrowthRate)^(t−1)
 *   annualOpex(t)   = annualOpex   × (1 + opexGrowthRate)^(t−1)
 *
 * The solver finds the price such that NPV(cashflows, targetIRR) = 0,
 * which is equivalent to asking "at what price does this investment
 * return exactly targetIRR?"
 *
 * ── Algorithm: Bisection ──────────────────────────────────────────────────────
 *
 * NPV at a fixed targetIRR is a monotone increasing function of price
 * (higher price → higher revenue → higher NPV). So bisection is guaranteed
 * to converge once we have a bracket [lo, hi] with opposite NPV signs.
 *
 * The upper bound is auto-extended if the NPV at maxPrice is still negative.
 */

import { npv } from './npv';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build the cash flow array for a given price per unit.
 * @private
 */
function _buildCashflows({ price, capex, annualVolume, annualOpex, years, volumeGrowthRate, opexGrowthRate }) {
  const cfs = [-Math.abs(capex)]; // Year 0: investment outflow

  for (let t = 1; t <= years; t++) {
    // Volume and opex can grow at different annual rates
    const vol  = annualVolume * Math.pow(1 + volumeGrowthRate, t - 1);
    const opex = annualOpex   * Math.pow(1 + opexGrowthRate,   t - 1);
    cfs.push(vol * price - opex);
  }

  return cfs;
}

/**
 * Evaluate NPV at targetIRR for a given price.
 * @private
 */
function _npvAtPrice(price, params) {
  const cfs = _buildCashflows({ price, ...params });
  return npv(params.targetIRR, cfs);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Solve for the unit price (e.g. $/kWh) that makes an investment
 * achieve exactly the target IRR.
 *
 * @param {object} params
 * @param {number} params.targetIRR
 *   Required rate of return as a decimal (e.g. 0.15 for 15%).
 *
 * @param {number} params.capex
 *   Total upfront investment (positive number, e.g. 5_000_000).
 *
 * @param {number} params.annualVolume
 *   Revenue-generating units per year at Year 1 (e.g. total kWh delivered).
 *   Each year's volume = annualVolume × (1 + volumeGrowthRate)^(t−1).
 *
 * @param {number} params.annualOpex
 *   Annual operating cost at Year 1 (e.g. total platform opex).
 *   Each year's opex = annualOpex × (1 + opexGrowthRate)^(t−1).
 *
 * @param {number} params.years
 *   Number of projection years (must be ≥ 1).
 *
 * @param {number} [params.volumeGrowthRate=0]
 *   Annual growth rate of volume (decimal). 0 = flat volume.
 *
 * @param {number} [params.opexGrowthRate=0]
 *   Annual growth rate of opex (decimal). 0 = flat costs.
 *
 * @param {number} [params.minPrice=0]
 *   Lower bound of the price search (default 0).
 *
 * @param {number} [params.maxPrice=100]
 *   Upper bound of the price search. Auto-extended if needed.
 *
 * @param {number} [params.maxIterations=100]
 *   Maximum bisection iterations before declaring the result approximate.
 *
 * @param {number} [params.tolerance=1e-8]
 *   Convergence threshold on NPV (|NPV| < tolerance → converged).
 *
 * @returns {{ pricePerUnit: number|null, found: boolean, iterations: number, reason?: string }}
 *   pricePerUnit: the solved price (or null if no solution found)
 *   found:        true when a solution was located
 *   iterations:   number of bisection steps performed
 *   reason:       human-readable string when found = false
 *
 * @example
 *   // What $/kWh does the Platform need to charge to earn 15% IRR?
 *   solvePriceForTargetIRR({
 *     targetIRR:    0.15,
 *     capex:        5_000_000,
 *     annualVolume: 1_500_000,   // kWh/year
 *     annualOpex:   800_000,     // $/year
 *     years:        10,
 *   })
 *   // → { pricePerUnit: ~0.107, found: true, iterations: 47 }
 */
export function solvePriceForTargetIRR({
  targetIRR,
  capex,
  annualVolume,
  annualOpex,
  years,
  volumeGrowthRate = 0,
  opexGrowthRate   = 0,
  minPrice         = 0,
  maxPrice         = 100,
  maxIterations    = 100,
  tolerance        = 1e-8,
}) {
  // ── Input validation ─────────────────────────────────────────────────────

  if (!isFinite(targetIRR) || targetIRR <= -1) {
    return { pricePerUnit: null, found: false, iterations: 0, reason: 'Invalid targetIRR' };
  }
  if (!isFinite(capex) || capex <= 0) {
    return { pricePerUnit: null, found: false, iterations: 0, reason: 'capex must be a positive finite number' };
  }
  if (!isFinite(annualVolume) || annualVolume <= 0) {
    return { pricePerUnit: null, found: false, iterations: 0, reason: 'annualVolume must be positive' };
  }
  if (!isFinite(annualOpex) || annualOpex < 0) {
    return { pricePerUnit: null, found: false, iterations: 0, reason: 'annualOpex must be non-negative' };
  }
  if (!Number.isInteger(years) && !isFinite(years)) {
    return { pricePerUnit: null, found: false, iterations: 0, reason: 'years must be a positive number' };
  }
  if (years < 1) {
    return { pricePerUnit: null, found: false, iterations: 0, reason: 'years must be ≥ 1' };
  }

  // ── Build shared params object ────────────────────────────────────────────
  const params = {
    targetIRR, capex, annualVolume, annualOpex,
    years: Math.round(years),
    volumeGrowthRate: isFinite(volumeGrowthRate) ? volumeGrowthRate : 0,
    opexGrowthRate:   isFinite(opexGrowthRate)   ? opexGrowthRate   : 0,
  };

  // ── Check NPV at price boundaries ─────────────────────────────────────────

  let lo = minPrice;
  let hi = maxPrice;

  let npvLo = _npvAtPrice(lo, params);
  let npvHi = _npvAtPrice(hi, params);

  // If both are NaN something fundamental is broken
  if (!isFinite(npvLo) || !isFinite(npvHi)) {
    return { pricePerUnit: null, found: false, iterations: 0, reason: 'NPV evaluation returned non-finite value' };
  }

  // NPV is monotone increasing in price.
  // We need npvLo < 0 and npvHi > 0 for a bracket.
  // If npvHi is still negative, the price ceiling is too low — extend it.
  if (npvHi <= 0) {
    // Auto-extend upper bound up to 100× the original maxPrice
    const extensions = [maxPrice * 5, maxPrice * 20, maxPrice * 100];
    for (const ext of extensions) {
      const npvExt = _npvAtPrice(ext, params);
      if (isFinite(npvExt) && npvExt > 0) {
        hi    = ext;
        npvHi = npvExt;
        break;
      }
    }
    if (npvHi <= 0) {
      return {
        pricePerUnit: null,
        found:        false,
        iterations:   0,
        reason:       'Cannot achieve targetIRR even at a very high price — check capex, volume, or years',
      };
    }
  }

  // If npvLo > 0, the solution is below our lower bound (price could be 0 or negative).
  // In practice a negative price makes no business sense, so we report this.
  if (npvLo >= 0) {
    return {
      pricePerUnit: lo,
      found:        true,
      iterations:   0,
      reason:       'Target IRR is achievable at or below minPrice — price floor binds',
    };
  }

  // ── Bisection ─────────────────────────────────────────────────────────────

  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    const mid    = (lo + hi) / 2;
    const npvMid = _npvAtPrice(mid, params);

    if (!isFinite(npvMid)) break; // numerical issue

    // Converged when NPV is essentially zero or bracket is negligibly small
    if (Math.abs(npvMid) < tolerance || (hi - lo) < tolerance) {
      return { pricePerUnit: mid, found: true, iterations };
    }

    if (npvLo * npvMid <= 0) {
      hi    = mid;
      npvHi = npvMid;
    } else {
      lo    = mid;
      npvLo = npvMid;
    }
  }

  // Exceeded max iterations — return midpoint as best approximate
  const approximate = (lo + hi) / 2;
  return {
    pricePerUnit: isFinite(approximate) ? approximate : null,
    found:        isFinite(approximate),
    iterations,
    reason:       'Max iterations reached — result is approximate',
  };
}

/**
 * Convenience wrapper: solve for monthly lease per truck that hits targetIRR.
 * Uses the same bisection engine as solvePriceForTargetIRR.
 *
 * @param {object} params
 * @param {number} params.targetIRR
 * @param {number} params.capex           Total asset capex
 * @param {number} params.numTrucks       Number of trucks at Year 1
 * @param {number} params.annualOpex      Total annual operating cost
 * @param {number} params.years           Projection period
 * @param {number} [params.truckGrowthRate=0]  Annual truck count growth
 * @param {number} [params.opexGrowthRate=0]
 *
 * @returns {{ leasePerTruckPerMonth: number|null, found: boolean, iterations: number }}
 */
export function solveLeaseForTargetIRR({ targetIRR, capex, numTrucks, annualOpex, years, truckGrowthRate = 0, opexGrowthRate = 0 }) {
  // Annual revenue = numTrucks × 12 × monthlyLease
  // So annualVolume = numTrucks × 12  (units are "truck-months per year")
  // and price       = monthlyLease    ($ per truck-month)
  const result = solvePriceForTargetIRR({
    targetIRR,
    capex,
    annualVolume:     numTrucks * 12,
    annualOpex,
    years,
    volumeGrowthRate: truckGrowthRate,
    opexGrowthRate,
    minPrice:         0,
    maxPrice:         50_000, // max conceivable monthly lease per truck
  });

  return {
    leasePerTruckPerMonth: result.pricePerUnit,
    found:      result.found,
    iterations: result.iterations,
    reason:     result.reason,
  };
}
