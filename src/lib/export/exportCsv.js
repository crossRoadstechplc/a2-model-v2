/**
 * exportCsv.js – Download a CSV summary of key model assumptions and results.
 *
 * The CSV is structured in two sections:
 *
 *   ASSUMPTIONS  – all five input groups (system, battery, platform, fleet, settings)
 *   RESULTS      – snapshot outputs: demand, infrastructure, capex, pricing,
 *                  entity financials (IRR, NPV, payback, EBITDA), viability
 *
 * Format is compatible with Excel / Google Sheets:
 *   Category, Field, Value, Unit
 *
 * Non-finite values (Infinity, NaN) are written as empty cells.
 *
 * Usage:
 *   exportToCsv(assumptions, snapshot, 'My Scenario Name');
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

function slugify(str) {
  return (str ?? 'export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function dateTag() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** Escape a CSV cell — wraps in quotes if it contains commas, quotes, or newlines. */
function cell(v) {
  const s = (v === null || v === undefined || (typeof v === 'number' && !isFinite(v)))
    ? ''
    : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells) {
  return cells.map(cell).join(',');
}

function pct(v, decimals = 1) {
  if (v == null || !isFinite(v)) return '';
  return `${(v * 100).toFixed(decimals)}`;
}

function money(v, decimals = 0) {
  if (v == null || !isFinite(v)) return '';
  return v.toFixed(decimals);
}

function irr(v, decimals = 1) {
  if (v == null || !isFinite(v) || isNaN(v)) return '';
  return `${(v * 100).toFixed(decimals)}`;
}

