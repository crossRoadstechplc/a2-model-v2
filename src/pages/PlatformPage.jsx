import { Zap } from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { EntityPage } from './EntityPage';

const REVENUE_KEYS = [
  { key: 'platformFeeRevenue', label: 'Fleet Access Fees' },
  { key: 'batteryInfraRevenue', label: 'Battery Infrastructure Fee' },
];

const COST_KEYS = [
  { key: 'stationOpex',             label: 'Station Opex (power & maintenance)' },
  { key: 'staffCost',               label: 'Staff & Operations' },
  { key: 'softwareCost',            label: 'Software & Monitoring' },
  { key: 'annualCapexAmortization', label: 'Capex Amortization' },
];

export function PlatformPage() {
  const { results } = useSimulatorStore();
  return (
    <EntityPage
      entityKey="platform"
      rows={results.platform}
      revenueKeys={REVENUE_KEYS}
      costKeys={COST_KEYS}
      accentColor="blue"
      icon={Zap}
    />
  );
}
