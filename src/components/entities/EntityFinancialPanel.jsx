/**
 * EntityFinancialPanel – full investor-facing financial summary for one entity.
 *
 * Sections (top → bottom):
 *   1. KPI strip         – Revenue · EBITDA · EBITDA% · Capex · IRR · Payback
 *   2. Two-column card   – Income waterfall (left) · Return summary (right)
 *   3. Cash flow schedule – Year-by-year table with cumulative + breakeven
 *   4. Multi-year P&L    – Collapsible runModel projection table
 *
 * Props:
 *   entityKey       – 'battery' | 'platform' | 'fleet'
 *   company         – snapshot entity data (annualRevenue, irr, capex, cashFlows …)
 *   rows            – runModel multi-year rows (for collapsible P&L table)
 *   settings        – { projectionYears }
 *   targetIRR       – entity hurdle rate (fraction)
 *   accentColor     – 'emerald' | 'blue' | 'amber'
 *   waterfallLines  – income statement line config (see entityConfigs below)
 *   revenueKeys     – [{ key, label }] for multi-year table
 *   costKeys        – [{ key, label }] for multi-year table
 */

import { useState }         from 'react';
import clsx                 from 'clsx';
import { ChevronDown }      from 'lucide-react';
import { IncomeWaterfall }  from './IncomeWaterfall';
import { ReturnSummary }    from './ReturnSummary';
import { CashFlowSchedule } from './CashFlowSchedule';
import { Card }             from '../ui/Card';
import {
  formatCurrency,
  formatPercent,
  formatIRR,
  formatPayback,
} from '../../lib/finance/format';

// ─── KPI strip ────────────────────────────────────────────────────────────────

const ACCENT_KPI = {
  emerald: { tile: 'bg-emerald-50 border-emerald-100', val: 'text-emerald-700' },
  blue:    { tile: 'bg-blue-50 border-blue-100',       val: 'text-blue-700'    },
  amber:   { tile: 'bg-amber-50 border-amber-100',     val: 'text-amber-700'   },
};

function KpiTile({ label, value, sub, highlight, accentColor }) {
  const a = ACCENT_KPI[accentColor] ?? ACCENT_KPI.blue;
  return (
    <div className={clsx('rounded-xl border p-3.5', highlight ? `${a.tile}` : 'bg-white border-slate-200')}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={clsx('text-xl font-extrabold tabular-nums leading-none', highlight ? a.val : 'text-slate-900')}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-[11px] text-slate-500 mt-1 leading-tight">{sub}</p>}
    </div>
  );
}

function KpiStrip({ company, accentColor, targetIRR }) {
  if (!company) return null;

  const {
    annualRevenue, annualEBITDA, ebitdaMargin, capex,
    irr, payback,
  } = company;

  const irrOk = irr !== null && isFinite(irr) && !isNaN(irr) && irr >= (targetIRR ?? 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiTile label="Annual Revenue"   value={formatCurrency(annualRevenue ?? 0)}         accentColor={accentColor} />
      <KpiTile label="Annual EBITDA"    value={formatCurrency(annualEBITDA ?? 0)}
               sub={`${formatPercent(ebitdaMargin ?? 0, { decimals: 1 })} margin`}
               accentColor={accentColor} />
      <KpiTile label="EBITDA Margin"    value={formatPercent(ebitdaMargin ?? 0, { decimals: 1 })}
               accentColor={accentColor} />
      <KpiTile label="Total Capex"      value={formatCurrency(capex ?? 0)}
               sub="Equity deployed"  accentColor={accentColor} />
      <KpiTile label="IRR"              value={formatIRR(irr)}
               sub={targetIRR ? `Target ${formatPercent(targetIRR * 100, { decimals: 0 })}` : ''}
               highlight accentColor={accentColor} />
      <KpiTile label="Payback"          value={formatPayback(payback)}
               highlight={!irrOk}  accentColor={accentColor} />
    </div>
  );
}

// ─── Collapsible multi-year P&L table ─────────────────────────────────────────

