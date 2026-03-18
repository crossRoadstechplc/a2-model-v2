import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalkthroughModal } from './WalkthroughModal';

const mockCompleteWalkthrough = vi.fn();
let mockState = {
  completeWalkthrough: mockCompleteWalkthrough,
  completeWalkthroughLoading: false,
};

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) => selector(mockState),
}));

describe('WalkthroughModal', () => {
  beforeEach(() => {
    mockCompleteWalkthrough.mockReset();
    mockState = {
      completeWalkthrough: mockCompleteWalkthrough,
      completeWalkthroughLoading: false,
    };
  });

  it('renders walkthrough modal with first step', () => {
    render(<WalkthroughModal />);
    expect(screen.getByTestId('walkthrough-modal')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Session & Security')).toBeInTheDocument();
    expect(screen.getByText(/Your session lasts 4 hours/)).toBeInTheDocument();
    expect(screen.getByText('1 of 4')).toBeInTheDocument();
  });

  it('Next advances to next step', () => {
    render(<WalkthroughModal />);
    expect(screen.getByText('Session & Security')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('walkthrough-complete'));
    expect(screen.getByText('How the Simulator Works')).toBeInTheDocument();
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
  });

  it('Finish on last step calls completeWalkthrough', async () => {
    mockCompleteWalkthrough.mockResolvedValue({ success: true });
    render(<WalkthroughModal />);

    // Advance to last step
    fireEvent.click(screen.getByTestId('walkthrough-complete'));
    fireEvent.click(screen.getByTestId('walkthrough-complete'));
    fireEvent.click(screen.getByTestId('walkthrough-complete'));

    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('walkthrough-complete'));

    await vi.waitFor(() => {
      expect(mockCompleteWalkthrough).toHaveBeenCalled();
    });
  });

  it('Skip calls completeWalkthrough', async () => {
    mockCompleteWalkthrough.mockResolvedValue({ success: true });
    render(<WalkthroughModal />);

    fireEvent.click(screen.getByTestId('walkthrough-skip'));

    await vi.waitFor(() => {
      expect(mockCompleteWalkthrough).toHaveBeenCalled();
    });
  });

  it('completion calls correct auth action', async () => {
    mockCompleteWalkthrough.mockResolvedValue({ success: true });
    render(<WalkthroughModal />);
    fireEvent.click(screen.getByTestId('walkthrough-skip'));

    await vi.waitFor(() => {
      expect(mockCompleteWalkthrough).toHaveBeenCalledTimes(1);
    });
  });

  it('disables buttons while completeWalkthroughLoading', () => {
    mockState.completeWalkthroughLoading = true;
    render(<WalkthroughModal />);

    expect(screen.getByTestId('walkthrough-skip')).toBeDisabled();
    expect(screen.getByTestId('walkthrough-complete')).toBeDisabled();
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('shows all four steps with correct content', () => {
    render(<WalkthroughModal />);

    const titles = ['Session & Security', 'How the Simulator Works', 'Navigation', 'Tips'];
    titles.forEach((title, i) => {
      if (i > 0) {
        fireEvent.click(screen.getByTestId('walkthrough-complete'));
      }
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
