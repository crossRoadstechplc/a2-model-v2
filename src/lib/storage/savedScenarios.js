/**
 * savedScenarios.js – Named scenario slot persistence via localStorage.
 *
 * Keeps user-saved scenarios in a SEPARATE key from the Zustand workspace
 * ('a2-simulator-v2') so they are never accidentally clobbered by a reset.
 *
 * Schema (stored as JSON array, newest first):
 * ─────────────────────────────────────────────
 *   [{
 *     id:          string,      // unique: "s_{timestamp}_{random}"
 *     name:        string,      // user-provided label
 *     savedAt:     ISO string,  // creation timestamp
 *     assumptions: {            // full five-group snapshot of the workspace
 *       settings, system, battery, platform, fleet, controls
 *     },
 *     keyMetrics:  {            // pre-computed for list display (no engine re-run)
 *       trucks, batteryIRR, platformIRR, fleetIRR,
 *       totalCostPerKwh, electricCostPerKm, dieselCostPerKm,
 *       viable, viabilityLabel
 *     }
 *   }]
 *
 * Maximum slot count is capped at MAX_SLOTS to prevent unbounded growth.
 * Older slots are removed when the limit is reached (newest-first order keeps
 * the most recent scenarios and discards the oldest).
 */

const STORAGE_KEY = 'a2-saved-scenarios-v1';
const MAX_SLOTS   = 20;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(scenarios) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    return true;
  } catch (err) {
    console.error('[savedScenarios] write failed:', err);
    return false;
  }
}

function generateId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return all saved scenarios, newest first.
 * Always returns an array (empty if nothing saved or parse error).
 * @returns {SavedScenario[]}
 */
export function getSavedScenarios() {
  return readAll();
}

/**
 * Save a new named scenario slot.
 *
 * @param {string}  name         – user-provided label (auto-numbered if empty)
 * @param {object}  assumptions  – { settings, system, battery, platform, fleet, controls }
 * @param {object}  [keyMetrics] – pre-computed display metrics from snapshot
 * @returns {SavedScenario}  the newly created slot
 */
export function saveScenario(name, assumptions, keyMetrics = {}) {
  const all  = readAll();
  const slot = {
    id:          generateId(),
    name:        (name ?? '').trim() || `Scenario ${all.length + 1}`,
    savedAt:     new Date().toISOString(),
    assumptions: { ...assumptions },
    keyMetrics:  { ...keyMetrics },
  };

  // Newest first; trim to MAX_SLOTS
  const updated = [slot, ...all].slice(0, MAX_SLOTS);
  writeAll(updated);
  return slot;
}

/**
 * Retrieve a single saved scenario by id.
 * @param {string} id
 * @returns {SavedScenario|null}
 */
export function getScenario(id) {
  return readAll().find((s) => s.id === id) ?? null;
}

/**
 * Delete a saved scenario by id.
 * @param {string} id
 * @returns {boolean}  true if the slot was found and removed
 */
export function deleteScenario(id) {
  const all     = readAll();
  const updated = all.filter((s) => s.id !== id);
  if (updated.length === all.length) return false;
  writeAll(updated);
  return true;
}

/**
 * Rename a saved scenario.
 * @param {string} id
 * @param {string} newName
 * @returns {boolean}
 */
export function renameScenario(id, newName) {
  const trimmed = (newName ?? '').trim();
  if (!trimmed) return false;
  const updated = readAll().map((s) =>
    s.id === id ? { ...s, name: trimmed } : s,
  );
  writeAll(updated);
  return true;
}

/**
 * Permanently erase every saved scenario slot.
 */
export function clearAllScenarios() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Estimate how many bytes the saved-scenarios key is using.
 * Useful for showing a "storage used" indicator in the UI.
 * @returns {number}  approximate bytes
 */
export function storageUsedBytes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    return new Blob([raw]).size;
  } catch {
    return 0;
  }
}
