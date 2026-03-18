/**
 * irr.js – Internal Rate of Return solver
 *
 * Convention used throughout this file:
 *   cashflows[0]  = Year 0 cash flow (negative = upfront investment)
 *   cashflows[1]  = Year 1 cash flow
 *   …
 *   cashflows[n]  = Year n cash flow
 *
 * Strategy:
 *   1. Validate inputs early and return null for degenerate cases.
 *   2. Try Newton-Raphson (fast, quadratic convergence when well-conditioned).
 *   3. If NR fails or diverges, fall back to bisection (slower but always
 *      converges if a bracket [lo, hi] can be found with sign change).
 *   4. Return null when no finite real solution exists.
 */

// ─── Internal: evaluate NPV polynomial at a given rate ────────────────────────
function _npvPoly(cashflows, rate) {
  // Guard: rate cannot be exactly -1 (division by zero)
  if (rate <= -1) return NaN;

  let result = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const denominator = Math.pow(1 + rate, t);
    if (!isFinite(denominator) || denominator === 0) return NaN;
    result += cashflows[t] / denominator;
  }
  return result;
}

// ─── Internal: evaluate the derivative of NPV w.r.t. rate ─────────────────────
function _npvPolyDerivative(cashflows, rate) {
  if (rate <= -1) return NaN;

  let result = 0;
  for (let t = 1; t < cashflows.length; t++) {
    const denominator = Math.pow(1 + rate, t + 1);
    if (!isFinite(denominator) || denominator === 0) return NaN;
    // d/dr [ CF / (1+r)^t ] = -t * CF / (1+r)^(t+1)
    result -= (t * cashflows[t]) / denominator;
  }
  return result;
}

// ─── Newton-Raphson solver ────────────────────────────────────────────────────
function _irrNewtonRaphson(cashflows, initialGuess, maxIter, tolerance) {
  let rate = initialGuess;

  for (let i = 0; i < maxIter; i++) {
    // Clamp rate away from -1 to avoid blow-up
    if (rate <= -0.9999) rate = -0.9999;

    const f  = _npvPoly(cashflows, rate);
    const df = _npvPolyDerivative(cashflows, rate);

    // Non-finite f or df means we've overflowed — give up this attempt
    if (!isFinite(f) || !isFinite(df)) return null;

    // Flat derivative means we're at an inflection — NR is unreliable here
    if (Math.abs(df) < 1e-14) return null;

    const newRate = rate - f / df;

    if (!isFinite(newRate)) return null;

    // Converged?
    if (Math.abs(newRate - rate) < tolerance) {
      // Final sanity: the returned rate must satisfy |NPV| ≈ 0
      if (Math.abs(_npvPoly(cashflows, newRate)) > 1e-4) return null;
      return newRate;
    }

    rate = newRate;
  }

  return null; // exceeded max iterations
}

// ─── Bisection solver (fallback) ──────────────────────────────────────────────
function _irrBisection(cashflows, lo, hi, maxIter, tolerance) {
  let fLo = _npvPoly(cashflows, lo);
  let fHi = _npvPoly(cashflows, hi);

  if (!isFinite(fLo) || !isFinite(fHi)) return null;

  // Bisection requires opposite signs at the endpoints
  if (fLo * fHi > 0) return null;

  let mid = lo;
  for (let i = 0; i < maxIter; i++) {
    mid = (lo + hi) / 2;
    const fMid = _npvPoly(cashflows, mid);

    if (!isFinite(fMid)) return null;

    // Converged when NPV is near zero OR bracket is tiny
    if (Math.abs(fMid) < tolerance || (hi - lo) / 2 < tolerance) return mid;

    if (fLo * fMid <= 0) {
      hi  = mid;
      fHi = fMid;
    } else {
      lo  = mid;
      fLo = fMid;
    }
  }

  return mid;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the Internal Rate of Return for a series of cash flows.
 *
 * @param {number[]} cashflows
 *   Array of cash flows indexed by period.
 *   cashflows[0] must be negative (the initial investment).
 *   Example: [-1000, 300, 400, 500]
 *
 * @param {number} [guess=0.1]
 *   Initial rate guess for Newton-Raphson (0.1 = 10%).
 *   The solver also tries several additional starting points automatically.
 *
 * @returns {number|null}
 *   IRR as a decimal (e.g. 0.15 for 15%), or null if no real solution found.
 *
 * @example
 *   irr([-1000, 300, 400, 500])  // → ~0.1714 (≈ 17.1 %)
 */
export function irr(cashflows, guess = 0.1) {
  // ── Input validation ─────────────────────────────────────────────────────

  if (!Array.isArray(cashflows) || cashflows.length < 2) {
    return null; // need at least one outflow and one inflow period
  }

  // Verify all values are finite numbers
  if (cashflows.some((cf) => !isFinite(cf))) return null;

  // A valid IRR requires at least one sign change in the cash flow series.
  // Without a sign change the polynomial has no positive real root.
  const hasPositive = cashflows.some((cf) => cf > 0);
  const hasNegative = cashflows.some((cf) => cf < 0);
  if (!hasPositive || !hasNegative) return null;

  // ── Newton-Raphson with multiple starting guesses ────────────────────────

  const NR_MAX_ITER  = 200;
  const NR_TOLERANCE = 1e-10;

  // Try a spread of starting points to improve chances of finding the root
  const startingGuesses = [guess, 0.0, 0.5, -0.1, 1.0, 2.0, 0.25, -0.5];

  for (const g of startingGuesses) {
    const candidate = _irrNewtonRaphson(cashflows, g, NR_MAX_ITER, NR_TOLERANCE);
    if (candidate !== null && isFinite(candidate) && candidate > -1) {
      return candidate;
    }
  }

  // ── Bisection fallback ───────────────────────────────────────────────────

  // Scan for a bracket where the NPV changes sign.
  // Search range: [-0.99 … 10.0] in coarse steps.
  const BISECT_MAX_ITER = 300;
  const SCAN_POINTS     = [-0.99, -0.5, -0.1, 0, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0];

  for (let i = 0; i < SCAN_POINTS.length - 1; i++) {
    const lo = SCAN_POINTS[i];
    const hi = SCAN_POINTS[i + 1];
    const fLo = _npvPoly(cashflows, lo);
    const fHi = _npvPoly(cashflows, hi);

    if (isFinite(fLo) && isFinite(fHi) && fLo * fHi <= 0) {
      const candidate = _irrBisection(cashflows, lo, hi, BISECT_MAX_ITER, 1e-10);
      if (candidate !== null && isFinite(candidate)) return candidate;
    }
  }

  // No real solution found
  return null;
}
