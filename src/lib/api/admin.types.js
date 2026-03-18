/**
 * @typedef {Object} AccessLogEntry
 * @property {number} userId
 * @property {string} name
 * @property {string} email
 * @property {string} sessionId
 * @property {string} loginAt - ISO timestamp
 * @property {string|null} logoutAt - ISO timestamp or null
 * @property {string} lastActivityAt - ISO timestamp
 * @property {number|null} sessionSeconds - null if active
 * @property {'active'|'logged_out'|'expired'} status
 * @property {string|null} [ipAddress]
 * @property {string|null} [userAgent]
 */

export {};
