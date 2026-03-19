import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

vi.mock('../../store/useWalkthroughStore', () => ({
  default: (selector) =>
    selector({
      walkthroughSeen: true,
      showWalkthroughReplay: false,
    }),
}));

vi.mock('../../store/useSimulatorStore', () => ({
  useSimulatorStore: (fn) =>
    fn({
      activePage: 'dashboard',
      panelOpen: false,
      controls: { selectedScenario: 'base' },
      settings: { corridorName: 'Corridor A2', projectionYears: 10 },
      setActivePage: () => {},
      setScenario: () => {},
    }),
  selectPanelOpen: (s) => s.panelOpen,
  selectControls: (s) => s.controls,
  selectSettings: (s) => s.settings,
}));

vi.mock('./Sidebar', () => ({ Sidebar: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('./AssumptionsSidebar', () => ({
  AssumptionsSidebar: () => <div data-testid="assumptions-sidebar">Assumptions</div>,
}));
vi.mock('./Header', () => ({ Header: () => <div data-testid="header">Header</div> }));

describe('AppShell', () => {
  it('renders layout and children', () => {
    render(
      <AppShell>
        <div data-testid="child">Child</div>
      </AppShell>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
