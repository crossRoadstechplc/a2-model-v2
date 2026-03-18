/**
 * AccessLogsFilters – filter controls for access logs.
 * Matches backend: email, activeOnly, dateFrom, dateTo, limit, offset.
 */

import { RefreshCw, Search } from 'lucide-react';

const LIMIT_OPTIONS = [50, 100];

export function AccessLogsFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}) {
  const { email, activeOnly, dateFrom, dateTo, limit } = filters;

  function handleApply(e) {
    e?.preventDefault();
    const form = e?.target?.form ?? e?.target?.closest('form');
    if (!form) return;
    const fd = new FormData(form);
    const emailVal = fd.get('email')?.trim() || '';
    const activeOnlyVal = fd.get('activeOnly') === 'on';
    const dateFromVal = fd.get('dateFrom') || '';
    const dateToVal = fd.get('dateTo') || '';
    const limitVal = Number(fd.get('limit')) || 50;
    onFiltersChange({
      email: emailVal,
      activeOnly: activeOnlyVal,
      dateFrom: dateFromVal,
      dateTo: dateToVal,
      limit: limitVal,
      offset: 0,
    });
  }

  function handleClear() {
    onFiltersChange({
      email: '',
      activeOnly: false,
      dateFrom: '',
      dateTo: '',
      limit: 50,
      offset: 0,
    });
  }

  return (
    <form
      key={JSON.stringify({ email, dateFrom, dateTo, activeOnly, limit })}
      onSubmit={handleApply}
      className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="access-logs-email" className="text-xs font-medium text-slate-600">
          Email
        </label>
        <input
          id="access-logs-email"
          name="email"
          type="text"
          placeholder="Filter by email"
          defaultValue={email}
          className="w-48 px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="access-logs-dateFrom" className="text-xs font-medium text-slate-600">
          From
        </label>
        <input
          id="access-logs-dateFrom"
          name="dateFrom"
          type="date"
          defaultValue={dateFrom}
          className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="access-logs-dateTo" className="text-xs font-medium text-slate-600">
          To
        </label>
        <input
          id="access-logs-dateTo"
          name="dateTo"
          type="date"
          defaultValue={dateTo}
          className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            name="activeOnly"
            type="checkbox"
            defaultChecked={activeOnly}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">Active only</span>
        </label>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="access-logs-limit" className="text-xs font-medium text-slate-600">
          Limit
        </label>
        <select
          id="access-logs-limit"
          name="limit"
          defaultValue={limit}
          className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          Apply
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      {(hasPrev || hasNext) && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev || loading}
            className="px-6 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext || loading}
            className="px-6 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </form>
  );
}
