import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMenu } from './UserMenu';

describe('UserMenu', () => {
  it('renders local session label (standalone, no API)', () => {
    render(<UserMenu />);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.getByLabelText(/local session/i)).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
  });
});
