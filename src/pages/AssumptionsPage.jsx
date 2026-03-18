/**
 * Assumptions page – all model inputs in one place.
 * Tabs: System | Platform | Battery | Fleet | Settings
 *
 * Each panel reads from and writes to the centralized Zustand store.
 * No calculations happen here — inputs are passed to engine functions
 * exclusively through the store's _recompute() call chain.
 */

import { useState } from 'react';
import clsx from 'clsx';
import {
  Cpu,
  Zap,
  BatteryCharging,
  Truck,
  Settings2,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  useSimulatorStore,
  selectSystem,
  selectBattery,
  selectPlatform,
  selectFleet,
  selectSettings,
  selectControls,
} from '../store/useSimulatorStore';
import { SCENARIO_ORDER, getScenarioMeta } from '../data/scenarios';
import { Card }         from '../components/ui/Card';
import { InputField }   from '../components/ui/InputField';
import { SliderInput }  from '../components/ui/SliderInput';
import { SectionTitle } from '../components/ui/SectionTitle';
import { formatPercent, formatDollars } from '../lib/finance/formatters';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'system',    label: 'System',    icon: Cpu           },
  { id: 'platform',  label: 'Platform',  icon: Zap           },
  { id: 'battery',   label: 'Battery',   icon: BatteryCharging },
  { id: 'fleet',     label: 'Fleet',     icon: Truck         },
  { id: 'settings',  label: 'Settings',  icon: Settings2     },
];

