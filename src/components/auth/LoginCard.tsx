
import React from 'react';
import { Link } from 'react-router-dom';
import { SocialLoginButtons } from './SocialLoginButtons';
import { LoginForm, LoginFormValues } from './LoginForm';
import { RateLimitAlert } from './RateLimitAlert';
import { Separator } from '@/components/ui/separator';

interface LoginCardProps {
  isRateLimited: boolean;
  socialLoading: string | null;
  captchaToken: string | null;
  captchaSiteKey: string;
  isLoading: boolean;
  handleSocialLogin: (provider: 'google') => void;
  handleCaptchaVerify: (token: string) => void;
  onSubmit: (values: LoginFormValues) => void;
  requireCaptcha?: boolean;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  isRateLimited,
  socialLoading,
  captchaToken,
  captchaSiteKey,
  isLoading,
  handleSocialLogin,
  handleCaptchaVerify,
  onSubmit,
  requireCaptcha = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <RateLimitAlert isVisible={isRateLimited} />

      {/* Social login buttons never require captcha (disable only for isRateLimited) */}
      <SocialLoginButtons 
        onSocialLogin={handleSocialLogin}
        isDisabled={isRateLimited}
        isLoading={socialLoading}
        buttonText="Continue with"
      />
      
      <div className="relative">
        <Separator className="my-4" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white px-2 text-xs text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <LoginForm 
        onSubmit={onSubmit}
        isLoading={isLoading}
        isDisabled={isRateLimited}
        captchaToken={captchaToken}
        captchaSiteKey={captchaSiteKey}
        onCaptchaVerify={handleCaptchaVerify}
        requireCaptcha={requireCaptcha}
      />

      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
