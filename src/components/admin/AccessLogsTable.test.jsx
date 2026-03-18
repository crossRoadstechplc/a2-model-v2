import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessLogsTable } from './AccessLogsTable';

describe('AccessLogsTable', () => {
  const sampleLogs = [
    {
      userId: 1,
      name: 'Alice Smith',
      email: 'alice@example.com',
      sessionId: 's1',
      loginAt: '2025-03-18T12:00:00.000Z',
      logoutAt: null,
      lastActivityAt: '2025-03-18T12:30:00.000Z',
      sessionSeconds: null,
      status: 'active',
    },
    {
      userId: 2,
      name: 'Bob Jones',
      email: 'bob@example.com',
      sessionId: 's2',
      loginAt: '2025-03-18T10:00:00.000Z',
      logoutAt: '2025-03-18T11:00:00.000Z',
      lastActivityAt: '2025-03-18T10:55:00.000Z',
      sessionSeconds: 3600,
      status: 'logged_out',
    },
  ];

  it('shows loading state', () => {
    render(<AccessLogsTable logs={[]} loading={true} error={null} />);
    expect(screen.getByText(/Loading access logs/i)).toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    render(<AccessLogsTable logs={[]} loading={false} error={null} />);
    expect(screen.getByText(/No access logs found/i)).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const onRefetch = vi.fn();
    render(
      <AccessLogsTable logs={[]} loading={false} error="Failed to load" onRefetch={onRefetch} />
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /retry/i });
    expect(retry).toBeInTheDocument();
    fireEvent.click(retry);
    expect(onRefetch).toHaveBeenCalled();
  });

  it('renders access logs table with data', () => {
    render(<AccessLogsTable logs={sampleLogs} loading={false} error={null} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Logged out')).toBeInTheDocument();
  });

  it('renders status badges with correct testids', () => {
    render(<AccessLogsTable logs={sampleLogs} loading={false} error={null} />);
    expect(screen.getByTestId('status-badge-active')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-logged_out')).toBeInTheDocument();
  });

  it('formats session duration correctly', () => {
    render(<AccessLogsTable logs={sampleLogs} loading={false} error={null} />);
    expect(screen.getByText('1h 0m 0s')).toBeInTheDocument();
  });

  it('shows column headers', () => {
    render(<AccessLogsTable logs={sampleLogs} loading={false} error={null} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Login time')).toBeInTheDocument();
    expect(screen.getByText('Logout time')).toBeInTheDocument();
    expect(screen.getByText('Last activity')).toBeInTheDocument();
    expect(screen.getByText('Session duration')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});
