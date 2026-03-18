import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestOtpScreen } from './RequestOtpScreen';

const mockRequestOtp = vi.fn();
let mockState = {
  requestOtp: mockRequestOtp,
  authError: null,
  requestOtpLoading: false,
};

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) => selector(mockState),
}));

function fillAndSubmit() {
  fireEvent.change(screen.getByTestId('first-name'), { target: { value: 'John' } });
  fireEvent.change(screen.getByTestId('last-name'), { target: { value: 'Doe' } });
  fireEvent.change(screen.getByTestId('email'), { target: { value: 'john@example.com' } });
  fireEvent.click(screen.getByTestId('request-otp-submit'));
}

describe('RequestOtpScreen', () => {
  const onSuccess = vi.fn();

  beforeEach(() => {
    mockRequestOtp.mockReset();
    onSuccess.mockClear();
    mockState = {
      requestOtp: mockRequestOtp,
      authError: null,
      requestOtpLoading: false,
    };
  });

  it('renders registration fields per API doc', () => {
    render(<RequestOtpScreen onSuccess={onSuccess} />);
    expect(screen.getByTestId('first-name')).toBeInTheDocument();
    expect(screen.getByTestId('last-name')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('company-name')).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Company allowed:')).toBeInTheDocument();
  });

  it('shows Company allowed as read-only EIH', () => {
    render(<RequestOtpScreen onSuccess={onSuccess} />);
    const companyInput = screen.getByTestId('company-name');
    expect(companyInput).toHaveValue('EIH');
    expect(companyInput).toHaveAttribute('readonly');
  });

  it('validates missing and invalid input', () => {
    render(<RequestOtpScreen onSuccess={onSuccess} />);
    expect(screen.getByTestId('request-otp-submit')).toBeDisabled();

    fireEvent.change(screen.getByTestId('last-name'), { target: { value: '' } });
    fireEvent.blur(screen.getByTestId('last-name'));
    expect(screen.getByText('Last name is required')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('last-name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByTestId('email'), { target: { value: 'invalid' } });
    fireEvent.blur(screen.getByTestId('email'));
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('calls requestOtp on submit', async () => {
    mockRequestOtp.mockResolvedValue({ success: true });

    render(<RequestOtpScreen onSuccess={onSuccess} />);
    fillAndSubmit();

    await vi.waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyName: 'EIH',
      });
    });
  });

  it('transitions to OTP stage on success', async () => {
    mockRequestOtp.mockResolvedValue({ success: true });

    render(<RequestOtpScreen onSuccess={onSuccess} />);
    fillAndSubmit();

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyName: 'EIH',
      });
    });
  });

  it('does not call onSuccess when requestOtp fails', async () => {
    mockRequestOtp.mockResolvedValue({ success: false, message: 'Too many requests' });

    render(<RequestOtpScreen onSuccess={onSuccess} />);
    fillAndSubmit();

    await vi.waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalled();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('displays auth error when store has authError', () => {
    mockState.authError = 'Too many requests. Please try again later.';

    render(<RequestOtpScreen onSuccess={onSuccess} />);

    expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    expect(screen.getByText('Too many requests. Please try again later.')).toBeInTheDocument();
  });

  it('submit is disabled when loading', () => {
    mockState.requestOtpLoading = true;
    render(<RequestOtpScreen onSuccess={onSuccess} />);
    expect(screen.getByTestId('request-otp-submit')).toBeDisabled();
    expect(screen.getByText('Sending code…')).toBeInTheDocument();
  });
});
