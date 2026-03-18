/**
 * SaveLoadPage – Scenario management, persistence, and export.
 *
 * ── Sections ──────────────────────────────────────────────────────────────────
 *
 *   1. Current Workspace
 *      Live KPI summary of the active assumptions.
 *      • Save As form  – name + Save button → writes a named slot to localStorage
 *      • Export JSON   – full assumptions + snapshot as .json
 *      • Export CSV    – structured summary spreadsheet (.csv)
 *
 *   2. Saved Scenarios
 *      Card list (newest first) showing name, date, and key metrics.
 *      Per-card actions:
 *        Load  – replaces current workspace assumptions with the saved set
 *        Export JSON  – downloads that slot's assumptions only
 *        Delete (with inline confirm)
 *      Footer: "Clear all" + storage-used indicator.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *
 * Saved scenarios live in localStorage under 'a2-saved-scenarios-v1'
 * (separate from the Zustand workspace key 'a2-simulator-v2').
 *
 * The list is kept in local React state and refreshed after every mutation.
 * No new Zustand actions were needed — all persistence is handled by
 * src/lib/storage/savedScenarios.js.
 */

import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import {
  Save, FolderOpen, Trash2, FileJson2,
  FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle,
  Package,
} from 'lucide-react';

import {
  useSimulatorStore,
  selectSnapshot,
  selectSettings,
  selectSystem,
  selectBattery,
  selectPlatform,
  selectFleet,
  selectControls,
} from '../store/useSimulatorStore';

import {
  getSavedScenarios,
  saveScenario,
  deleteScenario,
  clearAllScenarios,
  storageUsedBytes,
} from '../lib/storage';

import { exportToJson } from '../lib/export/exportJson';
import { exportToCsv  } from '../lib/export/exportCsv';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function fmtIRR(v) {
  if (v == null || !isFinite(v) || isNaN(v)) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function fmtKwh(v) {
  if (v == null || !isFinite(v)) return '—';
  return `$${v.toFixed(3)}`;
}

function fmtKm(v) {
  if (v == null || !isFinite(v)) return '—';
  return `$${v.toFixed(3)}`;
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

/** Extract display metrics from a snapshot (called at save-time). */
function extractKeyMetrics(snapshot, system) {
  return {
    trucks:           system?.trucks ?? 0,
    batteryIRR:       snapshot?.batteryCompany?.irr  ?? null,
    platformIRR:      snapshot?.platformCompany?.irr ?? null,
    fleetIRR:         snapshot?.fleetCompany?.irr    ?? null,
    totalCostPerKwh:  snapshot?.pricing?.totalCostPerKwh  ?? null,
    electricCostPerKm: snapshot?.viability?.electricCostPerKm ?? null,
    dieselCostPerKm:  snapshot?.viability?.dieselCostPerKm  ?? null,
    viable:           snapshot?.viability?.viable   ?? false,
    viabilityLabel:   snapshot?.viability?.label    ?? '—',
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small metric pill in KPI strips */
function MetricPill({ label, value, valueClass }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={clsx('text-sm font-bold tabular-nums mt-0.5', valueClass ?? 'text-slate-800')}>
        {value ?? '—'}
      </p>
    </div>
  );
}

/** Toast-style flash message */
function Flash({ type, message }) {
  if (!message) return null;
  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold',
      type === 'success' && 'bg-emerald-50 border border-emerald-200 text-emerald-700',
      type === 'error'   && 'bg-red-50 border border-red-200 text-red-700',
    )}>
      {type === 'success'
        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        : <AlertCircle  className="w-3.5 h-3.5 shrink-0" />}
      {message}
    </div>
  );
}

/** Viability badge */
function ViabilityBadge({ label }) {
  const cls = {
    'Viable':     'bg-emerald-100 text-emerald-700',
    'Marginal':   'bg-amber-100 text-amber-700',
    'Not Viable': 'bg-red-100 text-red-700',
  }[label] ?? 'bg-slate-100 text-slate-500';

  return (
    <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', cls)}>
      {label ?? '—'}
    </span>
  );
}

// ─── Saved scenario card ──────────────────────────────────────────────────────

