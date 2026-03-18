/**
 * capexEngine.js – Step 3 of the simulation pipeline
 *
 * Computes upfront capital expenditure for each entity.
 *
 * ── Platform capex breakdown ─────────────────────────────────────────────────
 *   Platform builds and owns:
 *     • Charger units  (chargersNeeded × chargerCost)
 *     • Swap bays      (baysNeeded × bayCost)
 *     • Cooling units  (numStations × coolingCost, one per station)
 *     • Site / civil works, grid connection, buildings (residual)
 *
 *   Component capex is computed from infrastructure sizing.
 *   The "site and other" bucket absorbs any gap between the component total
 *   and the user-defined platformFixedCapex total, ensuring the model always
 *   uses a consistent total platform investment.
 *
 *   Rule: totalPlatformCapex = max(componentCapex, platformFixedCapex)
 *
 * ── Battery capex ────────────────────────────────────────────────────────────
 *   Battery Co buys the entire pack pool upfront.
 *   batteryCapex = batteryPool × batteryCost
 *
 * ── Fleet capex ──────────────────────────────────────────────────────────────
 *   Fleet Co acquires all trucks upfront.
 *   fleetCapex = trucks × truckCost
 */

/**
 * @param {object} infrastructure  – output of computeInfrastructure()
 * @param {object} platform        – { platformFixedCapex, chargerCost, bayCost, coolingCost }
 * @param {object} battery         – { batteryCost }
 * @param {object} fleet           – { truckCost }
 * @param {object} system          – { trucks }
 * @returns {object}               capex breakdown per entity + combined total
 */
export function computeCapex(infrastructure, platform, battery, fleet, system) {
  const { chargersNeeded, baysNeeded, batteryPool, numStations } = infrastructure;
  const {
    platformFixedCapex,
    chargerCost,
    bayCost,
    coolingCost,
  } = platform;

  // ── Platform ──────────────────────────────────────────────────────────────

  const chargerCapex    = chargersNeeded * (chargerCost  ?? 0);
  const bayCapex        = baysNeeded     * (bayCost      ?? 0);
  // One cooling/HVAC unit per station (shared between chargers and bays at that site)
  const coolingCapex    = numStations    * (coolingCost  ?? 0);
  const componentCapex  = chargerCapex + bayCapex + coolingCapex;

  // Any capex not captured by the component model (site prep, grid connection,
  // civil works, office, software systems, etc.)
  const siteAndOtherCapex = Math.max(0, (platformFixedCapex ?? 0) - componentCapex);

  // Final platform total: at least as large as the user-specified fixed capex
  const totalPlatformCapex = Math.max(componentCapex, platformFixedCapex ?? 0);

  // ── Battery ───────────────────────────────────────────────────────────────

  const totalBatteryCapex = batteryPool * (battery.batteryCost ?? 0);

  // ── Fleet ─────────────────────────────────────────────────────────────────

  const trucks          = system.trucks ?? 0;
  const totalFleetCapex = trucks * (fleet.truckCost ?? 0);

  // ── Combined ──────────────────────────────────────────────────────────────

  const totalCombinedCapex = totalPlatformCapex + totalBatteryCapex + totalFleetCapex;

  return {
    platform: {
      chargerCapex,
      bayCapex,
      coolingCapex,
      componentCapex,
      siteAndOtherCapex,
      total: totalPlatformCapex,
    },
    battery: {
      packsRequired: batteryPool,
      total: totalBatteryCapex,
    },
    fleet: {
      trucks,
      total: totalFleetCapex,
    },
    combined: {
      total: totalCombinedCapex,
    },
  };
}
