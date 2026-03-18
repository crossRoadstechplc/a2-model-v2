import { Truck } from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { EntityPage } from './EntityPage';

const REVENUE_KEYS = [
  { key: 'freightRevenue', label: 'Freight Revenue (contracted haulage)' },
];

const COST_KEYS = [
  { key: 'truckDepreciation', label: 'Truck Depreciation' },
  { key: 'driverCost',        label: 'Driver Salaries' },
  { key: 'maintenanceCost',   label: 'Vehicle Maintenance' },
  { key: 'insuranceCost',     label: 'Insurance' },
  { key: 'platformFees',      label: 'Platform Access Fees' },
  { key: 'batteryLeaseFees',  label: 'Battery Lease Fees' },
];

export function FleetPage() {
  const { results } = useSimulatorStore();
  return (
    <EntityPage
      entityKey="fleet"
      rows={results.fleet}
      revenueKeys={REVENUE_KEYS}
      costKeys={COST_KEYS}
      accentColor="amber"
      icon={Truck}
    />
  );
}
