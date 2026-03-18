import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalkthroughModal } from './WalkthroughModal';

const mockCompleteWalkthrough = vi.fn();
const mockSetShowWalkthroughReplay = vi.fn();
let mockState = {
  completeWalkthrough: mockCompleteWalkthrough,
  completeWalkthroughLoading: false,
  setShowWalkthroughReplay: mockSetShowWalkthroughReplay,
};

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) => selector(mockState),
}));

const mockSimState = {
  setActivePage: vi.fn(),
  setPanelOpen: vi.fn(),
  setInputsFocusSection: vi.fn(),
};

vi.mock('../../store/useSimulatorStore', () => ({
  useSimulatorStore: (selector) => selector(mockSimState),
}));

describe('WalkthroughModal', () => {
  beforeEach(() => {
    mockCompleteWalkthrough.mockReset();
    mockSetShowWalkthroughReplay.mockReset();
    mockSimState.setActivePage.mockReset();
    mockSimState.setPanelOpen.mockReset();
    mockSimState.setInputsFocusSection.mockReset();
    mockState = {
      completeWalkthrough: mockCompleteWalkthrough,
      completeWalkthroughLoading: false,
      setShowWalkthroughReplay: mockSetShowWalkthroughReplay,
    };
  });

  it('renders walkthrough modal with first step', () => {
    render(<WalkthroughModal />);
    expect(screen.getByTestId('walkthrough-modal')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Session & Security')).toBeInTheDocument();
    expect(screen.getByText(/Your session lasts 4 hours/)).toBeInTheDocument();
    expect(screen.getByText(/1 of \d+/)).toBeInTheDocument();
  });

  it('Next advances to next step', () => {
    render(<WalkthroughModal />);
    expect(screen.getByText('Session & Security')).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-prev')).toBeDisabled();
    fireEvent.click(screen.getByTestId('walkthrough-complete'));
    expect(screen.getByText('How the Simulator Works')).toBeInTheDocument();
    expect(screen.getByText(/2 of \d+/)).toBeInTheDocument();
  });

  it('Previous goes back a step', () => {
    render(<WalkthroughModal />);
    fireEvent.click(screen.getByTestId('walkthrough-complete'));
    expect(screen.getByText('How the Simulator Works')).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-prev')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('walkthrough-prev'));
    expect(screen.getByText('Session & Security')).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-prev')).toBeDisabled();
  });

  it('Finish on last step calls completeWalkthrough', async () => {
    mockCompleteWalkthrough.mockResolvedValue({ success: true });
    render(<WalkthroughModal />);

    // Advance to last step
    while (!screen.queryByText('Finish')) {
      fireEvent.click(screen.getByTestId('walkthrough-complete'));
    }

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
    expect(screen.getByTestId('walkthrough-prev')).toBeDisabled();
    expect(screen.getByTestId('walkthrough-complete')).toBeDisabled();
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('advances from first step to last step', () => {
    render(<WalkthroughModal />);

    expect(screen.getByText('Session & Security')).toBeInTheDocument();

    while (!screen.queryByText('Tips')) {
      fireEvent.click(screen.getByTestId('walkthrough-complete'));
    }

    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });
});
