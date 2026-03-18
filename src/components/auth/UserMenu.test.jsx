import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserMenu } from './UserMenu';

const mockLogout = vi.fn();
let mockState = {
  user: { name: 'Alice Smith', email: 'alice@example.com' },
  logout: mockLogout,
  logoutLoading: false,
};

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) => selector(mockState),
}));

describe('UserMenu', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockState = {
      user: { name: 'Alice Smith', email: 'alice@example.com' },
      logout: mockLogout,
      logoutLoading: false,
    };
  });

  it('renders user menu with user name', () => {
    render(<UserMenu />);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
  });

  it('shows name and email in dropdown when opened', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    const menu = screen.getByRole('menu');
    expect(menu).toHaveTextContent('Alice Smith');
    expect(menu).toHaveTextContent('alice@example.com');
  });

  it('logout calls auth store logout action', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    fireEvent.click(screen.getByTestId('user-menu-logout'));

    expect(mockLogout).toHaveBeenCalled();
  });

  it('logout triggers backend API call via auth store', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    fireEvent.click(screen.getByTestId('user-menu-logout'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('disables logout button while loading', () => {
    mockState.logoutLoading = true;
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));

    const logoutBtn = screen.getByTestId('user-menu-logout');
    expect(logoutBtn).toBeDisabled();
    expect(screen.getByText('Signing out…')).toBeInTheDocument();
  });

  it('falls back to firstName + lastName when name is missing', () => {
    mockState.user = { firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' };
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));

    const menu = screen.getByRole('menu');
    expect(menu).toHaveTextContent('Bob Jones');
  });

  it('does not show admin entry (admin is via CTRL+Shift+A)', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.queryByTestId('user-menu-admin')).not.toBeInTheDocument();
  });
});
