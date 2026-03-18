import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthErrorBanner } from './AuthErrorBanner';

describe('AuthErrorBanner', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<AuthErrorBanner message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when message is empty', () => {
    const { container } = render(<AuthErrorBanner message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message when provided', () => {
    render(<AuthErrorBanner message="Invalid email" />);
    expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('has role alert for accessibility', () => {
    render(<AuthErrorBanner message="Rate limited" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
