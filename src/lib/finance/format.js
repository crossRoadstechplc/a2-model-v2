/**
 * format.js – Display formatting utilities
 *
 * All functions:
 *   • Accept a numeric value (or null/undefined/NaN)
 *   • Return a ready-to-render string
 *   • Never throw — return a safe fallback string on bad input
 *   • Are pure and side-effect-free
 *
 * Three primary exports match the spec:
 *   formatCurrency(value, opts?)
 *   formatPercent(value, opts?)
 *   formatNumber(value, opts?)
 *
 * Additional helpers are exported for chart axes and special cases:
 *   formatMillions, formatCAGR, formatMultiple, formatInt, formatDelta
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns true when a value is a finite, non-NaN number. */
function _isValid(v) {
  return typeof v === 'number' && isFinite(v) && !isNaN(v);
}

/**
 * Builds a sign prefix string.
 * @param {number} value
 * @param {boolean} showSign  – always prepend + or − (not just −)
 * @returns {string}
 */
function _sign(value, showSign) {
  if (value < 0) return '−'; // Unicode minus (looks better than ASCII hyphen)
  if (showSign && value > 0) return '+';
  return '';
}

// ─── formatCurrency ───────────────────────────────────────────────────────────

/**
 * Format a USD dollar value with compact suffixes (K / M / B).
 *
 * @param {number} value  – raw dollar amount (can be negative)
 * @param {object} [opts]
 * @param {boolean} [opts.compact=true]    – use K/M/B suffixes
 * @param {number}  [opts.decimals=1]      – decimal places in compact mode
 * @param {boolean} [opts.showSign=false]  – prefix + for positive values
 * @param {string}  [opts.fallback='—']    – string to show for null/NaN/Infinity
 * @returns {string}
 *
 * @example
 *   formatCurrency(1_450_000)               // → "$1.5M"
 *   formatCurrency(-320_000)                // → "−$320K"
 *   formatCurrency(850)                     // → "$850"
 *   formatCurrency(1_450_000, { compact: false })  // → "$1,450,000"
 *   formatCurrency(null)                    // → "—"
 */
export function formatCurrency(value, opts = {}) {
  const {
    compact  = true,
    decimals = 1,
    showSign = false,
    fallback = '—',
  } = opts;

  if (!_isValid(value)) return fallback;

  const abs  = Math.abs(value);
  const sign = _sign(value, showSign);

  if (!compact) {
    // Full number with thousands separators
    return `${sign}$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(abs)}`;
  }

  // Compact tiers
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(decimals)}B`;
  if (abs >= 1_000_000)     return `${sign}$${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000)         return `${sign}$${(abs / 1_000).toFixed(decimals)}K`;

  // Below $1,000 — show raw integer
  return `${sign}$${abs.toFixed(0)}`;
}

// ─── formatPercent ────────────────────────────────────────────────────────────

/**
 * Format a number as a percentage string.
 *
 * By default, the value is treated as already a percentage (e.g. 72.3 → "72.3%").
 * Set opts.isDecimal = true when the value is a decimal fraction (e.g. 0.723 → "72.3%").
 *
 * @param {number} value  – percentage value (or decimal when isDecimal = true)
 * @param {object} [opts]
 * @param {number}  [opts.decimals=1]      – decimal places
 * @param {boolean} [opts.showSign=false]  – prefix + for positive values
 * @param {boolean} [opts.isDecimal=false] – multiply by 100 before displaying
 * @param {string}  [opts.fallback='—']
 * @returns {string}
 *
 * @example
 *   formatPercent(72.3)                    // → "72.3%"
 *   formatPercent(0.723, { isDecimal: true })  // → "72.3%"
 *   formatPercent(-5.5, { showSign: true })    // → "−5.5%"
 *   formatPercent(12,   { showSign: true })    // → "+12.0%"
 */
export function formatPercent(value, opts = {}) {
  const {
    decimals  = 1,
    showSign  = false,
    isDecimal = false,
    fallback  = '—',
  } = opts;

  if (!_isValid(value)) return fallback;

  const display = isDecimal ? value * 100 : value;
  const sign    = _sign(display, showSign);
  const abs     = Math.abs(display);

  return `${sign}${abs.toFixed(decimals)}%`;
}

// ─── formatNumber ─────────────────────────────────────────────────────────────

