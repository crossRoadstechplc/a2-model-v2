import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminSummaryCards } from './AdminSummaryCards';

describe('AdminSummaryCards', () => {
  it('renders summary cards from mocked data', () => {
    const summary = [
      { userId: 1, name: 'Alice', email: 'a@b.com', loginCount: 5, totalSessionSeconds: 3600 },
      { userId: 2, name: 'Bob', email: 'bob@b.com', loginCount: 3, totalSessionSeconds: 1800 },
    ];
    const activeSessions = [
      { userId: 1, sessionId: 's1', name: 'Alice', email: 'a@b.com' },
    ];

    render(<AdminSummaryCards summary={summary} activeSessions={activeSessions} />);

    expect(screen.getByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total logins')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Cumulative usage')).toBeInTheDocument();
    expect(screen.getByText('1.5h')).toBeInTheDocument();
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<AdminSummaryCards summary={[]} activeSessions={[]} />);

    expect(screen.getByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('Total logins')).toBeInTheDocument();
    expect(screen.getByText('Cumulative usage')).toBeInTheDocument();
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.getByText('0.00h')).toBeInTheDocument();
  });
});
