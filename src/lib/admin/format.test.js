import { describe, it, expect } from 'vitest';
import { formatDuration, formatTimestamp } from './format';

describe('formatDuration', () => {
  it('returns — for null or undefined', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('formats hours, minutes, seconds', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });

  it('formats days, hours, minutes, seconds', () => {
    expect(formatDuration(90061)).toBe('1d 1h 1m 1s');
  });

  it('formats 2d 5h style for long durations', () => {
    expect(formatDuration(183600)).toBe('2d 3h 0m 0s');
  });
});

describe('formatTimestamp', () => {
  it('returns — for empty string', () => {
    expect(formatTimestamp('')).toBe('—');
  });

  it('formats valid ISO string', () => {
    const result = formatTimestamp('2025-03-18T12:00:00.000Z');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/18/);
    expect(result).toMatch(/2025/);
  });
});
