import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { useHeartbeat } from './useHeartbeat';

const mockHeartbeat = vi.fn();
const mockToken = vi.fn();

vi.mock('../store/useAuthStore', () => ({
  default: (selector) => selector({ token: mockToken(), heartbeat: mockHeartbeat }),
}));

function TestApp({ token }) {
  mockToken.mockReturnValue(token);
  useHeartbeat(60_000);
  return <div data-testid="heartbeat-mount">mounted</div>;
}

describe('useHeartbeat', () => {
  let container;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    mockHeartbeat.mockClear();
    mockToken.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    if (container.parentNode) document.body.removeChild(container);
  });

  it('starts heartbeat loop for authenticated users', async () => {
    mockToken.mockReturnValue('token-123');

    await act(async () => {
      const root = createRoot(container);
      root.render(<TestApp token="token-123" />);
      window.__heartbeatRoot = root;
    });

    expect(mockHeartbeat).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(mockHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('does not start heartbeat for unauthenticated users', async () => {
    mockToken.mockReturnValue(null);

    await act(async () => {
      const root = createRoot(container);
      root.render(<TestApp token={null} />);
    });

    expect(mockHeartbeat).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    expect(mockHeartbeat).not.toHaveBeenCalled();
  });

  it('stops heartbeat on unmount', async () => {
    mockToken.mockReturnValue('token-123');

    let root;
    await act(async () => {
      root = createRoot(container);
      root.render(<TestApp token="token-123" />);
    });

    expect(mockHeartbeat).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });

    mockHeartbeat.mockClear();

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    expect(mockHeartbeat).not.toHaveBeenCalled();
  });

  it('pauses when document is hidden and resumes when visible', async () => {
    mockToken.mockReturnValue('token-123');
    const origHidden = Object.getOwnPropertyDescriptor(document, 'hidden');

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    let root;
    await act(async () => {
      root = createRoot(container);
      root.render(<TestApp token="token-123" />);
    });

    expect(mockHeartbeat).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    mockHeartbeat.mockClear();
    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });
    expect(mockHeartbeat).not.toHaveBeenCalled();

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(mockHeartbeat).toHaveBeenCalled();

    if (origHidden) Object.defineProperty(document, 'hidden', origHidden);
    root.unmount();
  });
});
