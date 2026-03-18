/**
 * infrastructureEngine.js – Step 2 of the simulation pipeline
 *
 * Sizes the physical infrastructure needed to serve demand:
 *   • How many chargers does the platform need?
 *   • How many swap bays?
 *   • How large must the battery pool be?
 *
 * These counts feed directly into the capex calculation.
 *
 * ── Charger model ────────────────────────────────────────────────────────────
 *   Each charger occupies a single battery pack for `chargeTimeMinutes` at a time.
 *   In a `chargingWindowHours`-hour operating window, one charger can complete:
 *
 *     chargesPerChargerPerDay = chargingWindowHours × 60 / chargeTimeMinutes
 *
 *   The minimum number of chargers to clear all swaps in that window:
 *
 *     chargersNeeded = ⌈ swapsPerDay / chargesPerChargerPerDay ⌉
 *
 * ── Swap bay model ───────────────────────────────────────────────────────────
 *   A swap bay is occupied for `swapTimeMinutes` per truck visit.
 *   Throughput per bay per day (using same operating window):
 *
 *     swapsPerBayPerDay = chargingWindowHours × 60 / swapTimeMinutes
 *
 *     baysNeeded = ⌈ swapsPerDay / swapsPerBayPerDay ⌉
 *
 * ── Battery pool model ───────────────────────────────────────────────────────
 *   batteryBufferMultiplier = active packs deployed per truck (rotation + charging)
 *   batteryReservePercent   = fraction of total pool kept offline as spare/maintenance
 *
 *   activePacks = trucks × batteryBufferMultiplier
 *   totalPool   = ⌈ activePacks / (1 − batteryReservePercent) ⌉
 *   reservePacks = totalPool − activePacks
 *
 * ── Cycle estimation ─────────────────────────────────────────────────────────
 *   estimatedCyclesPerPackPerYear = totalSwapsPerYear / totalPool
 *   (Each swap depletes one pack = one charge–discharge cycle)
 */

/**
 * @param {object} system   – { trucks, swapsPerTruck, operatingDays, kwhPerSwap }
 * @param {object} platform – { chargeTimeMinutes, swapTimeMinutes, chargingWindowHours,
 *                              numStations }
 * @param {object} battery  – { batteryBufferMultiplier, batteryReservePercent }
 * @param {object} demand   – output of computeDemand()
 * @returns {object}        infrastructure sizing
 */
export function computeInfrastructure(system, platform, battery, demand) {
  const { trucks }                                        = system;
  const { chargeTimeMinutes, swapTimeMinutes,
          chargingWindowHours, numStations }              = platform;
  const { batteryBufferMultiplier, batteryReservePercent } = battery;
  const { swapsPerDay, totalSwapsPerYear }                = demand;

  // ── Chargers ──────────────────────────────────────────────────────────────

  // How many packs a single charger can process in one day's charging window
  const chargesPerChargerPerDay =
    chargeTimeMinutes > 0
      ? (chargingWindowHours * 60) / chargeTimeMinutes
      : 0;

  // Minimum chargers to clear the day's demand (ceiling ensures we never fall short)
  const chargersNeeded =
    chargesPerChargerPerDay > 0
      ? Math.ceil(swapsPerDay / chargesPerChargerPerDay)
      : 0;

  // Utilization: what fraction of total charger capacity is actually used
  const chargerCapacity    = chargersNeeded * chargesPerChargerPerDay;
  const chargerUtilization = chargerCapacity > 0
    ? (swapsPerDay / chargerCapacity) * 100
    : 0;

  // ── Swap bays ─────────────────────────────────────────────────────────────

  // Throughput: how many trucks a single bay can serve in the operating window
  const swapsPerBayPerDay =
    swapTimeMinutes > 0
      ? (chargingWindowHours * 60) / swapTimeMinutes
      : 0;

  // Minimum bays to handle all arriving trucks
  const baysNeeded =
    swapsPerBayPerDay > 0
      ? Math.ceil(swapsPerDay / swapsPerBayPerDay)
      : 0;

  const bayCapacity    = baysNeeded * swapsPerBayPerDay;
  const bayUtilization = bayCapacity > 0
    ? (swapsPerDay / bayCapacity) * 100
    : 0;

  // ── Battery pool ──────────────────────────────────────────────────────────

  // Packs actively deployed (in trucks + in chargers + in transit)
  const activePacks = trucks * batteryBufferMultiplier;

  // Total pool including offline reserve
  // totalPool = activePacks / (1 − reservePct)  →  reservePacks = total − active
  const reserveFraction = Math.max(0, Math.min(0.99, batteryReservePercent ?? 0));
  const totalPool       = Math.ceil(activePacks / (1 - reserveFraction));
  const reservePacks    = totalPool - Math.ceil(activePacks);

  // ── Battery cycle estimation ──────────────────────────────────────────────

  // Each swap = one charge–discharge cycle for one pack
  const estimatedCyclesPerPackPerYear =
    totalPool > 0 ? totalSwapsPerYear / totalPool : 0;

  return {
    // Charger sizing
    chargesPerChargerPerDay,
    chargersNeeded,
    chargerUtilization,     // %

    // Bay sizing
    swapsPerBayPerDay,
    baysNeeded,
    bayUtilization,         // %

    // Battery pool
    activePacks: Math.ceil(activePacks),
    reservePacks,
    batteryPool: totalPool,

    // Battery health proxy
    estimatedCyclesPerPackPerYear,

    // Misc
    numStations: numStations ?? 0,
  };
}
