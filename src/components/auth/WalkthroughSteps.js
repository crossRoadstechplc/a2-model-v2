/**
 * Walkthrough steps – content derived from WalkthroughNote.md.
 * Rendered in WalkthroughModal.
 */

export const WALKTHROUGH_STEPS = [
  {
    title: 'Session & Security',
    content: `Your session lasts 4 hours. After it expires, you will need to sign in again with OTP verification. This keeps your access secure.`,
  },
  {
    title: 'How the Simulator Works',
    content: `The A2 Investor Simulator models an electric freight corridor with three entities:

• Battery Company – Provides battery packs and charging infrastructure
• Platform Company – Operates swap stations and grid connection
• Fleet Company – Runs electric trucks on the corridor

You adjust assumptions (trucks, costs, revenue, growth) and the model computes projected financials, returns (IRR), and viability for each entity.`,
  },
  {
    title: 'Navigation',
    content: `• Dashboard – Consolidated overview: KPIs, pricing, infrastructure, constraints
• Entity Financials – Detailed P&L for Battery, Platform, and Fleet
• Scale Insights – IRR sweeps, cost curves, scenario comparisons
• Scenarios – Compare Base, Optimistic, and Stress cases
• Save / Export – Save named scenarios or export to JSON/CSV
• Assumptions – Toggle the side panel to adjust all model inputs`,
  },
  {
    title: 'Tips',
    content: `• Use the Assumptions panel (sidebar) to change inputs; results update instantly
• Try different scenarios (Base, Optimistic, Stress) to see how outcomes change
• The Dashboard shows operational constraints and viability at a glance`,
  },
];
