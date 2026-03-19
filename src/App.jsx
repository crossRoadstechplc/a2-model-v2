/**
 * Root application component.
 * Standalone simulator — no API auth gate; AppShell loads directly.
 */

import { useSimulatorStore }       from './store/useSimulatorStore';
import { AppShell }                from './components/layout/AppShell';
import { DashboardPage }           from './pages/DashboardPage';
import { FinancialsPage }          from './pages/FinancialsPage';
import { InsightsPage }           from './pages/InsightsPage';
import { PlatformPage }            from './pages/PlatformPage';
import { BatteryPage }             from './pages/BatteryPage';
import { FleetPage }               from './pages/FleetPage';
import { ScenarioComparisonPage }  from './pages/ScenarioComparisonPage';
import { SaveLoadPage }            from './pages/SaveLoadPage';

const PAGE_MAP = {
  dashboard:   <DashboardPage />,
  financials:  <FinancialsPage />,
  insights:    <InsightsPage />,
  scenarios:   <ScenarioComparisonPage />,
  saveload:    <SaveLoadPage />,
  platform:    <PlatformPage />,
  battery:     <BatteryPage />,
  fleet:       <FleetPage />,
};

function SimulatorContent() {
  const activePage = useSimulatorStore((s) => s.activePage);
  return <>{PAGE_MAP[activePage] ?? <DashboardPage />}</>;
}

export default function App() {
  return (
    <AppShell>
      <SimulatorContent />
    </AppShell>
  );
}
