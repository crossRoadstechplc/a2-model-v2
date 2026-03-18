/**
 * Scenario multipliers applied to revenue and cost lines.
 *
 * bull  – faster adoption, lower churn, slight cost savings
 * base  – default assumptions, no adjustment
 * bear  – slower growth, higher churn, cost overruns
 */
export const SCENARIO_MULTIPLIERS = {
  bull: {
    revenueMultiplier: 1.25,  // +25% on all revenue lines
    costMultiplier:    0.92,  // −8%  on variable costs
    growthMultiplier:  1.30,  // +30% on growth rates
    label: 'Bull Case',
    description: 'Accelerated fleet adoption, strong pricing power, lean ops.',
    color: 'emerald',
  },
  base: {
    revenueMultiplier: 1.00,
    costMultiplier:    1.00,
    growthMultiplier:  1.00,
    label: 'Base Case',
    description: 'Management projections; steady corridor ramp-up.',
    color: 'blue',
  },
  bear: {
    revenueMultiplier: 0.72,  // −28% on all revenue lines
    costMultiplier:    1.15,  // +15% on variable costs
    growthMultiplier:  0.60,  // −40% on growth rates
    label: 'Bear Case',
    description: 'Slower adoption, competitive pressure, cost inflation.',
    color: 'red',
  },
};

/** Returns multipliers for a given scenario key */
export function getMultipliers(scenario) {
  return SCENARIO_MULTIPLIERS[scenario] ?? SCENARIO_MULTIPLIERS.base;
}
