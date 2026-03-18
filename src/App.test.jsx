import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

vi.mock('./store/useAuthStore', () => ({
  default: (selector) =>
    selector({
      token: 'mock-token',
      ndaAccepted: true,
      walkthroughSeen: true,
      isCheckingSession: false,
      hydrateSession: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      authError: null,
      requestOtpLoading: false,
      verifyOtpLoading: false,
      acceptNda: vi.fn(),
      acceptNdaLoading: false,
      completeWalkthrough: vi.fn(),
      completeWalkthroughLoading: false,
    }),
}));


vi.mock('./components/layout/AppShell', () => ({
  AppShell: ({ children }) => (
    <div data-testid="app-shell">
      <main>{children}</main>
    </div>
  ),
}));

vi.mock('./pages/DashboardPage', () => ({ DashboardPage: () => <div>Page</div> }));
vi.mock('./pages/FinancialsPage', () => ({ FinancialsPage: () => <div>Page</div> }));
vi.mock('./pages/InsightsPage', () => ({ InsightsPage: () => <div>Page</div> }));
vi.mock('./pages/PlatformPage', () => ({ PlatformPage: () => <div>Page</div> }));
vi.mock('./pages/BatteryPage', () => ({ BatteryPage: () => <div>Page</div> }));
vi.mock('./pages/FleetPage', () => ({ FleetPage: () => <div>Page</div> }));
vi.mock('./pages/AssumptionsPage', () => ({ AssumptionsPage: () => <div>Page</div> }));
vi.mock('./pages/ScenarioComparisonPage', () => ({
  ScenarioComparisonPage: () => <div>Page</div>,
}));
vi.mock('./pages/SaveLoadPage', () => ({ SaveLoadPage: () => <div>Page</div> }));
vi.mock('./pages/AdminPage', () => ({ AdminPage: () => <div data-testid="admin-page">Admin</div> }));

const mockUseSimulatorStore = vi.fn((fn) =>
  fn({ activePage: 'dashboard', panelOpen: false, controls: { selectedScenario: 'base' } }),
);

vi.mock('./store/useSimulatorStore', () => ({
  useSimulatorStore: (fn) => mockUseSimulatorStore(fn),
}));

describe('App', () => {
  it('exports a component', () => {
    expect(App).toBeTypeOf('function');
  });

  it('renders AppGate with simulator content when authenticated', () => {
    render(<App />);
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('renders admin page when activePage is admin', () => {
    mockUseSimulatorStore.mockImplementation((fn) =>
      fn({ activePage: 'admin', panelOpen: false, controls: { selectedScenario: 'base' } }),
    );
    render(<App />);
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
  });
});
