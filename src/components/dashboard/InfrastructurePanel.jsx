/**
 * InfrastructurePanel – physical infrastructure sizing display.
 *
 * Shows three asset groups in a row:
 *
 *   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐
 *   │   Chargers   │  │  Swap Bays   │  │       Battery Pool           │
 *   │  count + bar │  │  count + bar │  │  total · active · reserve    │
 *   │  utilization │  │  utilization │  │  cycles/yr + health bar      │
 *   └──────────────┘  └──────────────┘  └──────────────────────────────┘
 *
 * Colour thresholds (mirror the constraint engine constants exactly):
 *   Charger utilization : <70% green · 70–84% amber · ≥85% red
 *   Bay utilization     : <65% green · 65–79% amber · ≥80% red
 *   Battery cycles      : green if under rated · amber ≈ rated · red if over
 *
 * All values come from snapshot.infrastructure — nothing is recomputed here.
 *
 * Props:
 *   infrastructure  – snapshot.infrastructure
 *   constraints     – snapshot.constraints (used only for colour keying,
 *                     never for duplicate threshold logic)
 *   battery         – battery store assumptions (for ratedCyclesPerYear label)
 */

import clsx from 'clsx';
import { Zap, RotateCcw, BatteryCharging } from 'lucide-react';
import { UTIL_THRESHOLDS } from '../../lib/constants';

// ─── Threshold constants (sourced from lib/constants.js) ─────────────────────
const CHARGER_UTIL_WARN   = UTIL_THRESHOLDS.CHARGER_WARN;
const CHARGER_UTIL_AMBER  = UTIL_THRESHOLDS.CHARGER_AMBER;
const BAY_UTIL_WARN       = UTIL_THRESHOLDS.BAY_WARN;
const BAY_UTIL_AMBER      = UTIL_THRESHOLDS.BAY_AMBER;

// ─── Colour helpers ────────────────────────────────────────────────────────────

function utilColour(value, amberAt, redAt) {
  if (value >= redAt)   return 'red';
  if (value >= amberAt) return 'amber';
  return 'green';
}

const COLOUR = {
  green: {
    bar:    'bg-emerald-500',
    text:   'text-emerald-700',
    badge:  'bg-emerald-100 text-emerald-700',
    ring:   'ring-emerald-200',
    dot:    'bg-emerald-500',
  },
  amber: {
    bar:    'bg-amber-400',
    text:   'text-amber-700',
    badge:  'bg-amber-100 text-amber-700',
    ring:   'ring-amber-200',
    dot:    'bg-amber-400',
  },
  red: {
    bar:    'bg-red-500',
    text:   'text-red-600',
    badge:  'bg-red-100 text-red-700',
    ring:   'ring-red-200',
    dot:    'bg-red-500',
  },
};

// ─── Subcomponents ─────────────────────────────────────────────────────────────

/** Section header inside the panel */
function PanelLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
  );
}

/** Big count tile with label and optional badge */
function CountTile({ value, label, badge, badgeColour = 'green' }) {
  const c = COLOUR[badgeColour] ?? COLOUR.green;
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold text-slate-900 tabular-nums leading-none">
        {typeof value === 'number' ? value.toLocaleString('en-US') : '—'}
      </p>
      <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
      {badge && (
        <span className={clsx('mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full', c.badge)}>
          {badge}
        </span>
      )}
    </div>
  );
}

/** Utilization bar with percentage label */
function UtilBar({ value, amberAt, redAt, label }) {
  const colour = utilColour(value, amberAt, redAt);
  const c      = COLOUR[colour];
  const pct    = Math.min(100, Math.max(0, value));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-500">{label}</span>
        <span className={clsx('text-[11px] font-bold tabular-nums', c.text)}>
          {value.toFixed(1)}%
        </span>
      </div>
      {/* Track */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', c.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Threshold markers (visual reference lines) */}
      <div className="relative h-0">
        <div
          className="absolute top-0 w-px h-2 bg-amber-300 opacity-70 -translate-y-2"
          style={{ left: `${amberAt}%` }}
          title={`Amber at ${amberAt}%`}
        />
        <div
          className="absolute top-0 w-px h-2 bg-red-300 opacity-70 -translate-y-2"
          style={{ left: `${redAt}%` }}
          title={`Red at ${redAt}%`}
        />
      </div>
    </div>
  );
}