function irrPct(v) {
  // IRR already stored as fraction
  return irr(v);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

// ─── CSV builder ──────────────────────────────────────────────────────────────

function buildRows(assumptions, snapshot, label) {
  const rows = [];
  const s    = assumptions?.system   ?? {};
  const b    = assumptions?.battery  ?? {};
  const p    = assumptions?.platform ?? {};
  const f    = assumptions?.fleet    ?? {};
  const st   = assumptions?.settings ?? {};

  const snap  = snapshot ?? {};
  const dem   = snap.demand          ?? {};
  const infra = snap.infrastructure  ?? {};
  const capex = snap.capex           ?? {};
  const pr    = snap.pricing         ?? {};
  const bat   = snap.batteryCompany  ?? {};
  const plat  = snap.platformCompany ?? {};
  const flt   = snap.fleetCompany    ?? {};
  const viz   = snap.viability       ?? {};

  // ── File header ────────────────────────────────────────────────────────────
  rows.push(row('A2 Investor Simulator — Model Summary'));
  rows.push(row('Exported:', new Date().toLocaleString()));
  rows.push(row('Label:', label ?? st.corridorName ?? ''));
  rows.push(row('Projection Years:', st.projectionYears ?? ''));
  rows.push('');

  // ── Assumptions ────────────────────────────────────────────────────────────
  rows.push(row('ASSUMPTIONS'));
  rows.push(row('Category', 'Field', 'Value', 'Unit'));

  // System
  rows.push(row('System', 'Trucks on Corridor',         s.trucks,           ''));
  rows.push(row('System', 'kWh per Swap',               s.kwhPerSwap,       'kWh'));
  rows.push(row('System', 'Swaps per Truck per Day',    s.swapsPerTruck,    ''));
  rows.push(row('System', 'Operating Days per Year',    s.operatingDays,    'days'));
  rows.push(row('System', 'Electricity Cost',           s.electricityCost,  '$/kWh'));
  rows.push(row('System', 'Diesel Cost per km',         s.dieselCostPerKm,  '$/km'));
  rows.push(row('System', 'km per Truck per Day',       s.kmPerTruckPerDay, 'km'));

  // Battery
  rows.push(row('Battery Co.', 'Battery Cost (per pack)',       money(b.batteryCost),                 'USD'));
  rows.push(row('Battery Co.', 'Battery Cycles (rated)',         b.batteryCycles,                     'cycles'));
  rows.push(row('Battery Co.', 'Target IRR',                     pct(b.batteryIRR, 1),               '%'));
  rows.push(row('Battery Co.', 'Buffer Multiplier',              b.batteryBufferMultiplier,           '× packs/truck'));
  rows.push(row('Battery Co.', 'Reserve Percent',                pct(b.batteryReservePercent, 1),    '%'));
  rows.push(row('Battery Co.', 'Battery Life (years)',           b.batteryLifeYears,                  'years'));
  rows.push(row('Battery Co.', 'Maintenance per Pack per Month', money(b.maintenancePerPackPerMonth), '$/pack/mo'));

  // Platform
  rows.push(row('Platform Co.', 'Fixed Capex',           money(p.platformFixedCapex),  'USD'));
  rows.push(row('Platform Co.', 'Annual Opex',           money(p.platformOpex),        'USD'));
  rows.push(row('Platform Co.', 'Target IRR',            pct(p.platformIRR, 1),       '%'));
  rows.push(row('Platform Co.', 'Charger Cost (each)',   money(p.chargerCost),         'USD'));
  rows.push(row('Platform Co.', 'Bay Cost (each)',       money(p.bayCost),             'USD'));
  rows.push(row('Platform Co.', 'Charge Time',           p.chargeTimeMinutes,          'min'));
  rows.push(row('Platform Co.', 'Swap Time',             p.swapTimeMinutes,            'min'));
  rows.push(row('Platform Co.', 'Charging Window',       p.chargingWindowHours,        'hr/day'));

  // Fleet
  rows.push(row('Fleet Co.', 'Truck Cost (each)',             money(f.truckCost),             'USD'));
  rows.push(row('Fleet Co.', 'Freight Revenue per Truck/mo',  money(f.freightRevenuePerTruck),'$/truck/mo'));
  rows.push(row('Fleet Co.', 'Opex per Truck/mo',             money(f.fleetOpexPerTruck),     '$/truck/mo'));
  rows.push(row('Fleet Co.', 'Truck Life (years)',             f.truckLifeYears ?? 8,         'years'));

  rows.push('');

  // ── Snapshot results ───────────────────────────────────────────────────────
  rows.push(row('SNAPSHOT RESULTS'));
  rows.push(row('Category', 'Metric', 'Value', 'Unit'));

  // Demand
  rows.push(row('Demand', 'Annual kWh Throughput',    money(dem.kwhPerYear, 0),       'kWh'));
  rows.push(row('Demand', 'Swaps per Day',             dem.swapsPerDay,                ''));
  rows.push(row('Demand', 'kWh per Truck per Day',     dem.kwhPerTruckPerDay,          'kWh'));

  // Infrastructure
  rows.push(row('Infrastructure', 'Chargers Needed',       infra.chargersNeeded,                  ''));
  rows.push(row('Infrastructure', 'Swap Bays Needed',      infra.baysNeeded,                      ''));
  rows.push(row('Infrastructure', 'Battery Pool (total)',  infra.batteryPool,                     'packs'));
  rows.push(row('Infrastructure', 'Active Packs',          infra.activePacks,                     'packs'));
  rows.push(row('Infrastructure', 'Reserve Packs',         infra.reservePacks,                    'packs'));
  rows.push(row('Infrastructure', 'Charger Utilization',   infra.chargerUtilization?.toFixed(1),  '%'));
  rows.push(row('Infrastructure', 'Bay Utilization',       infra.bayUtilization?.toFixed(1),      '%'));
  rows.push(row('Infrastructure', 'Est. Cycles/Pack/Year', infra.estimatedCyclesPerPackPerYear?.toFixed(0), 'cycles'));

  // Capex
  rows.push(row('Capex', 'Platform Capex',    money(capex.platform?.total), 'USD'));
  rows.push(row('Capex', 'Battery Capex',     money(capex.battery?.total),  'USD'));
  rows.push(row('Capex', 'Fleet Capex',       money(capex.fleet?.total),    'USD'));
  rows.push(row('Capex', 'Combined Capex',    money(capex.combined?.total), 'USD'));

  // Pricing
  rows.push(row('Pricing', 'Electricity Component',  pr.electricityCostPerKwh?.toFixed(4),  '$/kWh'));
  rows.push(row('Pricing', 'Battery Lease',          pr.batteryLeasePerKwh?.toFixed(4),     '$/kWh'));
  rows.push(row('Pricing', 'Platform Fee',           pr.platformFeePerKwh?.toFixed(4),      '$/kWh'));
  rows.push(row('Pricing', 'Total Cost per kWh',     pr.totalCostPerKwh?.toFixed(4),        '$/kWh'));
  rows.push(row('Pricing', 'Total Energy per Truck/mo', money(pr.totalEnergyPerTruckMonth), '$/truck/mo'));

  // Battery Co.
  rows.push(row('Battery Co.', 'Annual Revenue',  money(bat.annualRevenue),  'USD'));
  rows.push(row('Battery Co.', 'Annual Opex',     money(bat.annualOpex),     'USD'));
  rows.push(row('Battery Co.', 'Annual EBITDA',   money(bat.annualEBITDA),   'USD'));
  rows.push(row('Battery Co.', 'EBITDA Margin',   bat.ebitdaMargin?.toFixed(1),            '%'));
  rows.push(row('Battery Co.', 'Total Capex',     money(bat.capex),          'USD'));
  rows.push(row('Battery Co.', 'IRR',             irrPct(bat.irr),           '%'));
  rows.push(row('Battery Co.', 'NPV',             money(bat.npv),            'USD'));
  rows.push(row('Battery Co.', 'Payback Period',  bat.payback?.toFixed(2),   'years'));

  // Platform Co.
  rows.push(row('Platform Co.', 'Annual Revenue',  money(plat.annualRevenue),  'USD'));
  rows.push(row('Platform Co.', 'Annual Opex',     money(plat.annualOpex),     'USD'));
  rows.push(row('Platform Co.', 'Annual EBITDA',   money(plat.annualEBITDA),   'USD'));
  rows.push(row('Platform Co.', 'EBITDA Margin',   plat.ebitdaMargin?.toFixed(1),           '%'));
  rows.push(row('Platform Co.', 'Total Capex',     money(plat.capex),          'USD'));
  rows.push(row('Platform Co.', 'IRR',             irrPct(plat.irr),           '%'));
  rows.push(row('Platform Co.', 'NPV',             money(plat.npv),            'USD'));
  rows.push(row('Platform Co.', 'Payback Period',  plat.payback?.toFixed(2),   'years'));

  // Fleet Co.
  rows.push(row('Fleet Co.', 'Annual Revenue',       money(flt.annualRevenue),     'USD'));
  rows.push(row('Fleet Co.', 'Annual Energy Cost',   money(flt.annualEnergyCost),  'USD'));
  rows.push(row('Fleet Co.', 'Annual Other Opex',    money(flt.annualOtherOpex),   'USD'));
  rows.push(row('Fleet Co.', 'Annual EBITDA',        money(flt.annualEBITDA),      'USD'));
  rows.push(row('Fleet Co.', 'EBITDA Margin',        flt.ebitdaMargin?.toFixed(1),              '%'));
  rows.push(row('Fleet Co.', 'Gross Margin',         flt.grossMargin?.toFixed(1),               '%'));
  rows.push(row('Fleet Co.', 'Total Capex',          money(flt.capex),             'USD'));
  rows.push(row('Fleet Co.', 'IRR',                  irrPct(flt.irr),              '%'));
  rows.push(row('Fleet Co.', 'NPV',                  money(flt.npv),               'USD'));
  rows.push(row('Fleet Co.', 'Payback Period',       flt.payback?.toFixed(2),      'years'));

  // Viability
  rows.push(row('Viability', 'Electric Cost per km',       viz.electricCostPerKm?.toFixed(4),      '$/km'));
  rows.push(row('Viability', 'Diesel Cost per km',         viz.dieselCostPerKm?.toFixed(4),        '$/km'));
  rows.push(row('Viability', 'Savings per km',             viz.savingsPerKm?.toFixed(4),           '$/km'));
  rows.push(row('Viability', 'Savings %',                  viz.savingsPercent?.toFixed(1),         '%'));
  rows.push(row('Viability', 'Annual Savings per Truck',   viz.annualSavingsPerTruck?.toFixed(0),  'USD'));
  rows.push(row('Viability', 'Status',                     viz.label ?? '',                        ''));

  rows.push('');
  rows.push(row('Note: IRR values shown as % (e.g. 18.2 = 18.2%)'));

  return rows;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Trigger a CSV download of current model assumptions and results.
 *
 * @param {object}  assumptions – { settings, system, battery, platform, fleet, controls }
 * @param {object}  [snapshot]  – runScenario output (may be null)
 * @param {string}  [label]     – human-readable name (used in filename + header)
 */
export function exportToCsv(assumptions, snapshot, label) {
  const name     = (label ?? assumptions?.settings?.corridorName ?? 'a2-model').trim();
  const rows     = buildRows(assumptions, snapshot, label ?? name);
  const csvText  = rows.map((r) => (typeof r === 'string' ? r : r)).join('\n');

  // BOM prefix ensures Excel opens UTF-8 correctly
  const blob     = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' });
  const filename = `a2-${slugify(name)}-${dateTag()}.csv`;

  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