function ScenarioCard({ slot, onLoad, onDelete, onExportJson }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const m = slot.keyMetrics ?? {};

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 leading-tight">{slot.name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(slot.savedAt)}</p>
        </div>
        <ViabilityBadge label={m.viabilityLabel} />
      </div>

      {/* Key metrics grid */}
      <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricPill label="Trucks"       value={m.trucks} />
        <MetricPill label="Battery IRR"  value={fmtIRR(m.batteryIRR)}
          valueClass={m.batteryIRR > 0 ? 'text-emerald-700' : 'text-slate-600'} />
        <MetricPill label="Platform IRR" value={fmtIRR(m.platformIRR)}
          valueClass={m.platformIRR > 0 ? 'text-blue-700' : 'text-slate-600'} />
        <MetricPill label="Fleet IRR"    value={fmtIRR(m.fleetIRR)}
          valueClass={m.fleetIRR > 0 ? 'text-amber-700' : 'text-slate-600'} />
        <MetricPill label="Total $/kWh"  value={fmtKwh(m.totalCostPerKwh)} />
        <MetricPill label="Electric/km"  value={fmtKm(m.electricCostPerKm)} />
        <MetricPill label="Diesel/km"    value={fmtKm(m.dieselCostPerKm)} />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-1 border-t border-slate-100">
        {/* Load */}
        <button
          onClick={onLoad}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Load
        </button>

        {/* Export JSON */}
        <button
          onClick={onExportJson}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
        >
          <FileJson2 className="w-3.5 h-3.5" />
          JSON
        </button>

        {/* Delete */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-red-500 text-xs rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] text-red-600 font-semibold">Delete?</span>
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="px-2.5 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg hover:bg-red-600"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg hover:bg-slate-200"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Clear all confirm ────────────────────────────────────────────────────────

function ClearAllSection({ onClearAll }) {
  const [confirm, setConfirm] = useState(false);

  return confirm ? (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-600 font-semibold">Delete all saved scenarios?</span>
      <button
        onClick={() => { onClearAll(); setConfirm(false); }}
        className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600"
      >
        Yes, delete all
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
      >
        Cancel
      </button>
    </div>
  ) : (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
    >
      Clear all saved scenarios
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SaveLoadPage() {
  const snapshot       = useSimulatorStore(selectSnapshot);
  const settings       = useSimulatorStore(selectSettings);
  const system         = useSimulatorStore(selectSystem);
  const battery        = useSimulatorStore(selectBattery);
  const platform       = useSimulatorStore(selectPlatform);
  const fleet          = useSimulatorStore(selectFleet);
  const controls       = useSimulatorStore(selectControls);
  const setSystem      = useSimulatorStore((s) => s.setSystem);
  const setBattery     = useSimulatorStore((s) => s.setBattery);
  const setPlatform    = useSimulatorStore((s) => s.setPlatform);
  const setFleet       = useSimulatorStore((s) => s.setFleet);
  const updateSettings = useSimulatorStore((s) => s.updateSettings);
  const setControls    = useSimulatorStore((s) => s.setControls);

  // Compose assumptions from stable individual slices.
  // useMemo ensures the object reference only changes when a slice actually changes,
  // preventing the "getSnapshot should be cached" infinite-loop warning.
  const assumptions = useMemo(
    () => ({ settings, system, battery, platform, fleet, controls }),
    [settings, system, battery, platform, fleet, controls],
  );

  // Local state
  const [saveName,    setSaveName]   = useState('');
  const [scenarios,   setScenarios]  = useState(() => getSavedScenarios());
  const [flash,       setFlash]      = useState(null);   // { type, message }
  const [loadConfirm, setLoadConfirm] = useState(null);  // slot id being confirmed

  // Refresh list from localStorage
  const refresh = useCallback(() => setScenarios(getSavedScenarios()), []);

  // Flash helper
  const showFlash = useCallback((type, message) => {
    setFlash({ type, message });
    setTimeout(() => setFlash(null), 3_000);
  }, []);

  // ── Save current workspace ────────────────────────────────────────────────
  const handleSave = () => {
    const name = saveName.trim() || settings.corridorName || 'My Scenario';
    const metrics = extractKeyMetrics(snapshot, assumptions.system);
    saveScenario(name, assumptions, metrics);
    setSaveName('');
    refresh();
    showFlash('success', `"${name}" saved`);
  };

  // ── Load a saved slot ─────────────────────────────────────────────────────
  const handleLoad = (slot) => {
    const a = slot.assumptions;
    // Apply each group back to the store
    if (a.settings)  updateSettings(a.settings);
    if (a.system)    setSystem(a.system);
    if (a.battery)   setBattery(a.battery);
    if (a.platform)  setPlatform(a.platform);
    if (a.fleet)     setFleet(a.fleet);
    if (a.controls)  setControls(a.controls);
    setLoadConfirm(null);
    showFlash('success', `"${slot.name}" loaded into workspace`);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    deleteScenario(id);
    refresh();
    showFlash('success', 'Scenario deleted');
  };

  // ── Export current workspace ──────────────────────────────────────────────
  const handleExportJson = () => {
    exportToJson(assumptions, snapshot, saveName || settings.corridorName);
  };

  const handleExportCsv = () => {
    exportToCsv(assumptions, snapshot, saveName || settings.corridorName);
  };

  // ── Export a saved slot ───────────────────────────────────────────────────
  const handleExportSlotJson = (slot) => {
    exportToJson(slot.assumptions, null, slot.name);
  };

  // ── Clear all ─────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    clearAllScenarios();
    refresh();
    showFlash('success', 'All saved scenarios cleared');
  };

  // ── Current workspace metrics ─────────────────────────────────────────────
  const wsMetrics = extractKeyMetrics(snapshot, assumptions.system);

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Flash message ─────────────────────────────────────────────────── */}
      {flash && (
        <Flash type={flash.type} message={flash.message} />
      )}

      {/* ── Section 1: Current workspace ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

        {/* Card header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Current Workspace</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active assumptions · auto-saved to browser via Zustand persist
            </p>
          </div>
          <ViabilityBadge label={wsMetrics.viabilityLabel} />
        </div>

        {/* Live metrics */}
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <MetricPill label="Trucks"       value={wsMetrics.trucks} />
          <MetricPill label="Battery IRR"  value={fmtIRR(wsMetrics.batteryIRR)}
            valueClass="text-emerald-700" />
          <MetricPill label="Platform IRR" value={fmtIRR(wsMetrics.platformIRR)}
            valueClass="text-blue-700" />
          <MetricPill label="Fleet IRR"    value={fmtIRR(wsMetrics.fleetIRR)}
            valueClass="text-amber-700" />
          <MetricPill label="Total $/kWh"  value={fmtKwh(wsMetrics.totalCostPerKwh)} />
          <MetricPill label="Electric/km"  value={fmtKm(wsMetrics.electricCostPerKm)} />
          <MetricPill label="Diesel/km"    value={fmtKm(wsMetrics.dieselCostPerKm)} />
        </div>

        {/* Save As + Export controls */}
        <div className="px-5 pb-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">

          {/* Name input + Save button */}
          <div className="flex-1 min-w-[220px] max-w-[320px]">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Save as named scenario
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={settings.corridorName || 'Scenario name…'}
                maxLength={60}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white placeholder-slate-400"
              />
              <button
                onClick={handleSave}
                title="Save current workspace as a named slot"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-slate-200 self-center" />

          {/* Export section */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Export current workspace
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FileJson2 className="w-3.5 h-3.5 text-blue-500" />
                JSON
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Saved scenario list ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Saved Scenarios
              {scenarios.length > 0 && (
                <span className="ml-2 text-[11px] font-normal text-slate-400">
                  {scenarios.length} slot{scenarios.length !== 1 ? 's' : ''} ·&nbsp;
                  {fmtBytes(storageUsedBytes())} used
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Persisted in browser localStorage · max 20 slots
            </p>
          </div>
          <button
            onClick={refresh}
            title="Refresh list"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Empty state */}
        {scenarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
            <Package className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No saved scenarios yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Use the "Save As" form above to save your current workspace
            </p>
          </div>
        )}

        {/* Scenario cards */}
        {scenarios.length > 0 && (
          <div className="space-y-3">
            {scenarios.map((slot) => (
              <ScenarioCard
                key={slot.id}
                slot={slot}
                onLoad={() => handleLoad(slot)}
                onDelete={() => handleDelete(slot.id)}
                onExportJson={() => handleExportSlotJson(slot)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {scenarios.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Scenarios are stored only in this browser. Clearing browser data will remove them.
            </p>
            <ClearAllSection onClearAll={handleClearAll} />
          </div>
        )}
      </div>

    </div>
  );
}
