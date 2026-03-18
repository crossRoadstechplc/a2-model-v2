import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessLogsFilters } from './AccessLogsFilters';

describe('AccessLogsFilters', () => {
  const defaultFilters = {
    email: '',
    activeOnly: false,
    dateFrom: '',
    dateTo: '',
    limit: 50,
    offset: 0,
  };

  it('renders filter controls', () => {
    const onFiltersChange = vi.fn();
    const onRefresh = vi.fn();

    render(
      <AccessLogsFilters
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        onRefresh={onRefresh}
        loading={false}
      />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/active only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('calls onRefresh when Refresh clicked', () => {
    const onRefresh = vi.fn();

    render(
      <AccessLogsFilters
        filters={defaultFilters}
        onFiltersChange={vi.fn()}
        onRefresh={onRefresh}
        loading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('calls onFiltersChange with defaults when Clear clicked', () => {
    const onFiltersChange = vi.fn();

    render(
      <AccessLogsFilters
        filters={{ ...defaultFilters, email: 'test@x.com' }}
        onFiltersChange={onFiltersChange}
        onRefresh={vi.fn()}
        loading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onFiltersChange).toHaveBeenCalledWith({
      email: '',
      activeOnly: false,
      dateFrom: '',
      dateTo: '',
      limit: 50,
      offset: 0,
    });
  });

  it('calls onFiltersChange with form values when Apply clicked', () => {
    const onFiltersChange = vi.fn();

    render(
      <AccessLogsFilters
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        onRefresh={vi.fn()}
        loading={false}
      />
    );

    const emailInput = screen.getByPlaceholderText(/filter by email/i);
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        limit: 50,
        offset: 0,
      })
    );
  });

  it('shows pagination when hasPrev or hasNext', () => {
    render(
      <AccessLogsFilters
        filters={defaultFilters}
        onFiltersChange={vi.fn()}
        onRefresh={vi.fn()}
        loading={false}
        hasNext={true}
        hasPrev={false}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });
});
