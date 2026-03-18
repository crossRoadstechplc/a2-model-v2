import { BatteryCharging } from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { EntityPage } from './EntityPage';

const REVENUE_KEYS = [
  { key: 'leaseRevenue', label: 'Battery Lease Fees (from Fleet)' },
];

const COST_KEYS = [
  { key: 'annualPackCapex',  label: 'Battery Pack Capex (amortized)' },
  { key: 'maintenanceCost', label: 'Pack Maintenance' },
  { key: 'platformFee',     label: 'Platform Infrastructure Fee' },
];

export function BatteryPage() {
  const { results } = useSimulatorStore();
  return (
    <EntityPage
      entityKey="battery"
      rows={results.battery}
      revenueKeys={REVENUE_KEYS}
      costKeys={COST_KEYS}
      accentColor="emerald"
      icon={BatteryCharging}
    />
  );
}
