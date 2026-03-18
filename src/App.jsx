/**
 * Root application component.
 * Reads activePage from the Zustand store and renders the correct page
 * inside the AppShell layout (Sidebar + Header + content area).
 */

import { useSimulatorStore }       from './store/useSimulatorStore';
import { AppShell }                from './components/layout/AppShell';
import { DashboardPage }           from './pages/DashboardPage';
import { FinancialsPage }          from './pages/FinancialsPage';
import { InsightsPage }           from './pages/InsightsPage';
import { PlatformPage }            from './pages/PlatformPage';
import { BatteryPage }             from './pages/BatteryPage';
import { FleetPage }               from './pages/FleetPage';
import { AssumptionsPage }         from './pages/AssumptionsPage';
import { ScenarioComparisonPage }  from './pages/ScenarioComparisonPage';
import { SaveLoadPage }            from './pages/SaveLoadPage';

const PAGE_MAP = {
  dashboard:   <DashboardPage />,
  financials:  <FinancialsPage />,
  insights:    <InsightsPage />,
  scenarios:   <ScenarioComparisonPage />,
  saveload:    <SaveLoadPage />,
  // Legacy entity pages remain accessible for deep-link purposes
  platform:    <PlatformPage />,
  battery:     <BatteryPage />,
  fleet:       <FleetPage />,
  assumptions: <AssumptionsPage />,
};

export default function App() {
  const activePage = useSimulatorStore((s) => s.activePage);

  return (
    <AppShell>
      {PAGE_MAP[activePage] ?? <DashboardPage />}
    </AppShell>
  );
}
