import { describe, it, expect } from 'vitest';
import { BASE_URL, getAuthHeader } from './config.js';

describe('api/config', () => {
  it('exports BASE_URL', () => {
    expect(BASE_URL).toBeDefined();
    expect(typeof BASE_URL).toBe('string');
  });

  it('getAuthHeader returns empty object when token is null', () => {
    expect(getAuthHeader(null)).toEqual({});
  });

  it('getAuthHeader returns Bearer header when token provided', () => {
    expect(getAuthHeader('abc123')).toEqual({ Authorization: 'Bearer abc123' });
  });
});
