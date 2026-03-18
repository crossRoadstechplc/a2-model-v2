import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

const mockHeartbeat = vi.fn();

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) =>
    selector({
      token: 'mock-token',
      heartbeat: mockHeartbeat,
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
  beforeEach(() => {
    mockHeartbeat.mockClear();
  });

  it('starts heartbeat loop when mounted (authenticated)', () => {
    render(
      <AppShell>
        <div data-testid="child">Child</div>
      </AppShell>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockHeartbeat).toHaveBeenCalledTimes(1);
  });
});
