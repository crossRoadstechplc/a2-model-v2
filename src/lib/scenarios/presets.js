/**
 * presets.js – Scenario preset definitions for side-by-side comparison.
 *
 * These three scenarios are designed to show a spectrum of corridor economics:
 *
 *   Base Case   – Management case; 20 trucks at plan assumptions.
 *                 Demonstrates why scale is critical.
 *
 *   Optimistic  – At-scale operations; 100 trucks, low-cost electricity,
 *                 competitive diesel pricing, mature supply chain.
 *                 Demonstrates full viability potential.
 *
 *   Stress Case – Adverse conditions; 12 trucks, cost overruns, cheap diesel.
 *                 Demonstrates downside risk.
 *
 * Each preset is a set of PARTIAL overrides applied on top of the store defaults.
 * Any key not present in a preset inherits its default value.
 *
 * Key modeling insight:
 *   The platform's $5M fixed capex is spread across all kWh throughput.
 *   With 20 trucks the platform fee is ~$1.12/kWh; with 100 trucks it falls
 *   to ~$0.20/kWh — scale is the primary viability lever.
 */

import {
  DEFAULT_SYSTEM,
  DEFAULT_BATTERY,
  DEFAULT_PLATFORM,
  DEFAULT_FLEET,
  DEFAULT_SETTINGS,
} from '../../data/defaults';

import { runScenario } from '../engine/runScenario';

// ─── Scenario definitions ─────────────────────────────────────────────────────

export const COMPARISON_SCENARIOS = {

  // ── Base Case ──────────────────────────────────────────────────────────────
  base: {
    key: 'base',
    meta: {
      label:       'Base Case',
      tagline:     'Management plan at initial scale',
      description: '20 trucks at plan assumptions. Demonstrates why corridor economics require scale to achieve viability.',
      color:       'blue',
      theme: {
        topBar:  'bg-blue-600',
        border:  'border-blue-200',
        bg:      'bg-blue-50/40',
        text:    'text-blue-700',
        badge:   'blue',
        button:  'bg-blue-600 hover:bg-blue-700',
      },
    },
    // Base uses all defaults — no overrides
    system:   {},
    battery:  {},
    platform: {},
    fleet:    {},
    settings: {},
  },

  // ── Optimistic Case ────────────────────────────────────────────────────────
  optimistic: {
    key: 'optimistic',
    meta: {
      label:       'Optimistic',
      tagline:     'At-scale with favourable conditions',
      description: '100 trucks, mature battery supply, cheap renewable electricity, and competitive diesel pricing.',
      color:       'emerald',
      theme: {
        topBar:  'bg-emerald-600',
        border:  'border-emerald-200',
        bg:      'bg-emerald-50/40',
        text:    'text-emerald-700',
        badge:   'green',
        button:  'bg-emerald-600 hover:bg-emerald-700',
      },
    },
    system: {
      trucks:          100,      // 5× scale — spreads fixed platform capex
      kwhPerSwap:      220,      // slightly more efficient pack density
      operatingDays:   320,      // more utilisation days
      electricityCost: 0.08,     // dedicated renewable supply agreement
      dieselCostPerKm: 0.45,     // realistic heavy-truck diesel cost
    },
    battery: {
      batteryCost:              22_000, // maturing supply chain ($28K → $22K)
      batteryCycles:             2_500, // improved chemistry
      batteryIRR:                 0.20, // higher return target met at scale
      batteryBufferMultiplier:    1.30, // tighter rotation pool (technology matures)
      batteryReservePercent:      0.08, // lower reserve % needed
      maintenancePerPackPerMonth:   45, // lower unit maintenance cost
      batteryLifeYears:              6, // longer pack life
    },
    platform: {
      platformOpex:        1_500_000,   // efficient operations at scale
      platformIRR:              0.18,   // higher target achieved through volume
      chargeTimeMinutes:          55,   // faster charger technology
      chargingWindowHours:        12,   // extended daily window
    },
    fleet: {
      truckCost:              110_000,  // bulk purchase discount
      freightRevenuePerTruck:  22_000,  // premium freight routes
      fleetOpexPerTruck:        5_000,  // efficiency gains
    },
    settings: {
      projectionYears: 7,               // longer horizon; scale pays off over time
    },
  },

  // ── Stress Case ────────────────────────────────────────────────────────────
  stress: {
    key: 'stress',
    meta: {
      label:       'Stress Case',
      tagline:     'Adverse conditions and slow adoption',
      description: '12 trucks, high energy costs, platform cost overruns, and diesel competition remains strong.',
      color:       'red',
      theme: {
        topBar:  'bg-red-600',
        border:  'border-red-200',
        bg:      'bg-red-50/40',
        text:    'text-red-700',
        badge:   'red',
        button:  'bg-red-600 hover:bg-red-700',
      },
    },
    system: {
      trucks:          12,       // slow adoption
      kwhPerSwap:      260,      // heavier vehicles / larger packs
      operatingDays:   260,      // fewer operating days
      electricityCost: 0.17,     // no preferred supply rate
      dieselCostPerKm: 0.16,     // diesel remains competitively cheap
      kmPerTruckPerDay: 350,     // shorter routes
    },
    battery: {
      batteryCost:              36_000, // supply chain shortages
      batteryCycles:             1_600, // lower quality / faster degradation
      batteryIRR:                 0.10, // downgraded return target
      batteryBufferMultiplier:    1.80, // larger reserve pool required
      batteryReservePercent:      0.15, // high reserve fraction
      maintenancePerPackPerMonth:   85, // higher field maintenance
      batteryLifeYears:              4, // shorter replacement cycle
    },
    platform: {
      platformFixedCapex:   6_500_000,  // civil construction cost overruns
      platformOpex:         2_400_000,  // high fixed cost base
      platformIRR:               0.08,  // downgraded return target
      chargeTimeMinutes:           75,  // older / cheaper charger technology
      chargingWindowHours:          8,  // constrained operating window
    },
    fleet: {
      truckCost:              135_000,  // no bulk discount
      freightRevenuePerTruck:  13_000,  // pricing pressure from diesel competitors
      fleetOpexPerTruck:        6_800,  // cost inflation
    },
    settings: {
      projectionYears: 5,
    },
  },
};

