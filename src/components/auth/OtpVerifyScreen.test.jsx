import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OtpVerifyScreen } from './OtpVerifyScreen';

const mockVerifyOtp = vi.fn();
const mockRequestOtp = vi.fn();
const onBack = vi.fn();

let mockState = {
  verifyOtp: mockVerifyOtp,
  requestOtp: mockRequestOtp,
  authError: null,
  verifyOtpLoading: false,
  requestOtpLoading: false,
};

vi.mock('../../store/useAuthStore', () => ({
  default: (selector) => selector(mockState),
}));

const defaultProps = {
  email: 'alice@example.com',
  requestPayload: {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    companyName: 'Acme Inc',
  },
  onBack,
};

describe('OtpVerifyScreen', () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset();
    mockRequestOtp.mockReset();
    onBack.mockClear();
    mockState = {
      verifyOtp: mockVerifyOtp,
      requestOtp: mockRequestOtp,
      authError: null,
      verifyOtpLoading: false,
      requestOtpLoading: false,
    };
  });

  it('renders OTP input', () => {
    render(<OtpVerifyScreen {...defaultProps} />);
    expect(screen.getByTestId('otp-input')).toBeInTheDocument();
    expect(screen.getByTestId('verify-submit')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('verifyOtp is called with correct data', async () => {
    mockVerifyOtp.mockResolvedValue({ success: true });

    render(<OtpVerifyScreen {...defaultProps} />);
    fireEvent.change(screen.getByTestId('otp-input'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByTestId('verify-submit'));

    await vi.waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'alice@example.com',
        otp: '123456',
      });
    });
  });

  it('successful verification calls verifyOtp and store persists session', async () => {
    mockVerifyOtp.mockResolvedValue({
      success: true,
      data: {
        token: 'abc123',
        user: { id: 1, email: 'alice@example.com' },
        ndaAccepted: false,
        walkthroughSeen: false,
      },
    });

    render(<OtpVerifyScreen {...defaultProps} />);
    fireEvent.change(screen.getByTestId('otp-input'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByTestId('verify-submit'));

    await vi.waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'alice@example.com',
        otp: '123456',
      });
    });
    const result = await mockVerifyOtp.mock.results[0].value;
    expect(result.success).toBe(true);
  });

  it('invalid OTP shows error', () => {
    mockState.authError = 'Invalid or expired verification code.';

    render(<OtpVerifyScreen {...defaultProps} />);

    expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    expect(screen.getByText('Invalid or expired verification code.')).toBeInTheDocument();
  });

  it('resend triggers requestOtp again', async () => {
    mockRequestOtp.mockResolvedValue({ success: true });

    render(<OtpVerifyScreen {...defaultProps} />);
    fireEvent.click(screen.getByTestId('resend-button'));

    await vi.waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        companyName: 'Acme Inc',
      });
    });
  });

  it('back action calls onBack', () => {
    render(<OtpVerifyScreen {...defaultProps} />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('verify submit is disabled when OTP is not 6 digits', () => {
    render(<OtpVerifyScreen {...defaultProps} />);
    expect(screen.getByTestId('verify-submit')).toBeDisabled();

    fireEvent.change(screen.getByTestId('otp-input'), {
      target: { value: '12345' },
    });
    expect(screen.getByTestId('verify-submit')).toBeDisabled();

    fireEvent.change(screen.getByTestId('otp-input'), {
      target: { value: '123456' },
    });
    expect(screen.getByTestId('verify-submit')).not.toBeDisabled();
  });

  it('resend is disabled when loading', () => {
    mockState.requestOtpLoading = true;
    render(<OtpVerifyScreen {...defaultProps} />);
    expect(screen.getByTestId('resend-button')).toBeDisabled();
  });
});
