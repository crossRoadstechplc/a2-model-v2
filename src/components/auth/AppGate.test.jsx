import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppGate } from './AppGate';

const mockHydrate = vi.fn();
const mockRequestOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockAcceptNda = vi.fn();
const mockCompleteWalkthrough = vi.fn();

let mockState = {
  token: null,
  ndaAccepted: false,
  walkthroughSeen: false,
  isCheckingSession: false,
  hydrateSession: mockHydrate,
  requestOtp: mockRequestOtp,
  verifyOtp: mockVerifyOtp,
  authError: null,
  requestOtpLoading: false,
  verifyOtpLoading: false,
  acceptNda: mockAcceptNda,
  acceptNdaLoading: false,
  completeWalkthrough: mockCompleteWalkthrough,
  completeWalkthroughLoading: false,
};

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) => selector(mockState),
}));

describe('AppGate', () => {
  beforeEach(() => {
    mockHydrate.mockClear();
    mockState = {
      ...mockState,
      token: null,
      ndaAccepted: false,
      walkthroughSeen: false,
      isCheckingSession: false,
      hydrateSession: mockHydrate,
      requestOtp: mockRequestOtp,
      verifyOtp: mockVerifyOtp,
      authError: null,
      requestOtpLoading: false,
      verifyOtpLoading: false,
      acceptNda: mockAcceptNda,
      acceptNdaLoading: false,
      completeWalkthrough: mockCompleteWalkthrough,
      completeWalkthroughLoading: false,
    };
  });

  it('calls hydrateSession on mount', () => {
    render(
      <AppGate>
        <div data-testid="child">Child</div>
      </AppGate>
    );
    expect(mockHydrate).toHaveBeenCalled();
  });

  it('shows loading state during session hydration', () => {
    mockState.isCheckingSession = true;

    render(
      <AppGate>
        <div data-testid="child">Child</div>
      </AppGate>
    );

    expect(screen.getByTestId('gate-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('unauthenticated user sees login flow', () => {
    mockState.token = null;
    mockState.isCheckingSession = false;

    render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('first-name')).toBeInTheDocument();
    expect(screen.getByTestId('last-name')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('request-otp-submit')).toBeInTheDocument();
    expect(screen.queryByTestId('simulator')).not.toBeInTheDocument();
  });

  it('authenticated user without NDA sees NDA screen', () => {
    mockState.token = 'x';
    mockState.ndaAccepted = false;
    mockState.isCheckingSession = false;

    render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('nda-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('accept-nda-submit')).toBeInTheDocument();
    expect(screen.queryByTestId('simulator')).not.toBeInTheDocument();
  });

  it('authenticated user with NDA sees simulator', () => {
    mockState.token = 'x';
    mockState.ndaAccepted = true;
    mockState.walkthroughSeen = true;
    mockState.isCheckingSession = false;

    render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('simulator')).toBeInTheDocument();
    expect(screen.getByText('Simulator')).toBeInTheDocument();
    expect(screen.queryByTestId('walkthrough-modal')).not.toBeInTheDocument();
  });

  it('accepted users do not see NDA again in the gated flow', () => {
    mockState.token = 'x';
    mockState.ndaAccepted = true;
    mockState.walkthroughSeen = true;
    mockState.isCheckingSession = false;

    render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.queryByTestId('nda-checkbox')).not.toBeInTheDocument();
    expect(screen.queryByTestId('accept-nda-submit')).not.toBeInTheDocument();
    expect(screen.getByTestId('simulator')).toBeInTheDocument();
  });

  it('shows walkthrough modal when applicable', () => {
    mockState.token = 'x';
    mockState.ndaAccepted = true;
    mockState.walkthroughSeen = false;
    mockState.isCheckingSession = false;

    render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('simulator')).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-modal')).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-complete')).toBeInTheDocument();
  });

  it('shows auth shell when unauthenticated', () => {
    mockState.token = null;
    mockState.isCheckingSession = false;

    render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('auth-shell')).toBeInTheDocument();
    expect(screen.getByTestId('first-name')).toBeInTheDocument();
    expect(screen.queryByTestId('simulator')).not.toBeInTheDocument();
  });

  it('shows auth shell when NDA not accepted', () => {
    mockState.token = 'x';
    mockState.ndaAccepted = false;
    mockState.isCheckingSession = false;

    render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('auth-shell')).toBeInTheDocument();
    expect(screen.getByTestId('nda-checkbox')).toBeInTheDocument();
    expect(screen.queryByTestId('simulator')).not.toBeInTheDocument();
  });

  it('logout returns user to login flow', () => {
    mockState.token = 'x';
    mockState.ndaAccepted = true;
    mockState.walkthroughSeen = true;
    mockState.isCheckingSession = false;

    const { rerender } = render(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('simulator')).toBeInTheDocument();

    // Simulate logout: token cleared
    mockState.token = null;
    mockState.ndaAccepted = false;
    mockState.walkthroughSeen = false;
    rerender(
      <AppGate>
        <div data-testid="simulator">Simulator</div>
      </AppGate>
    );

    expect(screen.getByTestId('auth-shell')).toBeInTheDocument();
    expect(screen.getByTestId('first-name')).toBeInTheDocument();
    expect(screen.queryByTestId('simulator')).not.toBeInTheDocument();
  });
});