/** Ordered list of scenario keys for UI rendering. */
export const COMPARISON_ORDER = ['base', 'optimistic', 'stress'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Merges a comparison scenario preset with all defaults to produce a complete
 * set of inputs suitable for passing to `runScenario()`.
 *
 * @param {string} scenarioKey  one of COMPARISON_ORDER
 * @returns {{ system, battery, platform, fleet, settings }}
 */
export function buildScenarioInputs(scenarioKey) {
  const preset = COMPARISON_SCENARIOS[scenarioKey];
  if (!preset) throw new Error(`[presets] Unknown comparison scenario: "${scenarioKey}"`);

  return {
    system:   { ...DEFAULT_SYSTEM,   ...preset.system   },
    battery:  { ...DEFAULT_BATTERY,  ...preset.battery  },
    platform: { ...DEFAULT_PLATFORM, ...preset.platform },
    fleet:    { ...DEFAULT_FLEET,    ...preset.fleet    },
    settings: { ...DEFAULT_SETTINGS, ...preset.settings },
  };
}

/**
 * Runs `runScenario` for all comparison presets and returns an array of results.
 * Pure function — no side effects, safe to call in useMemo.
 *
 * @returns {Array<{ key, meta, inputs, snapshot }>}
 */
export function runAllComparisonScenarios() {
  return COMPARISON_ORDER.map((key) => {
    const inputs = buildScenarioInputs(key);
    let snapshot = null;
    try {
      snapshot = runScenario(inputs);
    } catch (err) {
      console.error(`[runAllComparisonScenarios] failed for "${key}":`, err);
    }
    return {
      key,
      meta: COMPARISON_SCENARIOS[key].meta,
      inputs,
      snapshot,
    };
  });
}
