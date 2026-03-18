/**
 * payback.js – Payback period calculations
 *
 * Two variants are provided:
 *
 *   paybackPeriod(cashflows)
 *     Simple (non-discounted) payback: counts calendar years until
 *     cumulative cash flows turn positive.
 *
 *   discountedPayback(cashflows, rate)
 *     Discounted payback: uses present-value-adjusted cash flows.
 *     More conservative because future inflows are worth less.
 *
 * Convention:
 *   cashflows[0] = Year 0 (negative = upfront capex)
 *   cashflows[t] = net cash flow for period t
 *
 * Both functions perform fractional-year interpolation so they return
 * e.g. 3.4 years rather than just "4" when payback falls mid-period.
 *
 * Return value:
 *   • A positive number (years) when payback is achieved within the array.
 *   • null when payback is never achieved (investment not recovered).
 *   • null for invalid / empty input.
 */

/**
 * Simple (undiscounted) payback period.
 *
 * @param {number[]} cashflows
 *   cashflows[0] should be negative (the investment).
 *   cashflows[1..n] are the periodic net inflows.
 *
 * @returns {number|null}
 *   Years until cumulative cash flows reach zero, with fractional interpolation.
 *   Returns null if the investment is never recovered.
 *
 * @example
 *   paybackPeriod([-1000, 300, 400, 500])
 *   // Year 1 cumul: −700
 *   // Year 2 cumul: −300
 *   // Year 3 cumul: +200  → payback ≈ 2 + 300/500 = 2.6 years
 */
export function paybackPeriod(cashflows) {
  if (!Array.isArray(cashflows) || cashflows.length < 2) return null;

  // Cumulative sum starts at Year 0 (the investment outflow)
  let cumulative = 0;

  for (let t = 0; t < cashflows.length; t++) {
    const cf = cashflows[t];
    if (!isFinite(cf)) continue; // skip non-finite entries

    const prevCumulative = cumulative;
    cumulative += cf;

    // Payback achieved when cumulative turns non-negative
    if (cumulative >= 0 && t > 0) {
      if (cf === 0) return t; // edge case: zero inflow at the exact crossover

      // Interpolate: how far into period t does the crossover happen?
      // fraction = how much of the deficit at start of period t we need to recover
      const fraction = Math.abs(prevCumulative) / cf;
      return t - 1 + fraction; // t-1 full periods passed, then fraction of period t
    }
  }

  return null; // investment never fully recovered within the given horizon
}

/**
 * Discounted payback period.
 * Each cash flow is discounted at the given rate before accumulating.
 *
 * @param {number[]} cashflows
 *   cashflows[0] = Year 0 (negative investment)
 *   cashflows[t] = Year t cash flow
 *
 * @param {number} rate
 *   Periodic discount rate as a decimal (e.g. 0.10 for 10%).
 *   Must be > -1.
 *
 * @returns {number|null}
 *   Discounted payback period in years, or null if not recovered.
 *
 * @example
 *   discountedPayback([-1000, 300, 400, 500], 0.10)  // longer than simple payback
 */
export function discountedPayback(cashflows, rate) {
  if (!Array.isArray(cashflows) || cashflows.length < 2) return null;
  if (!isFinite(rate) || rate <= -1) return null;

  // Discount each cash flow to present value, then apply simple payback logic
  const discounted = cashflows.map((cf, t) => {
    if (!isFinite(cf)) return 0;
    if (t === 0) return cf; // Year 0 not discounted
    const factor = Math.pow(1 + rate, t);
    return isFinite(factor) && factor !== 0 ? cf / factor : 0;
  });

  return paybackPeriod(discounted);
}
