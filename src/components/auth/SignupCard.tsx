
import React from 'react';
import { Link } from 'react-router-dom';
import { SocialLoginButtons } from './SocialLoginButtons';
import { SignupForm, SignupFormValues } from './SignupForm';
import { RateLimitAlert } from './RateLimitAlert';
import { Separator } from '@/components/ui/separator';

interface SignupCardProps {
  isRateLimited: boolean;
  socialLoading: string | null;
  captchaToken: string | null;
  captchaSiteKey: string;
  isLoading: boolean;
  handleSocialSignup: (provider: 'google') => void;
  handleCaptchaVerify: (token: string) => void;
  onSubmit: (values: SignupFormValues) => void;
}

export const SignupCard: React.FC<SignupCardProps> = ({
  isRateLimited,
  socialLoading,
  captchaToken,
  captchaSiteKey,
  isLoading,
  handleSocialSignup,
  handleCaptchaVerify,
  onSubmit,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <RateLimitAlert isVisible={isRateLimited} />

      <SocialLoginButtons 
        onSocialLogin={handleSocialSignup}
        isDisabled={isRateLimited}
        isLoading={socialLoading}
      />
      
      <div className="relative">
        <Separator className="my-4" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white px-2 text-xs text-muted-foreground">or sign up with email</span>
        </div>
      </div>

      <SignupForm 
        onSubmit={onSubmit}
        isLoading={isLoading}
        isDisabled={isRateLimited}
        captchaToken={captchaToken}
        captchaSiteKey={captchaSiteKey}
        onCaptchaVerify={handleCaptchaVerify}
        requireCaptcha={false}
      />

      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