// ─── Sub-section label ────────────────────────────────────────────────────────
function SubLabel({ children }) {
  return (
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-2">
      {children}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SYSTEM PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function SystemPanel() {
  const system    = useSimulatorStore(selectSystem);
  const setSystem = useSimulatorStore((s) => s.setSystem);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="System Parameters"
        subtitle="Shared physical inputs used across all three entity models."
      />

      <SubLabel>Fleet scale</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          label="Number of Trucks"
          value={system.trucks}
          onChange={(v) => setSystem({ trucks: Math.round(v) })}
          min={1} max={500} step={1}
          hint="Total trucks operating on the corridor (shared driver for all entities)"
        />
        <InputField
          label="km per Truck per Day"
          value={system.kmPerTruckPerDay}
          onChange={(v) => setSystem({ kmPerTruckPerDay: v })}
          min={50} max={1500} step={10}
          hint="Daily distance driven per truck"
        />
        <InputField
          label="Operating Days per Year"
          value={system.operatingDays}
          onChange={(v) => setSystem({ operatingDays: Math.round(v) })}
          min={200} max={365} step={1}
          hint="Days per year the corridor operates"
        />
      </div>

      <SubLabel>Energy & swap</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          label="kWh per Swap"
          value={system.kwhPerSwap}
          onChange={(v) => setSystem({ kwhPerSwap: v })}
          min={50} max={600} step={10}
          suffix="kWh"
          hint="Energy delivered per single battery swap event"
        />
        <InputField
          label="Swaps per Truck per Day"
          value={system.swapsPerTruck}
          onChange={(v) => setSystem({ swapsPerTruck: v })}
          min={0.5} max={6} step={0.5}
          hint="Average number of swap events per truck per operating day"
        />
        <InputField
          label="Electricity Cost"
          value={system.electricityCost}
          onChange={(v) => setSystem({ electricityCost: v })}
          prefix="$" suffix="/kWh"
          min={0.01} max={0.50} step={0.01}
          hint="Grid cost paid by Platform Co. per kWh"
        />
      </div>

      <SubLabel>Diesel comparison baseline</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          label="Diesel Cost per km"
          value={system.dieselCostPerKm}
          onChange={(v) => setSystem({ dieselCostPerKm: v })}
          prefix="$" suffix="/km"
          min={0.05} max={0.60} step={0.01}
          hint="Baseline diesel fuel cost (used for EV vs diesel comparison)"
        />
      </div>

      {/* Live derived preview */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 mt-2">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
          Derived system totals
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Daily kWh demand',
              value: formatDollars(system.trucks * system.swapsPerTruck * system.kwhPerSwap).replace('$', '') + ' kWh',
            },
            {
              label: 'Annual kWh demand',
              value: formatDollars(system.trucks * system.swapsPerTruck * system.kwhPerSwap * system.operatingDays).replace('$', '') + ' kWh',
            },
            {
              label: 'Annual electricity cost',
              value: formatDollars(system.trucks * system.swapsPerTruck * system.kwhPerSwap * system.operatingDays * system.electricityCost),
            },
            {
              label: 'Annual diesel equivalent',
              value: formatDollars(system.trucks * system.kmPerTruckPerDay * system.operatingDays * system.dieselCostPerKm),
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-blue-500">{item.label}</p>
              <p className="text-sm font-bold text-blue-800 tabular-nums mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PLATFORM PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function PlatformPanel() {
  const platform    = useSimulatorStore(selectPlatform);
  const setPlatform = useSimulatorStore((s) => s.setPlatform);
  const up = (patch) => setPlatform(patch);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Platform Company"
        subtitle="Charging infrastructure — revenue from Fleet access fees + Battery infra fees."
      />

      <SubLabel>Capital expenditure</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Total Fixed Capex"
          value={platform.platformFixedCapex}
          onChange={(v) => up({ platformFixedCapex: v })}
          prefix="$" step={100_000}
          hint="Total corridor infrastructure build-out cost"
        />
        <InputField label="Number of Stations"
          value={platform.numStations}
          onChange={(v) => up({ numStations: Math.round(v) })}
          min={1} max={100}
          hint="Charging / swap stations on the corridor"
        />
        <InputField label="Amortization Period"
          value={platform.capexAmortizationYears}
          onChange={(v) => up({ capexAmortizationYears: Math.round(v) })}
          min={1} max={30} suffix="yrs"
        />
        <InputField label="Charger Cost (per unit)"
          value={platform.chargerCost}
          onChange={(v) => up({ chargerCost: v })}
          prefix="$" step={5_000}
        />
        <InputField label="Swap Bay Cost (per bay)"
          value={platform.bayCost}
          onChange={(v) => up({ bayCost: v })}
          prefix="$" step={5_000}
        />
        <InputField label="Cooling System Cost"
          value={platform.coolingCost}
          onChange={(v) => up({ coolingCost: v })}
          prefix="$" step={2_500}
        />
      </div>

      <SubLabel>Operating costs</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Total Annual Opex"
          value={platform.platformOpex}
          onChange={(v) => up({ platformOpex: v })}
          prefix="$" step={50_000}
          hint="All-in annual operating cost for the platform"
        />
        <InputField label="Opex per Station / Month"
          value={platform.opexPerStationPerMonth}
          onChange={(v) => up({ opexPerStationPerMonth: v })}
          prefix="$" step={500}
        />
        <InputField label="Staff Cost / Month"
          value={platform.staffCostPerMonth}
          onChange={(v) => up({ staffCostPerMonth: v })}
          prefix="$" step={5_000}
        />
        <InputField label="Software Cost / Month"
          value={platform.softwareCostPerMonth}
          onChange={(v) => up({ softwareCostPerMonth: v })}
          prefix="$" step={1_000}
        />
      </div>

      <SubLabel>Revenue</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Platform Fee / Truck / Month"
          value={platform.platformFeePerTruckPerMonth}
          onChange={(v) => up({ platformFeePerTruckPerMonth: v })}
          prefix="$" step={50}
          hint="Access fee charged to Fleet Co."
        />
        <InputField label="Infra Fee from Battery / Month"
          value={platform.infraFeeFromBatteryPerMonth}
          onChange={(v) => up({ infraFeeFromBatteryPerMonth: v })}
          prefix="$" step={500}
          hint="Fixed monthly slot fee from Battery Co."
        />
      </div>

      <SubLabel>Operational parameters</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <InputField label="Charge Time"
          value={platform.chargeTimeMinutes}
          onChange={(v) => up({ chargeTimeMinutes: v })}
          suffix="min" min={10} max={180} step={5}
          hint="Minutes to fully charge one pack"
        />
        <InputField label="Swap Time"
          value={platform.swapTimeMinutes}
          onChange={(v) => up({ swapTimeMinutes: v })}
          suffix="min" min={1} max={30} step={1}
          hint="Minutes to complete a swap event"
        />
        <InputField label="Charging Window"
          value={platform.chargingWindowHours}
          onChange={(v) => up({ chargingWindowHours: v })}
          suffix="hrs" min={1} max={24} step={0.5}
          hint="Hours per day available for charging"
        />
      </div>

      <SliderInput
        label="Target Platform IRR"
        value={platform.platformIRR * 100}
        onChange={(v) => up({ platformIRR: v / 100 })}
        min={5} max={40} step={0.5}
        format={(v) => formatPercent(v)}
        accentClass="accent-blue-600"
      />
      <SliderInput
        label="Annual Revenue Growth Rate"
        value={platform.annualGrowthRate * 100}
        onChange={(v) => up({ annualGrowthRate: v / 100 })}
        min={0} max={60} step={1}
        format={(v) => formatPercent(v)}
        accentClass="accent-blue-600"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BATTERY PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function BatteryPanel() {
  const battery    = useSimulatorStore(selectBattery);
  const setBattery = useSimulatorStore((s) => s.setBattery);
  const up = (patch) => setBattery(patch);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Battery Company"
        subtitle="Owns battery packs — leases to Fleet; pays Platform for infrastructure."
      />

      <SubLabel>Pack economics</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Battery Cost (per pack)"
          value={battery.batteryCost}
          onChange={(v) => up({ batteryCost: v })}
          prefix="$" step={1_000}
          hint="Total acquisition cost per battery pack"
        />
        <InputField label="Battery Cycles (lifetime)"
          value={battery.batteryCycles}
          onChange={(v) => up({ batteryCycles: Math.round(v) })}
          min={500} max={5_000} step={100}
          hint="Total rated charge–discharge cycles per pack"
        />
        <InputField label="Battery Life (years)"
          value={battery.batteryLifeYears}
          onChange={(v) => up({ batteryLifeYears: Math.round(v) })}
          min={1} max={15}
          hint="Replacement / depreciation period"
        />
        <InputField label="Maintenance / Pack / Month"
          value={battery.maintenancePerPackPerMonth}
          onChange={(v) => up({ maintenancePerPackPerMonth: v })}
          prefix="$" step={5}
        />
      </div>

      <SubLabel>Pack sizing & efficiency</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Buffer Multiplier (packs/truck)"
          value={battery.batteryBufferMultiplier}
          onChange={(v) => up({ batteryBufferMultiplier: v })}
          min={1} max={4} step={0.1}
          hint="Rotation buffer — packs deployed per active truck"
        />
        <InputField label="Reserve Percent"
          value={battery.batteryReservePercent * 100}
          onChange={(v) => up({ batteryReservePercent: v / 100 })}
          suffix="%" min={0} max={30} step={0.5}
          hint="% of pack inventory kept offline as maintenance reserve"
        />
      </div>
      <SliderInput
        label="Round-trip Efficiency"
        value={battery.batteryEfficiency * 100}
        onChange={(v) => up({ batteryEfficiency: v / 100 })}
        min={70} max={99} step={0.5}
        format={(v) => formatPercent(v)}
        accentClass="accent-emerald-600"
        hint="Charge-to-discharge energy efficiency"
      />

      <SubLabel>Revenue & inter-company fees</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Lease per Truck / Month"
          value={battery.leasePerTruckPerMonth}
          onChange={(v) => up({ leasePerTruckPerMonth: v })}
          prefix="$" step={50}
          hint="Monthly battery lease charged to Fleet Co."
        />
        <InputField label="Platform Fee / Month"
          value={battery.platformFeePerMonth}
          onChange={(v) => up({ platformFeePerMonth: v })}
          prefix="$" step={500}
          hint="Fixed monthly infra fee paid to Platform Co."
        />
      </div>

      <SliderInput
        label="Target Battery IRR"
        value={battery.batteryIRR * 100}
        onChange={(v) => up({ batteryIRR: v / 100 })}
        min={5} max={45} step={0.5}
        format={(v) => formatPercent(v)}
        accentClass="accent-emerald-600"
      />
      <SliderInput
        label="Annual Growth Rate"
        value={battery.annualGrowthRate * 100}
        onChange={(v) => up({ annualGrowthRate: v / 100 })}
        min={0} max={60} step={1}
        format={(v) => formatPercent(v)}
        accentClass="accent-emerald-600"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FLEET PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function FleetPanel() {
  const fleet    = useSimulatorStore(selectFleet);
  const setFleet = useSimulatorStore((s) => s.setFleet);
  const up = (patch) => setFleet(patch);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Fleet Company"
        subtitle="Operates EV trucks — earns freight revenue; pays Platform + Battery fees."
      />

      <SubLabel>Truck assets</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Truck Cost (per truck)"
          value={fleet.truckCost}
          onChange={(v) => up({ truckCost: v })}
          prefix="$" step={5_000}
          hint="EV truck acquisition / purchase price"
        />
        <InputField label="Truck Life (years)"
          value={fleet.truckLifeYears}
          onChange={(v) => up({ truckLifeYears: Math.round(v) })}
          min={1} max={20}
        />
      </div>

      <SubLabel>Operating costs</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Total Opex / Truck / Month"
          value={fleet.fleetOpexPerTruck}
          onChange={(v) => up({ fleetOpexPerTruck: v })}
          prefix="$" step={50}
          hint="Bundled opex: driver + maintenance + insurance"
        />
        <InputField label="Driver Cost / Truck / Month"
          value={fleet.driverCostPerTruckPerMonth}
          onChange={(v) => up({ driverCostPerTruckPerMonth: v })}
          prefix="$" step={100}
        />
        <InputField label="Maintenance / Truck / Month"
          value={fleet.maintenancePerTruckPerMonth}
          onChange={(v) => up({ maintenancePerTruckPerMonth: v })}
          prefix="$" step={25}
        />
        <InputField label="Insurance / Truck / Month"
          value={fleet.insurancePerTruckPerMonth}
          onChange={(v) => up({ insurancePerTruckPerMonth: v })}
          prefix="$" step={25}
        />
      </div>

      <SubLabel>Revenue & inter-company fees</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Freight Revenue / Truck / Month"
          value={fleet.freightRevenuePerTruck}
          onChange={(v) => up({ freightRevenuePerTruck: v })}
          prefix="$" step={500}
          hint="Gross contracted haulage revenue per truck"
        />
        <InputField label="Platform Fee / Truck / Month"
          value={fleet.platformFeePerTruckPerMonth}
          onChange={(v) => up({ platformFeePerTruckPerMonth: v })}
          prefix="$" step={50}
          hint="Must match Platform Co. assumption"
        />
        <InputField label="Battery Lease / Truck / Month"
          value={fleet.batteryLeasePerTruckPerMonth}
          onChange={(v) => up({ batteryLeasePerTruckPerMonth: v })}
          prefix="$" step={50}
          hint="Must match Battery Co. assumption"
        />
      </div>

      <SliderInput
        label="Annual Fleet Growth Rate"
        value={fleet.annualGrowthRate * 100}
        onChange={(v) => up({ annualGrowthRate: v / 100 })}
        min={0} max={80} step={1}
        format={(v) => formatPercent(v)}
        accentClass="accent-amber-500"
        hint="Fleet size compounds at this rate year-over-year"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsPanel() {
  const settings       = useSimulatorStore(selectSettings);
  const controls       = useSimulatorStore(selectControls);
  const updateSettings = useSimulatorStore((s) => s.updateSettings);
  const setControls    = useSimulatorStore((s) => s.setControls);
  const loadScenario   = useSimulatorStore((s) => s.loadScenario);

  return (
    <div className="space-y-8">
      <SectionTitle title="Model Settings" subtitle="Global parameters and scenario loading." />

      <SubLabel>Model metadata</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Corridor Name
          </label>
          <input
            type="text"
            value={settings.corridorName}
            onChange={(e) => updateSettings({ corridorName: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <InputField
          label="Projection Years"
          value={settings.projectionYears}
          onChange={(v) => updateSettings({ projectionYears: Math.round(v) })}
          min={1} max={10} step={1}
          hint="Number of annual periods to project"
        />
      </div>

      <SubLabel>Display controls</SubLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Pricing Mode
          </label>
          <select
            value={controls.pricingMode}
            onChange={(e) => setControls({ pricingMode: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="lease">Lease — fixed monthly per truck</option>
            <option value="swap">Swap — fee per swap event</option>
            <option value="subscription">Subscription — annual flat fee</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            View Mode
          </label>
          <select
            value={controls.viewMode}
            onChange={(e) => setControls({ viewMode: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="financial">Financial — P&L and returns</option>
            <option value="operational">Operational — kWh, swaps, throughput</option>
            <option value="comparison">Comparison — EV vs diesel</option>
          </select>
        </div>
      </div>

      {/* Load scenario presets */}
      <div>
        <SubLabel>Load a scenario preset</SubLabel>
        <p className="text-xs text-slate-500 mb-4">
          Applying a preset overwrites all assumptions with pre-defined values.
          Your current inputs will be replaced.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIO_ORDER.map((key) => {
            const meta = getScenarioMeta(key);
            const isActive = controls.selectedScenario === key;
            const borderColor = {
              conservative: 'border-amber-200 hover:border-amber-400',
              base:         'border-blue-200 hover:border-blue-400',
              bull:         'border-emerald-200 hover:border-emerald-400',
              bear:         'border-red-200 hover:border-red-400',
            }[key] ?? 'border-slate-200';
            const activeBg = {
              conservative: 'bg-amber-50',
              base:         'bg-blue-50',
              bull:         'bg-emerald-50',
              bear:         'bg-red-50',
            }[key] ?? 'bg-slate-50';
            return (
              <button
                key={key}
                onClick={() => loadScenario(key)}
                className={clsx(
                  'text-left p-4 rounded-lg border-2 transition-all',
                  isActive ? `${activeBg} ${borderColor}` : `bg-white ${borderColor}`,
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
                  {isActive && (
                    <span className="text-xs font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function AssumptionsPage() {
  const [activeTab, setActiveTab] = useState('system');
  const resetToDefaults = useSimulatorStore((s) => s.resetToDefaults);

  return (
    <div className="space-y-4">

      {/* Tab bar + reset button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg hover:border-red-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to defaults
        </button>
      </div>

      {/* Active panel */}
      <Card padding="lg">
        {activeTab === 'system'   && <SystemPanel   />}
        {activeTab === 'platform' && <PlatformPanel />}
        {activeTab === 'battery'  && <BatteryPanel  />}
        {activeTab === 'fleet'    && <FleetPanel    />}
        {activeTab === 'settings' && <SettingsPanel />}
      </Card>
    </div>
  );
}
