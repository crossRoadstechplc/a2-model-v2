/**
 * useSimulatorStore – centralized Zustand store for the A2 Investor Simulator.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  STATE SHAPE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   settings   – global metadata (corridor name, projection years)
 *   system     – shared physical parameters (trucks, kWh/swap, electricity $, …)
 *   battery    – Battery Company assumptions
 *   platform   – Platform Company assumptions
 *   fleet      – Fleet Company assumptions
 *   controls   – UI / scenario settings (selectedScenario, pricingMode, viewMode)
 *   activePage – current navigation page
 *   results    – computed projections (derived; never mutated directly)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ACTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   updateSettings(patch)   setSystem(patch)     setBattery(patch)
 *   setPlatform(patch)      setFleet(patch)       setControls(patch)
 *   setActivePage(page)     setScenario(key)     ← convenience alias
 *   loadScenario(key)       resetToDefaults()
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  SELECTORS  (named exports – use with useSimulatorStore(selector))
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   selectSystem   selectBattery  selectPlatform  selectFleet
 *   selectControls selectSettings selectResults   selectAllAssumptions
 *   selectScenario selectActivePage
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  PERSISTENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   Assumptions are persisted to localStorage under 'a2-simulator-v2'.
 *   Computed results are excluded and re-derived on every page load.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM,
  DEFAULT_BATTERY,
  DEFAULT_PLATFORM,
  DEFAULT_FLEET,
  DEFAULT_CONTROLS,
} from '../data/defaults';

import { SCENARIO_PRESETS } from '../data/scenarios';
import { runModel }         from '../lib/engine/runModel';
import { runScenario }      from '../lib/engine/runScenario';

// ─── Engine adapter ──────────────────────────────────────────────────────────
/**
 * Translates the store's five-group state into the shapes expected by the
 * existing engine functions, then calls runModel().
 *
 * This is the ONLY place where new field names are mapped to engine field names.
 * Engine functions never need to change when we rename/add store fields.
 */
function deriveResults(state) {
  const { settings, system, battery, platform, fleet, controls } = state;

  // Fleet engine expects numTrucks – driven by system.trucks (the authoritative source)
  const fleetForEngine = {
    ...fleet,
    numTrucks:                      system.trucks,
    truckPurchasePrice:             fleet.truckCost,
    freightRevenuePerTruckPerMonth: fleet.freightRevenuePerTruck,
    // Component opex fields kept for any engine that reads them individually
    driverCostPerTruckPerMonth:
      fleet.driverCostPerTruckPerMonth ?? DEFAULT_FLEET.driverCostPerTruckPerMonth,
    maintenancePerTruckPerMonth:
      fleet.maintenancePerTruckPerMonth ?? DEFAULT_FLEET.maintenancePerTruckPerMonth,
    insurancePerTruckPerMonth:
      fleet.insurancePerTruckPerMonth ?? DEFAULT_FLEET.insurancePerTruckPerMonth,
  };

  // Battery engine expects packsPerTruck / costPerPack
  const batteryForEngine = {
    ...battery,
    packsPerTruck: battery.batteryBufferMultiplier,
    costPerPack:   battery.batteryCost,
  };

  // Platform engine uses capexPerStation; derive it from platformFixedCapex / numStations
  const platformForEngine = {
    ...platform,
    capexPerStation:
      platform.numStations > 0
        ? platform.platformFixedCapex / platform.numStations
        : platform.capexPerStation,
  };

  // ── Multi-year growth projections (charts / P&L tables) ─────────────────
  const modelOutput = runModel(
    settings,
    platformForEngine,
    batteryForEngine,
    fleetForEngine,
    controls.selectedScenario,
  );

  // ── Snapshot: physics-first single-point analysis ─────────────────────────
  // runScenario uses the new store field names directly — no mapping needed.
  let snapshot = null;
  try {
    snapshot = runScenario({ system, battery, platform, fleet, settings });
  } catch (err) {
    // Never crash the store if the new engine throws — degrade gracefully
    console.error('[runScenario] error:', err);
  }

  return { ...modelOutput, snapshot };
}

