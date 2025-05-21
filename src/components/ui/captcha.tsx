import React, { useEffect, useRef } from 'react';

// Use the type definition from global.d.ts
interface CaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

export function Captcha({ siteKey, onVerify }: CaptchaProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const isScriptLoaded = useRef(false);
  const widgetId = useRef<number | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const renderCaptcha = () => {
    if (divRef.current && window.hcaptcha && window.hcaptcha.render) {
      try {
        // Try to reset first if already rendered
        if (widgetId.current !== null) {
          window.hcaptcha.reset(widgetId.current);
        } else {
          widgetId.current = window.hcaptcha.render(divRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            'error-callback': () => {
              console.error("hCaptcha error callback triggered");
              if (retryCount.current < maxRetries) {
                retryCount.current++;
                setTimeout(() => renderCaptcha(), 2000);
              }
            }
          });
        }
      } catch (error) {
        console.error('hCaptcha rendering error:', error);
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          setTimeout(() => renderCaptcha(), 2000);
        }
      }
    }
  };

  useEffect(() => {
    // Initialize hCaptcha with required properties if it doesn't exist
    if (!window.hcaptcha) {
      // We'll initialize it properly when the script loads
      console.log("hCaptcha not yet loaded, will initialize when script loads");
    }
    
    // Skip if hCaptcha is already loaded
    if (window.hcaptcha && divRef.current && !isScriptLoaded.current) {
      renderCaptcha();
      isScriptLoaded.current = true;
      return;
    }

    // Load the hCaptcha script if not already loaded
    if (!document.querySelector('#hcaptcha-script') && !window.hcaptcha) {
      window.onloadCallback = () => {
        renderCaptcha();
        isScriptLoaded.current = true;
      };

      const script = document.createElement('script');
      script.id = 'hcaptcha-script';
      script.src = `https://js.hcaptcha.com/1/api.js?onload=onloadCallback&render=explicit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      console.log("hCaptcha script added to document head");
    }

    return () => {
      // Clean up the global callback when component unmounts
      // but keep the script for potential reuse
      window.onloadCallback = () => {};
      
      // Reset the captcha when component unmounts
      if (window.hcaptcha && widgetId.current !== null) {
        try {
          window.hcaptcha.reset(widgetId.current);
        } catch (error) {
          console.error('Error resetting hCaptcha:', error);
        }
      }
    };
  }, [siteKey]);

  return (
    <div className="space-y-2">
      <div ref={divRef} className="h-captcha mt-4"></div>
      {retryCount.current > 0 && (
        <p className="text-xs text-amber-500">
          Having trouble loading CAPTCHA. Retrying... ({retryCount.current}/{maxRetries})
        </p>
      )}
    </div>
  );
}
