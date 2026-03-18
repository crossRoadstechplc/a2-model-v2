/**
 * scenarioCompare.js – Chart data builder for the 3-scenario comparison.
 *
 * Uses `runAllComparisonScenarios()` from presets.js to run Base / Optimistic /
 * Stress through the same engine and returns structured arrays ready for
 * Recharts grouped bar charts.
 *
 * Pure function — no side effects. Safe to call in useMemo with no deps
 * (preset inputs are compile-time constants).
 *
 * ── Output shapes ─────────────────────────────────────────────────────────────
 *
 * irrData   – [{ scenario, key, Battery, Platform, Fleet, trucks }]
 *             IRR as % per entity for each scenario
 *
 * costData  – [{ scenario, key, electricPerKm, dieselPerKm, totalPerKwh, trucks }]
 *             cost metrics per scenario for cost-comparison bar chart
 *
 * metaMap   – { [key]: meta } theme/label metadata keyed by scenario key
 */

import { runAllComparisonScenarios } from '../scenarios/presets';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function irrPct(v) {
  if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return null;
  return parseFloat(Math.min(200, Math.max(-50, v * 100)).toFixed(2));
}

function safe(v, fallback = 0) {
  return (typeof v === 'number' && isFinite(v) && !isNaN(v)) ? v : fallback;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build all scenario comparison datasets in a single pass.
 * Runs the engine 3 times (one per preset).
 *
 * @returns {{ irrData, costData, metaMap }}
 */
export function buildScenarioCompareData() {
  const scenarios = runAllComparisonScenarios();

  const irrData  = [];
  const costData = [];
  const metaMap  = {};

  for (const { key, meta, inputs, snapshot } of scenarios) {
    metaMap[key] = meta;

    const bat  = snapshot?.batteryCompany;
    const plat = snapshot?.platformCompany;
    const flt  = snapshot?.fleetCompany;
    const viz  = snapshot?.viability;
    const pr   = snapshot?.pricing;

    irrData.push({
      scenario: meta.label,
      key,
      Battery:  irrPct(bat?.irr),
      Platform: irrPct(plat?.irr),
      Fleet:    irrPct(flt?.irr),
      trucks:   inputs.system.trucks,
    });

    costData.push({
      scenario:     meta.label,
      key,
      electricPerKm: safe(viz?.electricCostPerKm),
      dieselPerKm:   safe(viz?.dieselCostPerKm),
      totalPerKwh:   safe(pr?.totalCostPerKwh),
      trucks:        inputs.system.trucks,
    });
  }

  return { irrData, costData, metaMap };
}
