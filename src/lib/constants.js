/**
 * constants.js – shared model constants used across engine, UI, and charts.
 *
 * Import specific constants rather than the whole module to keep bundle
 * tree-shaking effective.
 *
 * These values must stay in sync with the corresponding defaults in
 * src/data/defaults.js. When changing a target IRR default, update both.
 */

// ─── IRR hurdle rates ─────────────────────────────────────────────────────────

/** Default Battery Co. target IRR (fraction). Mirrors DEFAULT_BATTERY.batteryIRR. */
export const DEFAULT_BATTERY_IRR  = 0.18;

/** Default Platform Co. target IRR (fraction). Mirrors DEFAULT_PLATFORM.platformIRR. */
export const DEFAULT_PLATFORM_IRR = 0.15;

/**
 * Fleet Co. minimum viable IRR (fraction).
 * Not a solver target — used for constraint checks and chart reference lines.
 */
export const FLEET_IRR_HURDLE     = 0.10;

// ─── IRR display thresholds ───────────────────────────────────────────────────

/**
 * An entity IRR within this many pp below its target is shown as "amber"
 * rather than "red" in the KPI delta badge.
 * (3 percentage points expressed as a fraction.)
 */
export const IRR_AMBER_TOLERANCE  = 0.03;

/**
 * IRR values above this fraction are capped for chart display purposes
 * (avoids runaway solver results blowing up chart scale).
 * Expressed as a fraction: 5.0 = 500%.
 */
export const IRR_CHART_CAP_FRACTION = 5.0;

/** IRR chart Y-axis max, as a percentage integer. */
export const IRR_CHART_MAX_PCT    = 50;

// ─── Truck sweep config ───────────────────────────────────────────────────────

/** Default range for the sensitivity sweep used in the Insights page charts. */
export const SWEEP_CONFIG = {
  minTrucks: 5,
  maxTrucks: 150,
  step:      5,
};

// ─── Viability labels ─────────────────────────────────────────────────────────
// These must exactly match the strings produced by viabilityEngine.js.

export const VIABILITY = {
  VIABLE:     'Viable',
  MARGINAL:   'Marginal',
  NOT_VIABLE: 'Not Viable',
};

// ─── Utilization warning thresholds ──────────────────────────────────────────
// Kept here (not in constraintEngine.js) so both the engine and the
// InfrastructurePanel UI can import from one place.

export const UTIL_THRESHOLDS = {
  CHARGER_WARN:  85,   // % — constraint triggered above this
  CHARGER_AMBER: 70,   // % — amber visual warning
  BAY_WARN:      80,   // % — constraint triggered above this
  BAY_AMBER:     65,   // % — amber visual warning
};
