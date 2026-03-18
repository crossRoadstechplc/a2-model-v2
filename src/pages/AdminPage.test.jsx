import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminPage } from './AdminPage';

const mockSetActivePage = vi.fn();
const mockGetAccessLogs = vi.fn();
let mockIsAdmin = true;

vi.mock('../store/useAuthStore', () => ({
  default: (selector) =>
    selector({
      get isAdmin() {
        return mockIsAdmin;
      },
      token: 'mock-token',
    }),
}));

vi.mock('../store/useSimulatorStore', () => ({
  useSimulatorStore: (selector) =>
    selector({
      setActivePage: mockSetActivePage,
    }),
}));

let mockLogsLoading = false;
let mockLogsError = null;
let mockDashboardLoading = false;
let mockDashboardError = null;
let mockSummary = [];
let mockActiveSessions = [];

vi.mock('../hooks/useAccessLogs', () => ({
  useAccessLogs: () => ({
    logs: mockGetAccessLogs(),
    loading: mockLogsLoading,
    error: mockLogsError,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useAdminDashboard', () => ({
  useAdminDashboard: () => ({
    summary: mockSummary,
    activeSessions: mockActiveSessions,
    loading: mockDashboardLoading,
    error: mockDashboardError,
    refetch: vi.fn(),
  }),
}));

vi.mock('../components/admin/AccessLogsTable', () => ({
  AccessLogsTable: ({ logs, loading }) => (
    <div data-testid="access-logs-table">
      {loading ? 'Loading' : `Logs: ${logs?.length ?? 0}`}
    </div>
  ),
}));

vi.mock('../components/admin/AdminSummaryCards', () => ({
  AdminSummaryCards: ({ summary, activeSessions }) => (
    <div data-testid="admin-summary-cards">
      Users: {summary?.length ?? 0}, Active: {activeSessions?.length ?? 0}
    </div>
  ),
}));

vi.mock('../components/admin/ActiveSessionsTable', () => ({
  ActiveSessionsTable: ({ sessions }) => (
    <div data-testid="active-sessions-table">
      Sessions: {sessions?.length ?? 0}
    </div>
  ),
}));

describe('AdminPage', () => {
  beforeEach(() => {
    mockSetActivePage.mockClear();
    mockGetAccessLogs.mockReturnValue([]);
    mockIsAdmin = true;
    mockLogsLoading = false;
    mockLogsError = null;
    mockDashboardLoading = false;
    mockDashboardError = null;
    mockSummary = [{ userId: 1, loginCount: 5, totalSessionSeconds: 3600 }];
    mockActiveSessions = [{ userId: 1, sessionId: 's1', name: 'Alice', email: 'a@b.com' }];
  });

  it('renders access analytics view when user is admin', () => {
    mockGetAccessLogs.mockReturnValue([
      {
        userId: 1,
        name: 'Alice',
        email: 'alice@example.com',
        sessionId: 's1',
        loginAt: '2025-03-18T12:00:00.000Z',
        logoutAt: null,
        lastActivityAt: '2025-03-18T12:30:00.000Z',
        sessionSeconds: null,
        status: 'active',
      },
    ]);

    render(<AdminPage />);

    expect(screen.getByText('Access analytics')).toBeInTheDocument();
    expect(screen.getByTestId('access-logs-table')).toBeInTheDocument();
    expect(screen.getByText('Logs: 1')).toBeInTheDocument();
  });

  it('fetches and renders access logs', () => {
    mockGetAccessLogs.mockReturnValue([
      { userId: 1, name: 'Alice', email: 'a@b.com', sessionId: 's1', loginAt: '', logoutAt: null, lastActivityAt: '', sessionSeconds: null, status: 'active' },
    ]);

    render(<AdminPage />);

    expect(screen.getByText('Logs: 1')).toBeInTheDocument();
  });

  it('redirects non-admin users to dashboard', () => {
    mockIsAdmin = false;
    render(<AdminPage />);
    expect(mockSetActivePage).toHaveBeenCalledWith('dashboard');
  });

  it('does not render content when user is not admin', () => {
    mockIsAdmin = false;
    render(<AdminPage />);
    expect(screen.queryByText('Access analytics')).not.toBeInTheDocument();
  });

  it('shows loading state when fetching access logs', () => {
    mockLogsLoading = true;
    render(<AdminPage />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('renders summary cards from mocked admin data', () => {
    render(<AdminPage />);
    expect(screen.getByTestId('admin-summary-cards')).toBeInTheDocument();
    expect(screen.getByText(/Users: 1, Active: 1/)).toBeInTheDocument();
  });

  it('renders active sessions section', () => {
    render(<AdminPage />);
    expect(screen.getByTestId('active-sessions-table')).toBeInTheDocument();
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
  });

  it('shows dashboard loading state', () => {
    mockDashboardLoading = true;
    render(<AdminPage />);
    expect(screen.getByText('Loading dashboard…')).toBeInTheDocument();
  });

  it('shows dashboard error state with retry', () => {
    mockDashboardError = 'Failed to load';
    render(<AdminPage />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('non-admins cannot access admin analytics UI', () => {
    mockIsAdmin = false;
    render(<AdminPage />);
    expect(screen.queryByText('Access analytics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-summary-cards')).not.toBeInTheDocument();
  });

  it('renders when forceAccess is true even if not admin', () => {
    mockIsAdmin = false;
    render(<AdminPage forceAccess />);
    expect(screen.getByText('Access analytics')).toBeInTheDocument();
    expect(screen.getByTestId('admin-summary-cards')).toBeInTheDocument();
  });

  it('renders access logs filters with Apply and Refresh', () => {
    render(<AdminPage />);
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });
});