// ─── Initial results (computed once at module load with all defaults) ─────────
const INITIAL_STATE = {
  settings: DEFAULT_SETTINGS,
  system:   DEFAULT_SYSTEM,
  battery:  DEFAULT_BATTERY,
  platform: DEFAULT_PLATFORM,
  fleet:    DEFAULT_FLEET,
  controls: DEFAULT_CONTROLS,
};

const INITIAL_RESULTS = deriveResults(INITIAL_STATE);

// ─── Store ────────────────────────────────────────────────────────────────────
export const useSimulatorStore = create(
  persist(
    (set, get) => ({

      // ── State ─────────────────────────────────────────────────────────────

      settings:   { ...DEFAULT_SETTINGS  },
      system:     { ...DEFAULT_SYSTEM    },
      battery:    { ...DEFAULT_BATTERY   },
      platform:   { ...DEFAULT_PLATFORM  },
      fleet:      { ...DEFAULT_FLEET     },
      controls:   { ...DEFAULT_CONTROLS  },
      activePage: 'dashboard',
      results:    INITIAL_RESULTS,

      /** Whether the left assumptions panel is visible. */
      panelOpen:  false,

      // ── Panel visibility ──────────────────────────────────────────────────

      /** Toggle the assumptions side panel open / closed. */
      togglePanel:  () => set((s) => ({ panelOpen: !s.panelOpen })),
      /** Directly set panel open state. */
      setPanelOpen: (v) => set({ panelOpen: Boolean(v) }),

      // ── Navigation ────────────────────────────────────────────────────────

      /** Set the active page (navigation). */
      setActivePage: (page) => set({ activePage: page }),

      // ── Assumption setters (each accepts a partial patch object) ──────────

      /** Update global model settings. */
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        get()._recompute();
      },

      /** Update shared system parameters (trucks, kWh/swap, electricity cost…). */
      setSystem: (patch) => {
        set((s) => ({ system: { ...s.system, ...patch } }));
        get()._recompute();
      },

      /** Update Battery Company assumptions. */
      setBattery: (patch) => {
        set((s) => ({ battery: { ...s.battery, ...patch } }));
        get()._recompute();
      },

      /** Update Platform Company assumptions. */
      setPlatform: (patch) => {
        set((s) => ({ platform: { ...s.platform, ...patch } }));
        get()._recompute();
      },

      /** Update Fleet Company assumptions. */
      setFleet: (patch) => {
        set((s) => ({ fleet: { ...s.fleet, ...patch } }));
        get()._recompute();
      },

      /** Update control / UI settings (scenario, pricingMode, viewMode). */
      setControls: (patch) => {
        set((s) => ({ controls: { ...s.controls, ...patch } }));
        get()._recompute();
      },

      // ── Convenience aliases ───────────────────────────────────────────────

      /**
       * Convenience alias: switch scenario without touching other controls.
       * Equivalent to setControls({ selectedScenario: key }).
       */
      setScenario: (key) => {
        get().setControls({ selectedScenario: key });
      },

      // ── Scenario management ───────────────────────────────────────────────

      /**
       * Load a named scenario preset.
       * Resets all assumptions to defaults first, then deep-merges the preset
       * overrides. Components and engines always see a consistent state.
       *
       * @param {string} scenarioKey – key in SCENARIO_PRESETS ('base'|'bull'|'bear'|…)
       */
      loadScenario: (scenarioKey) => {
        const preset = SCENARIO_PRESETS[scenarioKey];
        if (!preset) {
          console.warn(`[useSimulatorStore] Unknown scenario: "${scenarioKey}"`);
          return;
        }

        set({
          settings: { ...DEFAULT_SETTINGS,  ...(preset.settings  ?? {}) },
          system:   { ...DEFAULT_SYSTEM,    ...(preset.system    ?? {}) },
          battery:  { ...DEFAULT_BATTERY,   ...(preset.battery   ?? {}) },
          platform: { ...DEFAULT_PLATFORM,  ...(preset.platform  ?? {}) },
          fleet:    { ...DEFAULT_FLEET,     ...(preset.fleet     ?? {}) },
          controls: { ...DEFAULT_CONTROLS,  ...(preset.controls  ?? {}), selectedScenario: scenarioKey },
        });

        get()._recompute();
      },

      // ── Reset ─────────────────────────────────────────────────────────────

      /**
       * Reset every assumption group back to factory defaults.
       * Equivalent to calling loadScenario('base') but explicit.
       */
      resetToDefaults: () => {
        set({
          settings: { ...DEFAULT_SETTINGS  },
          system:   { ...DEFAULT_SYSTEM    },
          battery:  { ...DEFAULT_BATTERY   },
          platform: { ...DEFAULT_PLATFORM  },
          fleet:    { ...DEFAULT_FLEET     },
          controls: { ...DEFAULT_CONTROLS  },
        });
        get()._recompute();
      },

      // ── Internal ──────────────────────────────────────────────────────────

      /**
       * Re-derive results from current assumptions.
       * Called automatically after every setter — never call from UI components.
       */
      _recompute: () => {
        set({ results: deriveResults(get()) });
      },
    }),

    // ── Persistence config ─────────────────────────────────────────────────
    {
      name: 'a2-simulator-v2',

      // Only persist user-editable assumptions; results are always re-derived.
      partialize: (s) => ({
        settings:   s.settings,
        system:     s.system,
        battery:    s.battery,
        platform:   s.platform,
        fleet:      s.fleet,
        controls:   s.controls,
        activePage: s.activePage,
      }),

      // After hydration from localStorage, recompute results immediately.
      onRehydrateStorage: () => (state) => {
        if (state) state._recompute();
      },
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────
/**
 * Pre-built selector functions for use with useSimulatorStore(selector).
 *
 * These enable fine-grained subscriptions so components only re-render
 * when the slice of state they care about actually changes.
 *
 * Usage:
 *   import { useSimulatorStore, selectSystem } from '../store/useSimulatorStore';
 *   const system = useSimulatorStore(selectSystem);
 */

export const selectSettings         = (s) => s.settings;
export const selectSystem           = (s) => s.system;
export const selectBattery          = (s) => s.battery;
export const selectPlatform         = (s) => s.platform;
export const selectFleet            = (s) => s.fleet;
export const selectControls         = (s) => s.controls;
export const selectResults          = (s) => s.results;
export const selectPanelOpen        = (s) => s.panelOpen;

/**
 * Returns the runScenario snapshot — the physics-first single-point analysis.
 * Contains: demand, infrastructure, capex, pricing, batteryCompany,
 * platformCompany, fleetCompany, viability, constraints.
 */
export const selectSnapshot         = (s) => s.results?.snapshot ?? null;
export const selectActivePage       = (s) => s.activePage;

/** Returns the active scenario key string ('base' | 'bull' | …). */
export const selectScenario         = (s) => s.controls.selectedScenario;

/** Returns the pricing mode string ('lease' | 'swap' | 'subscription'). */
export const selectPricingMode      = (s) => s.controls.pricingMode;

/** Returns the view mode string ('financial' | 'operational' | 'comparison'). */
export const selectViewMode         = (s) => s.controls.viewMode;

/**
 * Returns all five assumption groups as a single flat object.
 * Useful for debugging, exporting, or diff-ing against defaults.
 */
export const selectAllAssumptions   = (s) => ({
  settings: s.settings,
  system:   s.system,
  battery:  s.battery,
  platform: s.platform,
  fleet:    s.fleet,
  controls: s.controls,
});

/**
 * Returns just the computed output trees.
 * Same as selectResults but named for symmetry.
 */
export const selectOutputs          = (s) => s.results;
