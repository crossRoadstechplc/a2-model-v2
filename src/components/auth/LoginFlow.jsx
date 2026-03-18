/**
 * LoginFlow – OTP request and verify.
 * Uses RequestOtpScreen and OtpVerifyScreen. Consumes useAuthStore only.
 */

import { useState } from 'react';
import { RequestOtpScreen } from './RequestOtpScreen';
import { OtpVerifyScreen } from './OtpVerifyScreen';

const STEP_REQUEST = 'request';
const STEP_VERIFY = 'verify';

export function LoginFlow() {
  const [step, setStep] = useState(STEP_REQUEST);
  const [requestPayload, setRequestPayload] = useState(null);

  const handleRequestSuccess = (payload) => {
    setRequestPayload(payload);
    setStep(STEP_VERIFY);
  };

  const handleBack = () => {
    setStep(STEP_REQUEST);
    setRequestPayload(null);
  };

  if (step === STEP_VERIFY && requestPayload) {
    return (
      <OtpVerifyScreen
        email={requestPayload.email}
        requestPayload={requestPayload}
        onBack={handleBack}
      />
    );
  }

  return <RequestOtpScreen onSuccess={handleRequestSuccess} />;
}
