/**
 * exportJson.js – Download current model state as a structured JSON file.
 *
 * The exported file contains:
 *   meta        – export metadata (app, corridor, timestamp)
 *   assumptions – five assumption groups (settings, system, battery, platform, fleet)
 *   snapshot    – single-point physics-first results (demand → viability)
 *
 * The snapshot's cashFlows arrays are included so the file is self-contained
 * and can be loaded by external analysis tools.
 *
 * Usage:
 *   exportToJson(assumptions, snapshot, 'My Scenario Name');
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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay to let the download start
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Trigger a JSON download of the current model state.
 *
 * @param {object}  assumptions – { settings, system, battery, platform, fleet, controls }
 * @param {object}  [snapshot]  – runScenario output (may be null)
 * @param {string}  [label]     – human-readable name for the export (used in filename)
 */
export function exportToJson(assumptions, snapshot, label) {
  const name  = (label ?? assumptions?.settings?.corridorName ?? 'a2-model').trim();
  const stamp = new Date().toISOString();

  const payload = {
    meta: {
      app:            'A2 Investor Simulator',
      version:        '2.0',
      exportedAt:     stamp,
      label:          name,
      corridorName:   assumptions?.settings?.corridorName ?? '',
      projectionYears: assumptions?.settings?.projectionYears ?? null,
    },
    assumptions: {
      settings: assumptions?.settings ?? {},
      system:   assumptions?.system   ?? {},
      battery:  assumptions?.battery  ?? {},
      platform: assumptions?.platform ?? {},
      fleet:    assumptions?.fleet    ?? {},
      controls: assumptions?.controls ?? {},
    },
    snapshot: snapshot ?? null,
  };

  const json = JSON.stringify(payload, (key, value) => {
    // Convert non-finite numbers to null so JSON stays valid
    if (typeof value === 'number' && !isFinite(value)) return null;
    return value;
  }, 2);

  const blob     = new Blob([json], { type: 'application/json' });
  const filename = `a2-${slugify(name)}-${dateTag()}.json`;

  downloadBlob(blob, filename);
}
