/**
 * Default assumptions for the A2 Electric Freight Corridor simulator.
 *
 * Organised into five groups that mirror the Zustand store:
 *   DEFAULT_SYSTEM    – shared physical parameters used by all three entities
 *   DEFAULT_BATTERY   – Battery Company assumptions
 *   DEFAULT_PLATFORM  – Platform Company assumptions
 *   DEFAULT_FLEET     – Fleet Company assumptions
 *   DEFAULT_CONTROLS  – UI / scenario control state
 *   DEFAULT_SETTINGS  – global model metadata
 *
 * Naming conventions:
 *   All monetary values are in USD.
 *   Rates are stored as decimals (0.15 = 15%).
 *   Fields marked "ENGINE ALIAS" are kept for backward-compat with engine
 *   functions; they are synced automatically by the store's _recompute helper.
 */

// ─── System (shared physical parameters) ────────────────────────────────────
export const DEFAULT_SYSTEM = {
  trucks:           20,     // total trucks operating on the corridor
  kwhPerSwap:       250,    // kWh delivered per single swap event
  swapsPerTruck:    2,      // battery swap events per truck per operating day
  operatingDays:    300,    // operating days per year
  electricityCost:  0.12,   // $/kWh grid cost (Platform pays this)
  dieselCostPerKm:  0.18,   // $/km diesel baseline (for EV-vs-diesel comparison)
  kmPerTruckPerDay: 400,    // km driven per truck per operating day
};

// ─── Battery Company ─────────────────────────────────────────────────────────
export const DEFAULT_BATTERY = {
  // ── New fields (spec) ──────────────────────────────────────────────────────
  batteryCost:            28_000, // $ per pack — total acquisition cost
  batteryCycles:           2_000, // total rated charge–discharge cycles per pack
  batteryIRR:               0.18, // target equity IRR for Battery Co. (decimal)
  batteryBufferMultiplier:   1.5, // rotation buffer: packs deployed per active truck
  batteryEfficiency:        0.92, // round-trip charge-to-discharge efficiency (0–1)
  batteryReservePercent:    0.10, // % of total pack inventory held offline as reserve

  // ── Existing fields (engine compatibility) ────────────────────────────────
  packsPerTruck:                  1.5,  // ENGINE ALIAS ← batteryBufferMultiplier
  costPerPack:                 28_000,  // ENGINE ALIAS ← batteryCost
  batteryLifeYears:                 5,  // depreciation / replacement cycle (years)
  maintenancePerPackPerMonth:      60,  // $ field maintenance per pack per month
  platformFeePerMonth:          8_000,  // $ monthly infra fee paid to Platform Co.
  leasePerTruckPerMonth:          950,  // $ monthly battery lease charged to Fleet Co.
  annualGrowthRate:              0.20,  // annual volume growth rate
};

// ─── Platform Company ────────────────────────────────────────────────────────
export const DEFAULT_PLATFORM = {
  // ── New fields (spec) ──────────────────────────────────────────────────────
  platformFixedCapex:   5_000_000, // $ total fixed capex for full corridor build-out
  platformOpex:         1_860_000, // $ total annual operating cost (all-in)
  platformIRR:               0.15, // target equity IRR for Platform Co. (decimal)
  chargerCost:             80_000, // $ per charger unit installed
  bayCost:                 50_000, // $ per swap bay installed
  coolingCost:             30_000, // $ per cooling / HVAC unit installed
  chargeTimeMinutes:           60, // minutes to fully charge one battery pack
  swapTimeMinutes:              5, // minutes to complete a single swap event
  chargingWindowHours:         10, // hours per day available for charging activity

  // ── Existing fields (engine compatibility) ────────────────────────────────
  numStations:                    10, // charging / swap stations on the corridor
  capexPerStation:           500_000, // ENGINE ALIAS ← platformFixedCapex / numStations
  capexAmortizationYears:         10, // straight-line amortization period (years)
  opexPerStationPerMonth:      8_000, // $ power + field maintenance per station
  staffCostPerMonth:          60_000, // $ total monthly staff cost
  softwareCostPerMonth:       15_000, // $ SaaS, monitoring, licensing
  platformFeePerTruckPerMonth: 1_200, // $ access fee charged to Fleet Co. per truck
  infraFeeFromBatteryPerMonth: 8_000, // $ infra slot fee received from Battery Co.
  annualGrowthRate:             0.15, // annual revenue growth rate
};

// ─── Fleet Company ───────────────────────────────────────────────────────────
export const DEFAULT_FLEET = {
  // ── New fields (spec) ──────────────────────────────────────────────────────
  truckCost:               120_000, // $ per EV truck (acquisition / purchase price)
  freightRevenuePerTruck:   18_000, // $ per truck per month (contracted freight)
  fleetOpexPerTruck:         5_450, // $ per truck per month — variable opex bundle
                                    //   (driver $4,500 + maintenance $600 + insurance $350)

  // ── Existing fields (engine compatibility) ────────────────────────────────
  numTrucks:                      20, // ENGINE ALIAS ← system.trucks (synced by store)
  truckPurchasePrice:        120_000, // ENGINE ALIAS ← truckCost
  truckLifeYears:                  8, // straight-line depreciation period (years)
  driverCostPerTruckPerMonth:  4_500, // $ per truck per month
  maintenancePerTruckPerMonth:   600, // $ per truck per month
  insurancePerTruckPerMonth:     350, // $ per truck per month
  platformFeePerTruckPerMonth: 1_200, // $ paid to Platform Co. — matches platform.platformFeePerTruckPerMonth
  batteryLeasePerTruckPerMonth:  950, // $ paid to Battery Co.  — matches battery.leasePerTruckPerMonth
  freightRevenuePerTruckPerMonth: 18_000, // ENGINE ALIAS ← freightRevenuePerTruck
  annualGrowthRate:             0.25, // annual fleet growth rate
};

// ─── Controls (UI / scenario state) ─────────────────────────────────────────
export const DEFAULT_CONTROLS = {
  selectedScenario: 'base',        // 'conservative' | 'base' | 'bull' | 'bear'
  pricingMode:      'lease',       // 'lease' | 'swap' | 'subscription'
  viewMode:         'financial',   // 'financial' | 'operational' | 'comparison'
};

// ─── Global settings ──────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  corridorName:     'Corridor A2',
  projectionYears:  5,
};
