/**
 * Named scenario presets for the A2 Investor Simulator.
 *
 * Each preset is a deep partial override applied on top of the defaults.
 * Any key not present in a preset falls through to the default value.
 *
 * Usage (via store action):
 *   useSimulatorStore.getState().loadScenario('bull')
 *
 * Adding a new scenario:
 *   1. Add an entry here inside SCENARIO_PRESETS following the same shape.
 *   2. Add its key to SCENARIO_ORDER if you want it in the header selector.
 *
 * Note: 'optimistic' and 'stress' are also defined in src/lib/scenarios/presets.js
 * for the Scenario Comparison page. Both files intentionally keep separate
 * copies to avoid cross-coupling between the workspace loader and the
 * deterministic side-by-side comparison engine.
 */

export const SCENARIO_PRESETS = {

  // ── Conservative ──────────────────────────────────────────────────────────
  conservative: {
    meta: {
      label:       'Conservative',
      description: 'Slow ramp, moderate fleet, cautious pricing — represents a downside protection view.',
      color:       'amber',
    },
    system: {
      trucks:          12,
      swapsPerTruck:    1.5,
      operatingDays:  280,
    },
    battery: {
      batteryCost:              32_000,
      batteryCycles:             1_800,
      batteryIRR:                 0.14,
      batteryBufferMultiplier:     1.6,
      leasePerTruckPerMonth:       800,
      maintenancePerPackPerMonth:   75,
      annualGrowthRate:            0.10,
    },
    platform: {
      platformFixedCapex:   4_000_000,
      platformOpex:         1_600_000,
      platformIRR:               0.12,
      platformFeePerTruckPerMonth: 1_000,
      annualGrowthRate:           0.10,
    },
    fleet: {
      truckCost:              130_000,
      freightRevenuePerTruck:  14_000,
      fleetOpexPerTruck:        5_800,
      annualGrowthRate:          0.10,
    },
  },

  // ── Base (default management case) ───────────────────────────────────────
  base: {
    meta: {
      label:       'Base Case',
      description: 'Management projections; steady corridor ramp-up at plan targets.',
      color:       'blue',
    },
    // No overrides — all defaults apply
  },

  // ── Bull ─────────────────────────────────────────────────────────────────
  bull: {
    meta: {
      label:       'Bull Case',
      description: 'Accelerated adoption, strong pricing power, operating leverage kicks in early.',
      color:       'emerald',
    },
    system: {
      trucks:          28,
      swapsPerTruck:    2.5,
      operatingDays:  320,
      electricityCost: 0.10,
    },
    battery: {
      batteryCost:              24_000,
      batteryCycles:             2_500,
      batteryIRR:                 0.22,
      batteryBufferMultiplier:     1.4,
      leasePerTruckPerMonth:     1_100,
      maintenancePerPackPerMonth:   50,
      annualGrowthRate:            0.28,
    },
    platform: {
      platformFixedCapex:   6_000_000,
      platformOpex:         2_000_000,
      platformIRR:               0.20,
      platformFeePerTruckPerMonth: 1_400,
      annualGrowthRate:           0.22,
    },
    fleet: {
      truckCost:              110_000,
      freightRevenuePerTruck:  22_000,
      fleetOpexPerTruck:        5_100,
      annualGrowthRate:          0.35,
    },
  },

  // ── Bear ─────────────────────────────────────────────────────────────────
  bear: {
    meta: {
      label:       'Bear Case',
      description: 'Slower adoption, cost inflation, competitive pricing pressure across the board.',
      color:       'red',
    },
    system: {
      trucks:          14,
      swapsPerTruck:    1.5,
      operatingDays:  270,
      electricityCost: 0.16,
    },
    battery: {
      batteryCost:              35_000,
      batteryCycles:             1_500,
      batteryIRR:                 0.10,
      batteryBufferMultiplier:     1.7,
      leasePerTruckPerMonth:       750,
      maintenancePerPackPerMonth:   85,
      annualGrowthRate:            0.07,
    },
    platform: {
      platformFixedCapex:   5_500_000,
      platformOpex:         2_100_000,
      platformIRR:               0.09,
      platformFeePerTruckPerMonth:   900,
      annualGrowthRate:           0.06,
    },
    fleet: {
      truckCost:              135_000,
      freightRevenuePerTruck:  12_000,
      fleetOpexPerTruck:        6_200,
      annualGrowthRate:          0.05,
    },
  },

  // ── Optimistic (at-scale) ─────────────────────────────────────────────────
  optimistic: {
    meta: {
      label:       'Optimistic',
      description: 'At-scale — 100 trucks, cheap electricity, competitive diesel.',
      color:       'emerald',
    },
    system: {
      trucks:          100,
      kwhPerSwap:      220,
      operatingDays:   320,
      electricityCost: 0.08,
      dieselCostPerKm: 0.45,
    },
    battery: {
      batteryCost:              22_000,
      batteryCycles:             2_500,
      batteryIRR:                 0.20,
      batteryBufferMultiplier:    1.30,
      batteryReservePercent:      0.08,
      maintenancePerPackPerMonth:   45,
      batteryLifeYears:              6,
    },
    platform: {
      platformOpex:        1_500_000,
      platformIRR:              0.18,
      chargeTimeMinutes:          55,
      chargingWindowHours:        12,
    },
    fleet: {
      truckCost:              110_000,
      freightRevenuePerTruck:  22_000,
      fleetOpexPerTruck:        5_000,
    },
    settings: {
      projectionYears: 7,
    },
  },

  // ── Stress ────────────────────────────────────────────────────────────────
  stress: {
    meta: {
      label:       'Stress Case',
      description: 'Adverse conditions — 12 trucks, cost overruns, cheap diesel.',
      color:       'red',
    },
    system: {
      trucks:           12,
      kwhPerSwap:      260,
      operatingDays:   260,
      electricityCost: 0.17,
      dieselCostPerKm: 0.16,
      kmPerTruckPerDay: 350,
    },
    battery: {
      batteryCost:              36_000,
      batteryCycles:             1_600,
      batteryIRR:                 0.10,
      batteryBufferMultiplier:    1.80,
      batteryReservePercent:      0.15,
      maintenancePerPackPerMonth:   85,
      batteryLifeYears:              4,
    },
    platform: {
      platformFixedCapex:   6_500_000,
      platformOpex:         2_400_000,
      platformIRR:               0.08,
      chargeTimeMinutes:           75,
      chargingWindowHours:          8,
    },
    fleet: {
      truckCost:              135_000,
      freightRevenuePerTruck:  13_000,
      fleetOpexPerTruck:        6_800,
    },
    settings: {
      projectionYears: 5,
    },
  },
};

/** Ordered list of scenario keys for the header selector. */
export const SCENARIO_ORDER = ['conservative', 'base', 'bull', 'bear'];

/** Returns the meta for a given scenario key (label, color, description). */
export function getScenarioMeta(key) {
  return SCENARIO_PRESETS[key]?.meta ?? SCENARIO_PRESETS.base.meta;
}
