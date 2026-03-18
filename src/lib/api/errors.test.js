import { describe, it, expect } from 'vitest';
import { normalizeApiError } from './errors.js';

describe('normalizeApiError', () => {
  it('prefers error over message when both exist', () => {
    const res = { status: 400 };
    const body = { success: false, error: 'Invalid email', message: 'Fallback' };
    const result = normalizeApiError(res, body);
    expect(result).toEqual({
      success: false,
      message: 'Invalid email',
      status: 400,
    });
  });

  it('uses message when error is absent', () => {
    const res = { status: 429 };
    const body = { success: false, message: 'Too many requests.' };
    const result = normalizeApiError(res, body);
    expect(result).toEqual({
      success: false,
      message: 'Too many requests.',
      status: 429,
    });
  });

  it('falls back to statusText when body has no error/message', () => {
    const res = { status: 500, statusText: 'Internal Server Error' };
    const result = normalizeApiError(res, {});
    expect(result).toEqual({
      success: false,
      message: 'Internal Server Error',
      status: 500,
    });
  });

  it('falls back to generic message when statusText empty', () => {
    const res = { status: 502, statusText: '' };
    const result = normalizeApiError(res, {});
    expect(result.message).toContain('502');
  });
});
