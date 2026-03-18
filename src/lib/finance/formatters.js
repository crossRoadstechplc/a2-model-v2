/**
 * formatters.js – backward-compatibility shim
 *
 * All formatting logic now lives in format.js.
 * This file re-exports everything so existing imports keep working.
 */
export {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatMillions,
  formatCAGR,
  formatInt,
  formatMultiple,
  formatDelta,
  formatPayback,
} from './format';

// Legacy alias used by chart components
export { formatMillions as formatDollars } from './format';
