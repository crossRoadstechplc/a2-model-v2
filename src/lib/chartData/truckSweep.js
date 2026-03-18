/**
 * truckSweep.js – Chart data builder: run the engine over a range of truck counts.
 *
 * Keeps ALL other inputs fixed at `baseInputs` and sweeps only `system.trucks`.
 * This isolates the effect of fleet scale on pricing, IRR, and viability —
 * the most important sensitivity for corridor investors.
 *
 * ── Key insight this enables ──────────────────────────────────────────────────
 * The platform carries a large fixed capex (~$5M). Every kWh of additional
 * throughput (more trucks) reduces the per-kWh fee needed to recover that capex.
 * The sweep makes this scale curve directly visible.
 *
 * ── Performance ───────────────────────────────────────────────────────────────
 * 30 data points × 7-step pipeline ≈ 30–50 ms synchronously in the browser.
 * Safe to call inside useMemo with dependencies on the relevant store slices.
 *
 * ── Output shape (one object per truck count) ────────────────────────────────
 * {
 *   trucks              – truck count for this data point
 *   batteryIRR          – Battery Co. IRR (%, clamped ±200 for chart legibility)
 *   platformIRR         – Platform Co. IRR (%)
 *   fleetIRR            – Fleet Co. IRR (%)
 *   electricityCostPerKwh  – flat electricity component ($/kWh)
 *   batteryLeasePerKwh     – Battery Co. lease component ($/kWh)
 *   platformFeePerKwh      – Platform Co. fee component ($/kWh) — key scale metric
 *   totalCostPerKwh        – sum of above three ($/kWh)
 *   electricCostPerKm   – total EV cost per km per truck
 *   dieselCostPerKm     – diesel baseline per km (flat; varies with system assumption)
 *   viable              – true if electric is cheaper than diesel
 * }
 *
 * Null is used for IRR when the solver fails (Recharts skips null — shows gap).
 */

import { runScenario } from '../engine/runScenario';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert fractional IRR to percentage, clamped to chart-friendly range.
 * Returns null (→ gap in chart) if the value is non-finite or the solver failed.
 */
function irrPct(v) {
  if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return null;
  return parseFloat(Math.min(200, Math.max(-50, v * 100)).toFixed(2));
}

function safe(v, fallback = 0) {
  return (typeof v === 'number' && isFinite(v) && !isNaN(v)) ? v : fallback;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a truck-sweep dataset by running the full simulation for each truck count.
 *
 * @param {object} baseInputs  – { system, battery, platform, fleet, settings }
 * @param {object} [opts]
 * @param {number} [opts.minTrucks=5]    – lowest truck count to sweep
 * @param {number} [opts.maxTrucks=150]  – highest truck count to sweep
 * @param {number} [opts.step=5]         – increment per data point
 * @returns {Array<SweepPoint>}
 */
export function buildTruckSweep(baseInputs, opts = {}) {
  const { minTrucks = 5, maxTrucks = 150, step = 5 } = opts;

  const points = [];

  for (let trucks = minTrucks; trucks <= maxTrucks; trucks += step) {
    const inputs = {
      ...baseInputs,
      system: { ...baseInputs.system, trucks },
    };

    try {
      const r = runScenario(inputs);

      points.push({
        trucks,

        // ── Returns ────────────────────────────────────────────────────────
        batteryIRR:  irrPct(r.batteryCompany?.irr),
        platformIRR: irrPct(r.platformCompany?.irr),
        fleetIRR:    irrPct(r.fleetCompany?.irr),

        // ── Pricing (per-kWh components for stacked chart) ─────────────────
        electricityCostPerKwh: safe(r.pricing?.electricityCostPerKwh),
        batteryLeasePerKwh:    safe(r.pricing?.batteryLeasePerKwh),
        platformFeePerKwh:     safe(r.pricing?.platformFeePerKwh),
        totalCostPerKwh:       safe(r.pricing?.totalCostPerKwh),

        // ── Viability ──────────────────────────────────────────────────────
        electricCostPerKm: safe(r.viability?.electricCostPerKm),
        dieselCostPerKm:   safe(r.viability?.dieselCostPerKm),
        viable:            r.viability?.viable ?? false,
      });
    } catch (_) {
      // Solver failed at this truck count — skip the data point.
      // The chart will show a gap in the lines here.
    }
  }

  return points;
}

/**
 * Derive key insight values from a completed sweep dataset.
 * Used for callout annotations on charts.
 *
 * @param {Array<SweepPoint>} data
 * @param {number} batteryTarget  – fractional target IRR (e.g. 0.18)
 * @param {number} platformTarget – fractional target IRR (e.g. 0.15)
 * @returns {{ allViableAt, evBreakevenAt, minCostPerKwh, maxCostPerKwh }}
 */
export function deriveSweepInsights(data, batteryTarget = 0.18, platformTarget = 0.15) {
  if (!data?.length) return {};

  const bTarget = batteryTarget * 100;
  const pTarget = platformTarget * 100;

  // Truck count where all three entities first meet their minimum return
  const allViableAt = data.find((d) =>
    d.batteryIRR  !== null && d.batteryIRR  >= bTarget &&
    d.platformIRR !== null && d.platformIRR >= pTarget &&
    d.fleetIRR    !== null && d.fleetIRR    > 0,
  )?.trucks ?? null;

  // Truck count where EV becomes cheaper than diesel
  const evBreakevenAt = data.find((d) => d.viable)?.trucks ?? null;

  // Cost per kWh range (first and last points)
  const maxCostPerKwh = data[0]?.totalCostPerKwh ?? null;
  const minCostPerKwh = data[data.length - 1]?.totalCostPerKwh ?? null;

  return { allViableAt, evBreakevenAt, maxCostPerKwh, minCostPerKwh };
}
