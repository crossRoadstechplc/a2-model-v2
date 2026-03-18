/**
 * AssumptionsSidebar – live input panel for all model assumptions.
 *
 * ── Architecture ─────────────────────────────────────────────────────────────
 * Pure input surface: reads from Zustand and writes patches back.
 * No calculations, no derived values — all computation is done by the engine
 * functions called via _recompute() after every store update.
 *
 * ── Sections (collapsible accordion) ─────────────────────────────────────────
 *   1. System Inputs   – fleet scale, energy, diesel baseline
 *   2. Battery Co.     – pack cost, IRR, buffer, cycles
 *   3. Platform Co.    – capex, opex, IRR, operational params
 *   4. Fleet Co.       – truck cost, revenue, opex
 *   5. Scenario Controls – presets, projection horizon, reset
 *
 * ── Input priorities ─────────────────────────────────────────────────────────
 * Major drivers → SliderRow   (high-impact assumptions, needs range context)
 * Financial values → FieldRow  (precise $ inputs; range slider unhelpful)
 * All onChange handlers clamp to valid minimums to prevent negative values.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  Cpu,
  BatteryCharging,
  Zap,
  Truck,
  Layers,
  ChevronDown,
  RotateCcw,
  X,
  CheckCircle2,
} from 'lucide-react';

import {
  useSimulatorStore,
  selectSystem,
  selectBattery,
  selectPlatform,
  selectFleet,
  selectSettings,
  selectControls,
  selectInputsFocusSection,
} from '../../store/useSimulatorStore';

import { CompactInput }  from '../ui/CompactInput';
import { CompactSlider } from '../ui/CompactSlider';

import {
  COMPARISON_SCENARIOS,
  COMPARISON_ORDER,
} from '../../lib/scenarios/presets';

// ─── Formatters (sidebar-local, no dependency on finance lib) ─────────────────

const pct   = (v)    => `${(+v).toFixed(1)}%`;
const money = (v, d = 0) => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}`;
const num   = (v)    => Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 });

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, iconColor, borderColor, isOpen, onToggle, badge, highlight = false, highlightClass }) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      className={clsx(
        'w-full flex items-center gap-2.5 px-4 py-3 text-left rounded-lg',
        'transition-colors border',
        highlight && (highlightClass ?? 'ring-4 ring-blue-300 shadow-md animate-pulse'),
        isOpen
          ? `bg-slate-900/5 border-slate-300 ${borderColor}`
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <Icon className={clsx('w-3.5 h-3.5 shrink-0', iconColor)} />
      <span className="flex-1 text-xs font-semibold text-slate-700 uppercase tracking-wider">
        {label}
      </span>
      {badge && (
        <span className={clsx(
          'text-[10px] font-semibold mr-1 px-2 py-0.5 rounded-full border',
          isOpen ? 'text-slate-700 border-slate-300 bg-white/70' : 'text-slate-400 border-slate-200 bg-slate-50',
        )}>
          {badge}
        </span>
      )}
      <ChevronDown
        className={clsx(
          'w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0',
          isOpen && 'rotate-180',
        )}
      />
    </button>
  );
}

// ─── Section body wrapper ─────────────────────────────────────────────────────

function SectionBody({ isOpen, children }) {
  return (
    <div
      className={clsx(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'max-h-[1200px]' : 'max-h-0',
      )}
    >
      <div
        className={clsx(
          'mx-2 mt-2 px-4 pb-3 pt-3 space-y-2 rounded-lg border',
          isOpen ? 'bg-slate-900/5 border-slate-200' : 'bg-transparent border-transparent',
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Sub-group label ─────────────────────────────────────────────────────────

function GroupLabel({ children }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-3 pb-1">
      {children}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION 1 – SYSTEM INPUTS
// ═══════════════════════════════════════════════════════════════════════════════

function SystemSection({ isOpen, onToggle, highlight }) {
  const system    = useSimulatorStore(selectSystem);
  const setSystem = useSimulatorStore((s) => s.setSystem);
  const up = (patch) => setSystem(patch);

  return (
    <>
      <SectionHeader
        icon={Cpu}
        label="System Inputs"
        iconColor="text-blue-500"
        borderColor="border-blue-500"
        highlight={highlight}
        highlightClass="ring-4 ring-blue-300 shadow-lg animate-pulse"
        isOpen={isOpen}
        onToggle={onToggle}
        badge={`${system.trucks} trucks`}
      />
      <SectionBody isOpen={isOpen}>

        <GroupLabel>Fleet scale — primary viability driver</GroupLabel>

        <CompactSlider
          label="Number of Trucks"
          value={system.trucks}
          onChange={(v) => up({ trucks: Math.round(v) })}
          min={1} max={300} step={1}
          format={num}
          accentColor="blue"
          hint="Spreading platform capex across more trucks reduces cost/kWh"
        />
        <CompactSlider
          label="kWh per Swap"
          value={system.kwhPerSwap}
          onChange={(v) => up({ kwhPerSwap: v })}
          min={50} max={600} step={10}
          format={(v) => `${v} kWh`}
          accentColor="blue"
        />
        <CompactSlider
          label="Swaps per Truck per Day"
          value={system.swapsPerTruck}
          onChange={(v) => up({ swapsPerTruck: v })}
          min={0.5} max={6} step={0.5}
          format={(v) => `${v}×`}
          accentColor="blue"
        />

        <GroupLabel>Operational</GroupLabel>

        <CompactInput
          label="Operating Days / yr"
          value={system.operatingDays}
          onChange={(v) => up({ operatingDays: Math.round(v) })}
          min={100} max={365} step={1}
          suffix="days"
          inputWidth="w-16"
        />
        <CompactInput
          label="km per Truck / Day"
          value={system.kmPerTruckPerDay}
          onChange={(v) => up({ kmPerTruckPerDay: v })}
          min={50} max={2000} step={10}
          suffix="km"
          inputWidth="w-16"
        />

        <GroupLabel>Cost basis</GroupLabel>

        <CompactInput
          label="Electricity Cost"
          hint="Grid cost paid by Platform Co."
          value={system.electricityCost}
          onChange={(v) => up({ electricityCost: v })}
          prefix="$" suffix="/kWh"
          min={0.01} max={0.80} step={0.01}
          inputWidth="w-14"
        />
        <CompactInput
          label="Diesel Cost per km"
          hint="Baseline for EV viability comparison"
          value={system.dieselCostPerKm}
          onChange={(v) => up({ dieselCostPerKm: v })}
          prefix="$" suffix="/km"
          min={0.01} max={1.00} step={0.01}
          inputWidth="w-14"
        />

      </SectionBody>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION 2 – BATTERY COMPANY
// ═══════════════════════════════════════════════════════════════════════════════

function BatterySection({ isOpen, onToggle, highlight }) {
  const battery    = useSimulatorStore(selectBattery);
  const setBattery = useSimulatorStore((s) => s.setBattery);
  const up = (patch) => setBattery(patch);

  return (
    <>
      <SectionHeader
        icon={BatteryCharging}
        label="Battery Co."
        iconColor="text-emerald-500"
        borderColor="border-emerald-500"
        highlight={highlight}
        highlightClass="ring-4 ring-emerald-300 shadow-lg animate-pulse"
        isOpen={isOpen}
        onToggle={onToggle}
        badge={`IRR ${pct(battery.batteryIRR * 100)}`}
      />
      <SectionBody isOpen={isOpen}>

        <GroupLabel>Pack economics</GroupLabel>

        <CompactInput
          label="Battery Cost per Pack"
          hint="Total acquisition cost"
          value={battery.batteryCost}
          onChange={(v) => up({ batteryCost: v, costPerPack: v })}
          prefix="$" step={500}
          inputWidth="w-20"
        />
        <CompactInput
          label="Battery Cycles (lifetime)"
          value={battery.batteryCycles}
          onChange={(v) => up({ batteryCycles: Math.round(v) })}
          min={500} max={5000} step={100}
          suffix="cycles"
          inputWidth="w-16"
        />
        <CompactInput
          label="Battery Life"
          value={battery.batteryLifeYears}
          onChange={(v) => up({ batteryLifeYears: Math.round(v) })}
          min={1} max={20} step={1}
          suffix="yrs"
          inputWidth="w-12"
        />
        <CompactInput
          label="Maintenance / Pack / Mo"
          value={battery.maintenancePerPackPerMonth}
          onChange={(v) => up({ maintenancePerPackPerMonth: v })}
          prefix="$" step={5}
          inputWidth="w-16"
        />

        <GroupLabel>Pack sizing</GroupLabel>

        <CompactSlider
          label="Buffer Multiplier"
          value={battery.batteryBufferMultiplier}
          onChange={(v) => up({ batteryBufferMultiplier: v, packsPerTruck: v })}
          min={1.0} max={4.0} step={0.1}
          format={(v) => `${v.toFixed(1)}×`}
          accentColor="emerald"
          hint="Rotation buffer — packs deployed per active truck"
        />
        <CompactInput
          label="Reserve Percent"
          hint="Packs held offline for maintenance"
          value={+(battery.batteryReservePercent * 100).toFixed(1)}
          onChange={(v) => up({ batteryReservePercent: v / 100 })}
          suffix="%" min={0} max={30} step={0.5}
          inputWidth="w-14"
        />

        <GroupLabel>Returns & pricing</GroupLabel>

        <CompactSlider
          label="Target Battery IRR"
          value={+(battery.batteryIRR * 100).toFixed(1)}
          onChange={(v) => up({ batteryIRR: v / 100 })}
          min={5} max={45} step={0.5}
          format={pct}
          accentColor="emerald"
          hint="Sets the battery lease price via IRR solver"
        />
        <CompactInput
          label="Platform Infra Fee / Mo"
          hint="Paid by Battery Co. to Platform Co."
          value={battery.platformFeePerMonth}
          onChange={(v) => up({ platformFeePerMonth: v })}
          prefix="$" step={250}
          inputWidth="w-20"
        />
        <CompactSlider
          label="Annual Growth Rate"
          value={+(battery.annualGrowthRate * 100).toFixed(0)}
          onChange={(v) => up({ annualGrowthRate: v / 100 })}
          min={0} max={60} step={1}
          format={pct}
          accentColor="emerald"
        />

      </SectionBody>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION 3 – PLATFORM COMPANY
// ═══════════════════════════════════════════════════════════════════════════════

function PlatformSection({ isOpen, onToggle, highlight }) {
  const platform    = useSimulatorStore(selectPlatform);
  const setPlatform = useSimulatorStore((s) => s.setPlatform);
  const up = (patch) => setPlatform(patch);

  return (
    <>
      <SectionHeader
        icon={Zap}
        label="Platform Co."
        iconColor="text-sky-500"
        borderColor="border-sky-500"
        highlight={highlight}
        highlightClass="ring-4 ring-sky-300 shadow-lg animate-pulse"
        isOpen={isOpen}
        onToggle={onToggle}
        badge={`IRR ${pct(platform.platformIRR * 100)}`}
      />
      <SectionBody isOpen={isOpen}>

        <GroupLabel>Capital expenditure</GroupLabel>

        <CompactInput
          label="Total Fixed Capex"
          hint="Full corridor infrastructure build-out"
          value={platform.platformFixedCapex}
          onChange={(v) => up({ platformFixedCapex: v })}
          prefix="$" step={100000}
          inputWidth="w-20"
        />
        <CompactInput
          label="Charger Cost (per unit)"
          value={platform.chargerCost}
          onChange={(v) => up({ chargerCost: v })}
          prefix="$" step={5000}
          inputWidth="w-20"
        />
        <CompactInput
          label="Swap Bay Cost (per bay)"
          value={platform.bayCost}
          onChange={(v) => up({ bayCost: v })}
          prefix="$" step={5000}
          inputWidth="w-20"
        />
        <CompactInput
          label="Amortization Period"
          value={platform.capexAmortizationYears}
          onChange={(v) => up({ capexAmortizationYears: Math.round(v) })}
          min={1} max={30} step={1}
          suffix="yrs"
          inputWidth="w-12"
        />

        <GroupLabel>Operating costs</GroupLabel>

        <CompactInput
          label="Total Annual Opex"
          hint="All-in platform operating cost"
          value={platform.platformOpex}
          onChange={(v) => up({ platformOpex: v })}
          prefix="$" step={50000}
          inputWidth="w-20"
        />
        <CompactInput
          label="Stations on Corridor"
          value={platform.numStations}
          onChange={(v) => up({ numStations: Math.round(v) })}
          min={1} max={100} step={1}
          suffix="stn"
          inputWidth="w-12"
        />

        <GroupLabel>Operational parameters</GroupLabel>

        <CompactInput
          label="Charge Time"
          hint="Minutes to fully charge one pack"
          value={platform.chargeTimeMinutes}
          onChange={(v) => up({ chargeTimeMinutes: v })}
          suffix="min" min={10} max={180} step={5}
          inputWidth="w-14"
        />
        <CompactInput
          label="Swap Time"
          value={platform.swapTimeMinutes}
          onChange={(v) => up({ swapTimeMinutes: v })}
          suffix="min" min={1} max={30} step={1}
          inputWidth="w-14"
        />
        <CompactInput
          label="Charging Window"
          hint="Daily hours available for charging"
          value={platform.chargingWindowHours}
          onChange={(v) => up({ chargingWindowHours: v })}
          suffix="hrs" min={1} max={24} step={0.5}
          inputWidth="w-14"
        />

        <GroupLabel>Returns</GroupLabel>

        <CompactSlider
          label="Target Platform IRR"
          value={+(platform.platformIRR * 100).toFixed(1)}
          onChange={(v) => up({ platformIRR: v / 100 })}
          min={5} max={40} step={0.5}
          format={pct}
          accentColor="blue"
          hint="Sets the platform fee $/kWh via IRR solver"
        />
        <CompactSlider
          label="Annual Revenue Growth"
          value={+(platform.annualGrowthRate * 100).toFixed(0)}
          onChange={(v) => up({ annualGrowthRate: v / 100 })}
          min={0} max={60} step={1}
          format={pct}
          accentColor="blue"
        />

      </SectionBody>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION 4 – FLEET COMPANY
// ═══════════════════════════════════════════════════════════════════════════════

function FleetSection({ isOpen, onToggle, highlight }) {
  const fleet    = useSimulatorStore(selectFleet);
  const setFleet = useSimulatorStore((s) => s.setFleet);
  const up = (patch) => setFleet(patch);

  return (
    <>
      <SectionHeader
        icon={Truck}
        label="Fleet Co."
        iconColor="text-amber-500"
        borderColor="border-amber-500"
        highlight={highlight}
        highlightClass="ring-4 ring-amber-300 shadow-lg animate-pulse"
        isOpen={isOpen}
        onToggle={onToggle}
        badge={`Rev ${money(fleet.freightRevenuePerTruck)}/mo`}
      />
      <SectionBody isOpen={isOpen}>

        <GroupLabel>Revenue</GroupLabel>

        <CompactSlider
          label="Freight Revenue / Truck / Mo"
          value={fleet.freightRevenuePerTruck}
          onChange={(v) => up({ freightRevenuePerTruck: v, freightRevenuePerTruckPerMonth: v })}
          min={5000} max={40000} step={500}
          format={(v) => money(v)}
          accentColor="amber"
          hint="Contracted haulage rate per truck"
        />

        <GroupLabel>Truck assets</GroupLabel>

        <CompactInput
          label="Truck Cost (per truck)"
          hint="EV truck acquisition price"
          value={fleet.truckCost}
          onChange={(v) => up({ truckCost: v, truckPurchasePrice: v })}
          prefix="$" step={5000}
          inputWidth="w-20"
        />
        <CompactInput
          label="Truck Life"
          value={fleet.truckLifeYears}
          onChange={(v) => up({ truckLifeYears: Math.round(v) })}
          min={1} max={20} step={1}
          suffix="yrs"
          inputWidth="w-12"
        />

        <GroupLabel>Operating costs</GroupLabel>

        <CompactInput
          label="Fleet Opex / Truck / Mo"
          hint="Driver + maintenance + insurance"
          value={fleet.fleetOpexPerTruck}
          onChange={(v) => up({ fleetOpexPerTruck: v })}
          prefix="$" step={100}
          inputWidth="w-20"
        />
        <CompactInput
          label="Driver Cost / Truck / Mo"
          value={fleet.driverCostPerTruckPerMonth}
          onChange={(v) => up({ driverCostPerTruckPerMonth: v })}
          prefix="$" step={100}
          inputWidth="w-20"
        />
        <CompactInput
          label="Maintenance / Truck / Mo"
          value={fleet.maintenancePerTruckPerMonth}
          onChange={(v) => up({ maintenancePerTruckPerMonth: v })}
          prefix="$" step={25}
          inputWidth="w-20"
        />
        <CompactInput
          label="Insurance / Truck / Mo"
          value={fleet.insurancePerTruckPerMonth}
          onChange={(v) => up({ insurancePerTruckPerMonth: v })}
          prefix="$" step={25}
          inputWidth="w-20"
        />

        <GroupLabel>Growth</GroupLabel>

        <CompactSlider
          label="Annual Fleet Growth Rate"
          value={+(fleet.annualGrowthRate * 100).toFixed(0)}
          onChange={(v) => up({ annualGrowthRate: v / 100 })}
          min={0} max={80} step={1}
          format={pct}
          accentColor="amber"
          hint="Fleet size compounds at this rate year-over-year"
        />

      </SectionBody>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION 5 – SCENARIO CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

function ControlsSection({ isOpen, onToggle, highlight }) {
  const settings       = useSimulatorStore(selectSettings);
  const controls       = useSimulatorStore(selectControls);
  const updateSettings = useSimulatorStore((s) => s.updateSettings);
  const setControls    = useSimulatorStore((s) => s.setControls);
  const loadScenario   = useSimulatorStore((s) => s.loadScenario);
  const resetToDefaults = useSimulatorStore((s) => s.resetToDefaults);

  const activeKey = controls.selectedScenario;

  return (
    <>
      <SectionHeader
        icon={Layers}
        label="Scenario Controls"
        iconColor="text-violet-500"
        borderColor="border-violet-500"
        highlight={highlight}
        highlightClass="ring-4 ring-violet-300 shadow-lg animate-pulse"
        isOpen={isOpen}
        onToggle={onToggle}
        badge={`${settings.projectionYears} yr`}
      />
      <SectionBody isOpen={isOpen}>

        <GroupLabel>Projection horizon</GroupLabel>

        <CompactInput
          label="Projection Years"
          hint="Number of annual periods to model"
          value={settings.projectionYears}
          onChange={(v) => updateSettings({ projectionYears: Math.round(Math.max(1, v)) })}
          min={1} max={15} step={1}
          suffix="yrs"
          inputWidth="w-12"
        />

        <GroupLabel>Display mode</GroupLabel>

        {/* Pricing mode select */}
        <div className="py-2 border-b border-slate-50">
          <p className="text-[11px] font-medium text-slate-700 mb-1.5">Pricing Mode</p>
          <select
            value={controls.pricingMode}
            onChange={(e) => setControls({ pricingMode: e.target.value })}
            className="w-full h-7 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 cursor-pointer"
          >
            <option value="lease">Lease — monthly per truck</option>
            <option value="swap">Swap — per event</option>
            <option value="subscription">Subscription — annual flat</option>
          </select>
        </div>

        {/* View mode select */}
        <div className="py-2 border-b border-slate-50">
          <p className="text-[11px] font-medium text-slate-700 mb-1.5">View Mode</p>
          <select
            value={controls.viewMode}
            onChange={(e) => setControls({ viewMode: e.target.value })}
            className="w-full h-7 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 cursor-pointer"
          >
            <option value="financial">Financial — P&L and returns</option>
            <option value="operational">Operational — kWh and throughput</option>
            <option value="comparison">Comparison — EV vs diesel</option>
          </select>
        </div>

        <GroupLabel>Load a preset scenario</GroupLabel>

        <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
          Replaces all assumptions with preset values. Current inputs will be overwritten.
        </p>

        <div className="space-y-1.5 pb-1">
          {COMPARISON_ORDER.map((key) => {
            const s        = COMPARISON_SCENARIOS[key];
            const isLoaded = activeKey === key;
            const theme    = s.meta.theme;

            return (
              <button
                key={key}
                onClick={() => loadScenario(key)}
                className={clsx(
                  'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all',
                  isLoaded
                    ? `${theme.bg} ${theme.border} border-2`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                {isLoaded ? (
                  <CheckCircle2 className={clsx('w-3.5 h-3.5 mt-0.5 shrink-0', theme.text)} />
                ) : (
                  <div className="w-3.5 h-3.5 mt-0.5 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={clsx(
                    'text-[11px] font-semibold leading-tight',
                    isLoaded ? theme.text : 'text-slate-700',
                  )}>
                    {s.meta.label}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
                    {s.meta.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </SectionBody>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_OPEN = {
  system:   true,
  battery:  false,
  platform: false,
  fleet:    false,
  controls: true,
};

export function AssumptionsSidebar() {
  const setPanelOpen    = useSimulatorStore((s) => s.setPanelOpen);
  const resetToDefaults = useSimulatorStore((s) => s.resetToDefaults);
  const focusSection = useSimulatorStore(selectInputsFocusSection);

  // Accordion open/close state (purely UI — not in Zustand)
  const [open,          setOpen]          = useState(DEFAULT_OPEN);
  // Two-step reset confirmation (prevents accidental reset)
  const [confirmReset,  setConfirmReset]  = useState(false);

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const sectionRefs = useRef({});
  const registerSectionRef = useMemo(() => {
    return (key) => (el) => {
      if (!key) return;
      if (el) sectionRefs.current[key] = el;
    };
  }, []);

  useEffect(() => {
    if (!focusSection) return;
    setOpen((prev) => ({ ...prev, [focusSection]: true }));
    // Give the expand animation a beat before scrolling.
    setTimeout(() => {
      const el = sectionRefs.current?.[focusSection];
      el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }, 150);
  }, [focusSection]);

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      // Auto-cancel after 4 s if user does nothing
      setTimeout(() => setConfirmReset(false), 4_000);
    } else {
      resetToDefaults();
      setConfirmReset(false);
    }
  }

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen overflow-hidden z-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
        <div>
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Model Inputs
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            All changes update the model instantly
          </p>
        </div>
        <button
          onClick={() => setPanelOpen(false)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          aria-label="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Scrollable sections ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Dividers between sections */}
        <div className="divide-y divide-slate-100">
          <div ref={registerSectionRef('system')}>
            <SystemSection   isOpen={open.system}   onToggle={() => toggle('system')}   highlight={focusSection === 'system'} />
          </div>
          <div ref={registerSectionRef('battery')}>
            <BatterySection  isOpen={open.battery}  onToggle={() => toggle('battery')}  highlight={focusSection === 'battery'} />
          </div>
          <div ref={registerSectionRef('platform')}>
            <PlatformSection isOpen={open.platform} onToggle={() => toggle('platform')} highlight={focusSection === 'platform'} />
          </div>
          <div ref={registerSectionRef('fleet')}>
            <FleetSection    isOpen={open.fleet}    onToggle={() => toggle('fleet')}    highlight={focusSection === 'fleet'} />
          </div>
          <div ref={registerSectionRef('controls')}>
            <ControlsSection isOpen={open.controls} onToggle={() => toggle('controls')} highlight={focusSection === 'controls'} />
          </div>
        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-200 p-3 bg-slate-50 space-y-2">
        {confirmReset ? (
          <div className="flex gap-1.5">
            <span className="flex-1 flex items-center text-[11px] text-red-600 font-semibold px-2">
              Discard all changes?
            </span>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-red-500 text-white text-[11px] font-bold rounded-lg hover:bg-red-600 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all to defaults
          </button>
        )}
        <p className="text-[10px] text-slate-400 text-center">
          Inputs saved automatically in browser
        </p>
      </div>

    </aside>
  );
}
