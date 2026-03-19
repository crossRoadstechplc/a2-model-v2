import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalkthroughModal } from './WalkthroughModal';

const mockMarkWalkthroughComplete = vi.fn();
const mockSetShowWalkthroughReplay = vi.fn();
let mockState = {
  markWalkthroughComplete: mockMarkWalkthroughComplete,
  setShowWalkthroughReplay: mockSetShowWalkthroughReplay,
};

vi.mock('../../store/useWalkthroughStore', () => ({
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
    mockMarkWalkthroughComplete.mockReset();
    mockSetShowWalkthroughReplay.mockReset();
    mockSimState.setActivePage.mockReset();
    mockSimState.setPanelOpen.mockReset();
    mockSimState.setInputsFocusSection.mockReset();
    mockState = {
      markWalkthroughComplete: mockMarkWalkthroughComplete,
      setShowWalkthroughReplay: mockSetShowWalkthroughReplay,
    };
  });

  it('renders walkthrough modal with first step', () => {
    render(<WalkthroughModal />);
    expect(screen.getByTestId('walkthrough-modal')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Local simulator')).toBeInTheDocument();
    expect(screen.getByText(/runs entirely in your browser/)).toBeInTheDocument();
    expect(screen.getByText(/1 of \d+/)).toBeInTheDocument();
  });

  it('Next advances to next step', () => {
    render(<WalkthroughModal />);
    expect(screen.getByText('Local simulator')).toBeInTheDocument();
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
    expect(screen.getByText('Local simulator')).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-prev')).toBeDisabled();
  });

  it('Finish on last step calls markWalkthroughComplete', () => {
    render(<WalkthroughModal />);

    while (!screen.queryByText('Finish')) {
      fireEvent.click(screen.getByTestId('walkthrough-complete'));
    }

    expect(screen.getByText('Tips')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('walkthrough-complete'));

    expect(mockMarkWalkthroughComplete).toHaveBeenCalled();
  });

  it('Skip calls markWalkthroughComplete', () => {
    render(<WalkthroughModal />);
    fireEvent.click(screen.getByTestId('walkthrough-skip'));
    expect(mockMarkWalkthroughComplete).toHaveBeenCalled();
  });

  it('replay mode closes without marking complete', () => {
    render(<WalkthroughModal replay />);
    fireEvent.click(screen.getByTestId('walkthrough-skip'));
    expect(mockSetShowWalkthroughReplay).toHaveBeenCalledWith(false);
    expect(mockMarkWalkthroughComplete).not.toHaveBeenCalled();
  });

  it('advances from first step to last step', () => {
    render(<WalkthroughModal />);

    expect(screen.getByText('Local simulator')).toBeInTheDocument();

    while (!screen.queryByText('Tips')) {
      fireEvent.click(screen.getByTestId('walkthrough-complete'));
    }

    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });
});
