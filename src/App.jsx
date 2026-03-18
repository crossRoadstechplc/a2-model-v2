/**
 * Root application component.
 * AppGate wraps the simulator; only authenticated users with NDA accepted
 * reach AppShell. Simulator logic unchanged.
 */

import { useSimulatorStore }       from './store/useSimulatorStore';
import { AppGate }                 from './components/auth/AppGate';
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
import { AdminPage }               from './pages/AdminPage';

const PAGE_MAP = {
  dashboard:   <DashboardPage />,
  financials:  <FinancialsPage />,
  insights:    <InsightsPage />,
  scenarios:   <ScenarioComparisonPage />,
  saveload:    <SaveLoadPage />,
  platform:    <PlatformPage />,
  battery:     <BatteryPage />,
  fleet:       <FleetPage />,
  assumptions: <AssumptionsPage />,
  admin:       <AdminPage />,
};

function SimulatorContent() {
  const activePage = useSimulatorStore((s) => s.activePage);
  return <>{PAGE_MAP[activePage] ?? <DashboardPage />}</>;
}

export default function App() {
  return (
    <AppGate>
      <AppShell>
        <SimulatorContent />
      </AppShell>
    </AppGate>
  );
}
