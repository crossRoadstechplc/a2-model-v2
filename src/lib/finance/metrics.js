/**
 * metrics.js – Financial ratio, margin, and growth helpers
 *
 * Also re-exports npv, irr, and paybackPeriod from their dedicated modules
 * so any code that previously imported from metrics.js still works.
 */

// ── Re-exports for backward compatibility ─────────────────────────────────────
export { npv }           from './npv';
export { irr }           from './irr';
export { paybackPeriod } from './payback';

// ── CAGR ──────────────────────────────────────────────────────────────────────

/**
 * Compound Annual Growth Rate between two values.
 * @param {number} startValue
 * @param {number} endValue
 * @param {number} years
 * @returns {number} CAGR as a decimal (e.g. 0.15 for 15%)
 */
export function cagr(startValue, endValue, years) {
  if (!startValue || startValue <= 0 || years <= 0) return 0;
  if (!isFinite(startValue) || !isFinite(endValue) || !isFinite(years)) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

// ── Margin helpers ────────────────────────────────────────────────────────────

/**
 * EBITDA margin as a percentage (0–100).
 * Returns 0 when revenue is zero to avoid division by zero.
 */
export function ebitdaMargin(ebitda, revenue) {
  if (!revenue || revenue === 0) return 0;
  return (ebitda / revenue) * 100;
}

/**
 * Gross margin as a percentage (0–100).
 */
export function grossMargin(grossProfit, revenue) {
  if (!revenue || revenue === 0) return 0;
  return (grossProfit / revenue) * 100;
}
