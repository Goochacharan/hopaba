
import React, { useState } from 'react';
import { Captcha } from '@/components/ui/captcha';

interface CaptchaVerificationProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

export const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({
  siteKey,
  onVerify,
}) => {
  const [hasError, setHasError] = useState(false);
  
  console.log('CaptchaVerification rendering with site key:', siteKey);
  
  // Handle verification with error catching
  const handleVerify = (token: string) => {
    try {
      if (token) {
        setHasError(false);
        onVerify(token);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error("CAPTCHA verification error:", error);
      setHasError(true);
    }
  };
  
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground mb-2">Please complete the CAPTCHA verification:</p>
      <Captcha siteKey={siteKey} onVerify={handleVerify} />
      {hasError && (
        <p className="text-xs text-red-500 mt-1">
          CAPTCHA verification failed. Please try again.
        </p>
      )}
    </div>
  );
};
