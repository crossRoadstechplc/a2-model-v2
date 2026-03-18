/**
 * Format helpers for admin access logs.
 */

/**
 * @param {string} iso - ISO timestamp
 * @returns {string}
 */
export function formatTimestamp(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Human-readable duration. Examples: 45s, 12m 30s, 2h 15m, 2d 5h
 * @param {number|null} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds == null) return '—';
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * @param {number} seconds
 * @returns {string} e.g. "12.5" or "1,234"
 */
export function formatUsageHours(seconds) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '0';
  const hours = seconds / 3600;
  return hours >= 1000
    ? Math.round(hours).toLocaleString()
    : hours >= 1
      ? hours.toFixed(1)
      : hours.toFixed(2);
}