/** Stat row: label → value (used in battery breakdown) */
function StatRow({ label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={clsx('text-xs font-semibold tabular-nums', valueClass ?? 'text-slate-800')}>
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function InfrastructurePanel({ infrastructure, constraints, battery }) {
  if (!infrastructure) return null;

  const {
    chargersNeeded,
    chargerUtilization,
    baysNeeded,
    bayUtilization,
    batteryPool,
    activePacks,
    reservePacks,
    estimatedCyclesPerPackPerYear,
    chargesPerChargerPerDay,
    swapsPerBayPerDay,
  } = infrastructure;

  // Rated cycles/yr (for the cycle comparison label, not for triggering constraints)
  const ratedCyclesPerYear =
    battery?.batteryCycles && battery?.batteryLifeYears
      ? Math.round(battery.batteryCycles / battery.batteryLifeYears)
      : null;

  // Cycle health colour — use battery stress constraint flag if available
  const cycleStress      = constraints?.batteryStress;
  const cycleTriggered   = cycleStress?.triggered ?? false;
  const cycleColour      = cycleTriggered ? 'red' : 'green';
  const cycleRatio       = ratedCyclesPerYear
    ? estimatedCyclesPerPackPerYear / ratedCyclesPerYear
    : null;

  const chargerColour = utilColour(chargerUtilization, CHARGER_UTIL_AMBER, CHARGER_UTIL_WARN);
  const bayColour     = utilColour(bayUtilization,     BAY_UTIL_AMBER,     BAY_UTIL_WARN);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Card header ───────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-0 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Infrastructure Sizing</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Asset counts and utilization rates · Year 1 steady-state
          </p>
        </div>
        {/* Health summary dot */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {[chargerColour, bayColour, cycleColour].map((c, i) => (
            <span
              key={i}
              className={clsx('w-2.5 h-2.5 rounded-full', COLOUR[c].dot)}
            />
          ))}
        </div>
      </div>

      {/* ── Three-column grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-5 gap-0">

        {/* ── Column 1: Chargers ──────────────────────────────────────── */}
        <div className="md:pr-6 pb-5 md:pb-0">
          <PanelLabel icon={Zap} label="Chargers" />

          <CountTile
            value={chargersNeeded}
            label="chargers needed"
            badge={chargerColour === 'green' ? 'Adequate' : chargerColour === 'amber' ? 'Near limit' : 'Bottleneck'}
            badgeColour={chargerColour}
          />

          <UtilBar
            value={chargerUtilization}
            amberAt={CHARGER_UTIL_AMBER}
            redAt={CHARGER_UTIL_WARN}
            label="Charger utilization"
          />

          <div className="mt-3">
            <StatRow
              label="Charges per charger / day"
              value={chargesPerChargerPerDay.toFixed(1)}
            />
          </div>
        </div>

        {/* ── Column 2: Swap bays ─────────────────────────────────────── */}
        <div className="md:px-6 pt-5 md:pt-0 pb-5 md:pb-0">
          <PanelLabel icon={RotateCcw} label="Swap Bays" />

          <CountTile
            value={baysNeeded}
            label="swap bays needed"
            badge={bayColour === 'green' ? 'Adequate' : bayColour === 'amber' ? 'Near limit' : 'Congested'}
            badgeColour={bayColour}
          />

          <UtilBar
            value={bayUtilization}
            amberAt={BAY_UTIL_AMBER}
            redAt={BAY_UTIL_WARN}
            label="Bay utilization"
          />

          <div className="mt-3">
            <StatRow
              label="Swaps per bay / day"
              value={swapsPerBayPerDay.toFixed(1)}
            />
          </div>
        </div>

        {/* ── Column 3: Battery pool ──────────────────────────────────── */}
        <div className="md:pl-6 pt-5 md:pt-0">
          <PanelLabel icon={BatteryCharging} label="Battery Pool" />

          <CountTile
            value={batteryPool}
            label="total packs in pool"
            badge={cycleColour === 'green' ? 'Healthy' : 'Stressed'}
            badgeColour={cycleColour}
          />

          <div className="mt-4 space-y-0">
            <StatRow label="Active packs (deployed)" value={activePacks} />
            <StatRow label="Reserve packs (spare)" value={reservePacks} />
            <StatRow
              label="Est. cycles / pack / yr"
              value={Math.round(estimatedCyclesPerPackPerYear).toLocaleString('en-US')}
              valueClass={COLOUR[cycleColour].text}
            />
            {ratedCyclesPerYear !== null && (
              <StatRow
                label="Rated cycles / pack / yr"
                value={ratedCyclesPerYear.toLocaleString('en-US')}
              />
            )}
          </div>

          {/* Cycle health bar */}
          {ratedCyclesPerYear !== null && ratedCyclesPerYear > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-500">Cycle load vs rated</span>
                <span className={clsx('text-[11px] font-bold tabular-nums', COLOUR[cycleColour].text)}>
                  {cycleRatio !== null ? `${(cycleRatio * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', COLOUR[cycleColour].bar)}
                  style={{ width: `${Math.min(100, (cycleRatio ?? 0) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
