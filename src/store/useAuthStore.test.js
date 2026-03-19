import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from './useAuthStore.js';

describe('useAuthStore (standalone stub)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('has no token and no backend session by default', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAdmin).toBe(false);
  });

  it('hydrateSession resolves without network', async () => {
    await useAuthStore.getState().hydrateSession();
    expect(useAuthStore.getState().isCheckingSession).toBe(false);
  });

  it('requestOtp fails with standalone message', async () => {
    const result = await useAuthStore.getState().requestOtp({ email: 'a@b.com' });
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().authError).toMatch(/disabled/i);
  });
});
