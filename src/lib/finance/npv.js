/**
 * npv.js – Net Present Value calculation
 *
 * Convention:
 *   cashflows[0]  = Year 0 (typically negative: the upfront investment)
 *   cashflows[t]  = cash flow received at end of period t
 *   rate          = periodic discount rate as a decimal (e.g. 0.12 for 12%)
 *
 * Formula:
 *   NPV = Σ  CF_t / (1 + r)^t    for t = 0 … n
 *
 * Edge cases handled:
 *   • Empty or non-array cashflows → 0
 *   • Non-finite values in cashflows → skip that period (treat as 0)
 *   • rate ≤ -1 → undefined discount factor → returns NaN
 *   • rate = 0 → valid: NPV = simple sum of all cash flows
 */

/**
 * Calculate the Net Present Value of a cash flow series.
 *
 * @param {number} rate
 *   Periodic discount rate as a decimal.
 *   Must be > -1. Pass 0 for an undiscounted sum.
 *
 * @param {number[]} cashflows
 *   Array of cash flows indexed by period (cashflows[0] = Year 0).
 *
 * @returns {number}
 *   NPV in the same currency units as the cash flows.
 *   Returns NaN if the rate is ≤ -1 (undefined discount factor).
 *   Returns 0 for an empty array.
 *
 * @example
 *   npv(0.10, [-1000, 400, 400, 400])   // → ~−5.26  (barely NPV-negative at 10%)
 *   npv(0.05, [-1000, 400, 400, 400])   // → +89.0  (positive at 5%)
 */
export function npv(rate, cashflows) {
  // ── Validation ───────────────────────────────────────────────────────────

  if (!Array.isArray(cashflows) || cashflows.length === 0) return 0;

  // rate ≤ -1 makes (1 + rate)^t zero or negative → mathematically undefined
  if (!isFinite(rate) || rate <= -1) return NaN;

  // ── Computation ──────────────────────────────────────────────────────────

  let result = 0;

  for (let t = 0; t < cashflows.length; t++) {
    const cf = cashflows[t];

    // Skip any non-finite values rather than poisoning the entire sum
    if (!isFinite(cf)) continue;

    if (t === 0) {
      // Year 0 is not discounted
      result += cf;
    } else {
      const discountFactor = Math.pow(1 + rate, t);

      // If the discount factor overflowed (extremely high rate + long tenor)
      // treat that period's contribution as effectively zero
      if (!isFinite(discountFactor) || discountFactor === 0) continue;

      result += cf / discountFactor;
    }
  }

  return result;
}

/**
 * Convenience overload: NPV where the initial investment is passed separately
 * and the cashflows array represents Year 1 … n inflows.
 *
 * Equivalent to npv(rate, [-capex, ...inflows])
 *
 * @param {number} rate
 * @param {number} capex   Upfront cost as a positive number (will be negated)
 * @param {number[]} inflows  Year 1 … n cash flows
 * @returns {number}
 *
 * @example
 *   npvWithCapex(0.10, 1000, [400, 400, 400])   // same as npv(0.10, [-1000, 400, 400, 400])
 */
export function npvWithCapex(rate, capex, inflows) {
  if (!Array.isArray(inflows)) return NaN;
  return npv(rate, [-Math.abs(capex), ...inflows]);
}