function MultiYearTable({ rows, revenueKeys, costKeys }) {
  if (!rows?.length) return null;

  const years = rows.map((r) => r.year);

  const tableRow = (label, key, negative = false, bold = false) => (
    <tr key={label + key} className="border-b border-slate-50 hover:bg-slate-50/50">
      <td className={clsx('pl-5 pr-2 py-2 text-xs whitespace-nowrap',
        bold ? 'font-semibold text-slate-800' : 'font-medium text-slate-600')}>
        {label}
      </td>
      {rows.map((r) => {
        const raw     = r[key] ?? 0;
        const display = negative ? -Math.abs(raw) : raw;
        return (
          <td key={r.year} className={clsx(
            'text-right px-3 py-2 text-xs tabular-nums whitespace-nowrap',
            bold ? 'font-bold' : 'font-medium',
            display < 0 ? 'text-red-500' : 'text-slate-800',
          )}>
            {formatCurrency(display)}
          </td>
        );
      })}
    </tr>
  );

  const sectionRow = (label) => (
    <tr key={'__section_' + label} className="bg-slate-100">
      <td colSpan={years.length + 1}
          className="pl-5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
        {label}
      </td>
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left pl-5 pr-2 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
              ($USD)
            </th>
            {years.map((y) => (
              <th key={y} className="text-right px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                Year {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sectionRow('Revenue')}
          {revenueKeys.map((rk) => tableRow(rk.label, rk.key))}
          {tableRow('Total Revenue', 'totalRevenue', false, true)}

          {sectionRow('Operating Costs')}
          {costKeys.map((ck) => tableRow(ck.label, ck.key, true))}
          {tableRow('Total Costs', 'totalCosts', true, true)}

          {sectionRow('Earnings')}
          {tableRow('EBITDA', 'ebitda', false, true)}
          {tableRow('EBIT (after D&A)', 'ebit', false, true)}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function EntityFinancialPanel({
  entityKey,
  company,
  rows,
  settings,
  targetIRR,
  accentColor = 'blue',
  waterfallLines,
  revenueKeys = [],
  costKeys    = [],
}) {
  const [tableOpen, setTableOpen] = useState(false);

  if (!company) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Model output not available. Adjust assumptions and recalculate.
      </div>
    );
  }

  const lines = typeof waterfallLines === 'function'
    ? waterfallLines(company)
    : (waterfallLines ?? []);

  return (
    <div className="space-y-5">

      {/* ── 1. KPI strip ──────────────────────────────────────────────── */}
      <KpiStrip company={company} accentColor={accentColor} targetIRR={targetIRR} />

      {/* ── 2. Income waterfall + return summary ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Income waterfall */}
        <Card overflow="hidden" padding="none" className="xl:col-span-3">
          <div className="px-4 pt-4 pb-1">
            <h4 className="text-sm font-semibold text-slate-900">Income Statement</h4>
            <p className="text-xs text-slate-500 mt-0.5">Year 1 steady-state · simplified investor view</p>
          </div>
          <div className="mt-2">
            <IncomeWaterfall
              lines={lines}
              baseRevenue={company.annualRevenue}
              accentColor={accentColor}
            />
          </div>
        </Card>

        {/* Return summary */}
        <Card className="xl:col-span-2">
          <h4 className="text-sm font-semibold text-slate-900 mb-1">Investment Returns</h4>
          <p className="text-xs text-slate-500 mb-2">Capital metrics · based on model outputs</p>
          <ReturnSummary
            company={company}
            targetIRR={targetIRR}
            accentColor={accentColor}
            projectionYears={settings?.projectionYears}
          />
        </Card>
      </div>

      {/* ── 3. Cash flow schedule ─────────────────────────────────────── */}
      <Card overflow="hidden" padding="none">
        <div className="px-5 pt-5 pb-2">
          <h4 className="text-sm font-semibold text-slate-900">Cash Flow Schedule</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Flat EBITDA model · {settings?.projectionYears ?? '—'}-year horizon · cumulative payback tracking
          </p>
        </div>
        <CashFlowSchedule
          cashFlows={company.cashFlows}
          payback={company.payback}
          accentColor={accentColor}
        />
      </Card>

      {/* ── 4. Multi-year projection (collapsible) ────────────────────── */}
      {rows?.length > 0 && (
        <Card overflow="hidden" padding="none">
          <button
            onClick={() => setTableOpen((v) => !v)}
            aria-expanded={tableOpen}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-800">
                Full Multi-Year P&L Projection
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings?.projectionYears ?? '—'}-year runModel output · click to {tableOpen ? 'collapse' : 'expand'}
              </p>
            </div>
            <ChevronDown className={clsx(
              'w-4 h-4 text-slate-400 transition-transform duration-200',
              tableOpen && 'rotate-180',
            )} />
          </button>

          <div className={clsx(
            'overflow-hidden transition-all duration-300',
            tableOpen ? 'max-h-[2000px]' : 'max-h-0',
          )}>
            <div className="border-t border-slate-100">
              <MultiYearTable
                rows={rows}
                revenueKeys={revenueKeys}
                costKeys={costKeys}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
