/**
 * demandEngine.js – Step 1 of the simulation pipeline
 *
 * Computes the raw physical energy and swap demand driven by the fleet.
 * Everything downstream (infrastructure sizing, capex, pricing) is derived
 * from these numbers, which is why they are computed first.
 *
 * ── Inputs (from store.system) ───────────────────────────────────────────────
 *   trucks           – total EV trucks on the corridor
 *   kwhPerSwap       – kWh delivered per single battery swap
 *   swapsPerTruck    – number of swap events per truck per operating day
 *   operatingDays    – operating days per year
 *
 * ── Outputs ──────────────────────────────────────────────────────────────────
 *   swapsPerDay      – total swap events across the whole fleet per day
 *   kwhPerDay        – total kWh consumed by the fleet per day
 *   kwhPerYear       – total annual energy throughput
 *   totalSwapsPerYear – total swap events per year (used for battery cycles)
 *   kwhPerTruckPerDay – energy consumed per truck per day (for viability $/km)
 *   kwhPerTruckPerYear – energy consumed per truck per year
 */

/**
 * @param {object} system   – { trucks, kwhPerSwap, swapsPerTruck, operatingDays }
 * @returns {object}        demand metrics
 */
export function computeDemand(system) {
  const { trucks, kwhPerSwap, swapsPerTruck, operatingDays } = system;

  // Guard against zero / undefined inputs that would produce NaN downstream
  const t  = Math.max(0, trucks          ?? 0);
  const ks = Math.max(0, kwhPerSwap      ?? 0);
  const st = Math.max(0, swapsPerTruck   ?? 0);
  const od = Math.max(0, operatingDays   ?? 0);

  // Daily fleet-level demand
  const swapsPerDay = t * st;           // total swap events per day
  const kwhPerDay   = swapsPerDay * ks; // total kWh flowing through platform per day

  // Annual totals
  const totalSwapsPerYear = swapsPerDay * od;
  const kwhPerYear        = kwhPerDay   * od;

  // Per-truck metrics (used in viability comparison against diesel baseline)
  const kwhPerTruckPerDay  = st * ks;          // single truck daily energy
  const kwhPerTruckPerYear = kwhPerTruckPerDay * od;

  return {
    swapsPerDay,
    kwhPerDay,
    kwhPerYear,
    totalSwapsPerYear,
    kwhPerTruckPerDay,
    kwhPerTruckPerYear,
  };
}
