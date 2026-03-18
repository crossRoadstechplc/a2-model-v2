import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveSessionsTable } from './ActiveSessionsTable';

describe('ActiveSessionsTable', () => {
  const sampleSessions = [
    {
      userId: 1,
      name: 'Alice Smith',
      email: 'alice@example.com',
      sessionId: 's1',
      loginAt: '2025-03-18T12:00:00.000Z',
      lastActivityAt: '2025-03-18T12:30:00.000Z',
    },
    {
      userId: 2,
      name: 'Bob Jones',
      email: 'bob@example.com',
      sessionId: 's2',
      loginAt: '2025-03-18T10:00:00.000Z',
      lastActivityAt: '2025-03-18T10:45:00.000Z',
    },
  ];

  it('renders active sessions table with data', () => {
    render(<ActiveSessionsTable sessions={sampleSessions} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
  });

  it('shows column headers', () => {
    render(<ActiveSessionsTable sessions={sampleSessions} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Login time')).toBeInTheDocument();
    expect(screen.getByText('Last activity')).toBeInTheDocument();
    expect(screen.getByText('Current duration')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows empty state when no sessions', () => {
    render(<ActiveSessionsTable sessions={[]} />);
    expect(screen.getByText('No active sessions')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
