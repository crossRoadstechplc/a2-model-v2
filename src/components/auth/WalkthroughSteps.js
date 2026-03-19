/**
 * Walkthrough steps – content derived from WalkthroughNote.md.
 * Rendered in WalkthroughModal.
 */

export const WALKTHROUGH_STEPS = [
  {
    title: 'Local simulator',
    content: `This app runs entirely in your browser. Your assumptions and saved scenarios are stored locally on this device — no sign-in required.`,
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
    title: 'Inputs Panel (where you start)',
    content: `This is the main way to use the simulator:\n\n1) Open the Inputs panel\n2) Change assumptions\n3) Watch results update instantly on the Dashboard and other tabs\n\nNext, we’ll walk through the most important driver first: fleet scale.`,
    action: { panelOpen: true, activePage: 'dashboard' },
  },
  {
    title: 'System Inputs (fleet scale)',
    content: `Go to System Inputs and adjust:\n\n• Number of Trucks\n• kWh per swap\n• Swaps per truck per day\n\nThese drive demand, infrastructure sizing, and ultimately cost/kWh and viability.`,
    action: { panelOpen: true, activePage: 'dashboard', focusSection: 'system' },
  },
  {
    title: 'Battery Company assumptions',
    content: `Battery Co. assumptions affect pack economics and lease pricing:\n\n• Battery cost, cycles, efficiency\n• Buffer multiplier / reserves\n• Target Battery IRR\n\nChanging these shifts Battery IRR and the total cost stack.`,
    action: { panelOpen: true, activePage: 'dashboard', focusSection: 'battery' },
  },
  {
    title: 'Platform Company assumptions',
    content: `Platform Co. assumptions affect infrastructure cost and access fees:\n\n• Total capex + opex\n• Stations / charger parameters\n• Target Platform IRR\n\nThese heavily influence cost/kWh, especially at low truck counts.`,
    action: { panelOpen: true, activePage: 'dashboard', focusSection: 'platform' },
  },
  {
    title: 'Fleet Company assumptions',
    content: `Fleet Co. assumptions affect operating economics:\n\n• Truck cost\n• Freight revenue per truck\n• Opex per truck\n\nThese flow into Fleet IRR and the EV vs diesel comparison.`,
    action: { panelOpen: true, activePage: 'dashboard', focusSection: 'fleet' },
  },
  {
    title: 'See the impact: Entity Financials',
    content: `Open Entity Financials to see P&L, cash flows, and returns for each entity.\n\nTip: keep the Inputs panel open and tweak one variable at a time to see what moves.`,
    action: { panelOpen: true, activePage: 'financials', focusSection: null },
  },
  {
    title: 'See the impact: Scale Insights',
    content: `Scale Insights runs a truck-count sweep so you can see how IRR and cost/kWh change with corridor scale.\n\nThis is the fastest way to answer: “How many trucks do we need for targets?”`,
    action: { panelOpen: false, activePage: 'insights', focusSection: null },
  },
  {
    title: 'Save / Export',
    content: `When you have a set of assumptions you like:\n\n• Save a named scenario (stored in your browser)\n• Export JSON/CSV to share or version-control externally`,
    action: { panelOpen: false, activePage: 'saveload', focusSection: null },
  },
  {
    title: 'Tips',
    content: `• Change one input at a time to understand causality\n• Start with trucks (scale) before fine-tuning costs\n• Use Entity Financials for “why” and Insights for “how much scale is needed”\n• Save named scenarios before big experiments`,
    action: { panelOpen: true, activePage: 'dashboard', focusSection: 'system' },
  },
];
