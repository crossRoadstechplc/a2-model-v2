/**
 * runScenario.js – Master simulation orchestrator
 *
 * Runs the full seven-step pipeline in dependency order and returns a single
 * structured result object that describes the economics of the entire corridor.
 *
 * ── Pipeline order ────────────────────────────────────────────────────────────
 *
 *   1. demand          → how much energy and how many swaps does the fleet need?
 *   2. infrastructure  → how many chargers, bays, and battery packs are required?
 *   3. capex           → what does it cost to build all that infrastructure?
 *   4. pricing         → what $/kWh must Battery Co and Platform Co charge
 *                        to recover their investment at the target IRR?
 *   5. entity financials → P&L, IRR, NPV, payback per entity
 *   6. viability        → is operating EV trucks cheaper than diesel?
 *   7. constraints      → are there any operational bottlenecks or red flags?
 *
 * ── Input contract ────────────────────────────────────────────────────────────
 *
 *   runScenario({ system, battery, platform, fleet, settings })
 *
 *   All five groups mirror the Zustand store's state shape so the store can
 *   call this function directly.
 *
 * ── Output shape ─────────────────────────────────────────────────────────────
 *
 *   {
 *     demand,           // swapsPerDay, kwhPerYear, …
 *     infrastructure,   // chargersNeeded, batteryPool, utilizations, …
 *     capex,            // per-entity breakdown + combined total
 *     pricing,          // $/kWh prices, $/truck/month equivalents
 *     batteryCompany,   // revenue, opex, EBITDA, IRR, NPV, payback, cashFlows
 *     platformCompany,  // revenue, opex, EBITDA, IRR, NPV, payback, cashFlows
 *     fleetCompany,     // revenue, energyCost, EBITDA, IRR, NPV, payback, cashFlows
 *     viability,        // electricCostPerKm vs diesel, savings, label
 *     constraints,      // warnings array, bottleneck flags
 *   }
 */

import { computeDemand }            from './demandEngine';
import { computeInfrastructure }    from './infrastructureEngine';
import { computeCapex }             from './capexEngine';
import { computePricing }           from './pricingEngine';
import { computeEntityFinancials }  from './entityFinancialsEngine';
import { computeViability }         from './viabilityEngine';
import { computeConstraints }       from './constraintEngine';

/**
 * Run the full A2 corridor simulation for a single set of assumptions.
 *
 * @param {object} inputs
 * @param {object} inputs.system    Shared physical parameters
 * @param {object} inputs.battery   Battery Company assumptions
 * @param {object} inputs.platform  Platform Company assumptions
 * @param {object} inputs.fleet     Fleet Company assumptions
 * @param {object} inputs.settings  Global settings (projectionYears, etc.)
 *
 * @returns {object} Full simulation result – see module docstring for shape.
 */
export function runScenario({ system, battery, platform, fleet, settings }) {
  // ── 1. Demand ─────────────────────────────────────────────────────────────
  const demand = computeDemand(system);

  // ── 2. Infrastructure ─────────────────────────────────────────────────────
  const infrastructure = computeInfrastructure(system, platform, battery, demand);

  // ── 3. Capex ──────────────────────────────────────────────────────────────
  const capex = computeCapex(infrastructure, platform, battery, fleet, system);

  // ── 4. Pricing ────────────────────────────────────────────────────────────
  const pricing = computePricing(battery, platform, capex, demand, system, settings);

  // ── 5. Entity financials ──────────────────────────────────────────────────
  const { batteryCompany, platformCompany, fleetCompany } = computeEntityFinancials(
    battery, platform, fleet, system, capex, demand, pricing, settings,
  );

  // ── 6. Viability ──────────────────────────────────────────────────────────
  const viability = computeViability(system, demand, pricing);

  // ── 7. Constraints ────────────────────────────────────────────────────────
  const constraints = computeConstraints(
    infrastructure,
    { batteryCompany, platformCompany, fleetCompany },
    battery,
    pricing,
  );

  return {
    demand,
    infrastructure,
    capex,
    pricing,
    batteryCompany,
    platformCompany,
    fleetCompany,
    viability,
    constraints,
  };
}
