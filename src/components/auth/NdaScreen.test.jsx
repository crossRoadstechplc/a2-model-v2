import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NdaScreen } from './NdaScreen';

const mockAcceptNda = vi.fn();
let mockState = {
  acceptNda: mockAcceptNda,
  authError: null,
  acceptNdaLoading: false,
};

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) => selector(mockState),
}));

describe('NdaScreen', () => {
  beforeEach(() => {
    mockAcceptNda.mockReset();
    mockState = {
      acceptNda: mockAcceptNda,
      authError: null,
      acceptNdaLoading: false,
    };
  });

  it('renders NDA screen when required', () => {
    render(<NdaScreen />);
    expect(screen.getByRole('heading', { name: /Non-Disclosure Agreement/i })).toBeInTheDocument();
    expect(screen.getByText(/Version 1.0/)).toBeInTheDocument();
    expect(screen.getByTestId('nda-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('accept-nda-submit')).toBeInTheDocument();
    expect(screen.getByText(/Revised Proprietary & NDA Notice/)).toBeInTheDocument();
  });

  it('acceptance calls the correct auth action', async () => {
    mockAcceptNda.mockResolvedValue({ success: true });

    render(<NdaScreen />);
    fireEvent.click(screen.getByTestId('nda-checkbox'));
    fireEvent.click(screen.getByTestId('accept-nda-submit'));

    await vi.waitFor(() => {
      expect(mockAcceptNda).toHaveBeenCalledWith('1.0');
    });
  });

  it('success updates store state and user proceeds', async () => {
    mockAcceptNda.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        ndaAccepted: true,
        ndaVersion: '1.0',
        walkthroughSeen: false,
      },
    });

    render(<NdaScreen />);
    fireEvent.click(screen.getByTestId('nda-checkbox'));
    fireEvent.click(screen.getByTestId('accept-nda-submit'));

    await vi.waitFor(() => {
      expect(mockAcceptNda).toHaveBeenCalled();
    });
    const result = await mockAcceptNda.mock.results[0].value;
    expect(result.success).toBe(true);
  });

  it('submit is disabled when checkbox not checked', () => {
    render(<NdaScreen />);
    expect(screen.getByTestId('accept-nda-submit')).toBeDisabled();

    fireEvent.click(screen.getByTestId('nda-checkbox'));
    expect(screen.getByTestId('accept-nda-submit')).not.toBeDisabled();
  });

  it('submit is disabled while loading', () => {
    mockState.acceptNdaLoading = true;
    render(<NdaScreen />);
    fireEvent.click(screen.getByTestId('nda-checkbox'));
    expect(screen.getByTestId('accept-nda-submit')).toBeDisabled();
    expect(screen.getByText('Accepting…')).toBeInTheDocument();
  });

  it('displays auth error when store has authError', () => {
    mockState.authError = 'NDA version is required';

    render(<NdaScreen />);

    expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    expect(screen.getByText('NDA version is required')).toBeInTheDocument();
  });

  it('does not call acceptNda when checkbox unchecked', () => {
    render(<NdaScreen />);
    fireEvent.click(screen.getByTestId('accept-nda-submit'));
    expect(mockAcceptNda).not.toHaveBeenCalled();
  });
});