/**
 * Format a plain number with optional compact suffix and thousands separators.
 *
 * @param {number} value
 * @param {object} [opts]
 * @param {boolean} [opts.compact=false]   – use K/M/B suffixes
 * @param {number}  [opts.decimals=0]      – decimal places (compact mode uses 1)
 * @param {boolean} [opts.showSign=false]  – prefix + for positive values
 * @param {string}  [opts.suffix='']       – optional unit suffix (e.g. ' kWh')
 * @param {string}  [opts.fallback='—']
 * @returns {string}
 *
 * @example
 *   formatNumber(12_345)                             // → "12,345"
 *   formatNumber(2_400_000, { compact: true })       // → "2.4M"
 *   formatNumber(1_500, { suffix: ' kWh' })          // → "1,500 kWh"
 *   formatNumber(0.75, { decimals: 2 })              // → "0.75"
 */
export function formatNumber(value, opts = {}) {
  const {
    compact  = false,
    decimals = 0,
    showSign = false,
    suffix   = '',
    fallback = '—',
  } = opts;

  if (!_isValid(value)) return fallback;

  const abs  = Math.abs(value);
  const sign = _sign(value, showSign);

  if (compact) {
    const d = decimals > 0 ? decimals : 1; // compact always shows at least 1dp
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(d)}B${suffix}`;
    if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(d)}M${suffix}`;
    if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(d)}K${suffix}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);

  return `${sign}${formatted}${suffix}`;
}

// ─── Additional helpers ───────────────────────────────────────────────────────

/**
 * Compact currency for chart axis labels.
 * Always uses the shortest representation: $1.4M, $320K, $850.
 */
export function formatMillions(value) {
  return formatCurrency(value, { compact: true, decimals: 1 });
}

/**
 * Format a CAGR or rate expressed as a decimal (0.153 → "15.3%").
 * Alias for formatPercent with isDecimal = true.
 */
export function formatCAGR(value, decimals = 1) {
  return formatPercent(value, { decimals, isDecimal: true });
}

/**
 * Format a plain integer with thousands separators (no suffix).
 * @example formatInt(12345)  → "12,345"
 */
export function formatInt(value) {
  if (!_isValid(value)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

/**
 * Format an investment multiple (e.g. 2.4x, 1.0x).
 * @example formatMultiple(2.37)  → "2.4x"
 */
export function formatMultiple(value, decimals = 1) {
  if (!_isValid(value)) return '—';
  return `${Math.abs(value).toFixed(decimals)}x`;
}

/**
 * Format a signed delta with colour-friendly sign indicators.
 * Positive → "+$1.2M" or "+5.3%", negative → "−$800K" or "−2.1%".
 *
 * @param {number} value
 * @param {'currency'|'percent'|'number'} type
 * @returns {string}
 */
export function formatDelta(value, type = 'currency') {
  if (!_isValid(value)) return '—';
  switch (type) {
    case 'currency': return formatCurrency(value, { showSign: true });
    case 'percent':  return formatPercent(value,  { showSign: true });
    default:         return formatNumber(value,   { showSign: true });
  }
}

/**
 * Format a payback period (in years) to a human-readable string.
 * @example formatPayback(3.4)   → "3.4 yrs"
 * @example formatPayback(null)  → "Never"
 */
export function formatPayback(years) {
  if (years === null || years === undefined) return 'Never';
  if (!_isValid(years)) return '—';
  if (years >= 999) return '>horizon';
  return `${years.toFixed(1)} yrs`;
}

/**
 * Format an IRR expressed as a decimal fraction (e.g. 0.182 → "18.2%").
 *
 * Handles:
 *   null / undefined / NaN / Infinity → fallback ('—' by default)
 *   IRR > cap (runaway solver result)  → ">Xpct%" (e.g. ">999%")
 *
 * @param {number|null} irr       – fractional IRR (e.g. 0.18 = 18%)
 * @param {object}      [opts]
 * @param {number}  [opts.decimals=1]    – decimal places
 * @param {number}  [opts.cap=9.99]      – fractional cap above which ">X%" is shown
 * @param {string}  [opts.fallback='—']  – string for invalid values
 * @returns {string}
 *
 * @example
 *   formatIRR(0.182)              // → "18.2%"
 *   formatIRR(null)               // → "—"
 *   formatIRR(12.5)               // → ">999%"  (value > cap 9.99 treated as runaway)
 */
export function formatIRR(irr, opts = {}) {
  const { decimals = 1, cap = 9.99, fallback = '—' } = opts;
  if (irr === null || irr === undefined || !isFinite(irr) || isNaN(irr)) return fallback;
  if (irr > cap) return `>${Math.round(cap * 100)}%`;
  return formatPercent(irr * 100, { decimals });
}
