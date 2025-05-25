import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/MainLayout';
import { SignupCard } from '@/components/auth/SignupCard';
import { SignupFormValues } from '@/components/auth/SignupForm';
import { useAuth } from '@/hooks/useAuth';

const HCAPTCHA_SITE_KEY = 'fda043e0-8372-4d8a-b190-84a8fdee1528';
const REQUIRE_CAPTCHA = false; // Temporarily disabled captcha verification

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { authAttempts, isRateLimited, signupWithEmail } = useAuth();
  
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkUser();
  }, [navigate]);

  const onSubmit = async (values: SignupFormValues) => {
    if (isRateLimited) {
      toast({
        title: "Too many attempts",
        description: "For security reasons, please try again later.",
        variant: "destructive",
      });
      return;
    }

    // Comment out captcha requirement
    // Always require captcha
    if (REQUIRE_CAPTCHA && !captchaToken) {
      toast({
        title: "CAPTCHA verification required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signupWithEmail(values.email, values.password, "", REQUIRE_CAPTCHA ? captchaToken : null);
      navigate('/login');
      toast({
        title: "Account created",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google') => {
    if (isRateLimited) {
      toast({
        title: "Too many attempts",
        description: "For security reasons, please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    setSocialLoading(provider);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Something went wrong with social sign up",
        variant: "destructive",
      });
      console.error("Social signup error:", error);
      setSocialLoading(null);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground">Enter your details to create a new account</p>
        </div>

        <SignupCard 
          isRateLimited={isRateLimited}
          socialLoading={socialLoading}
          captchaToken={captchaToken}
          captchaSiteKey={HCAPTCHA_SITE_KEY}
          isLoading={isLoading}
          handleSocialSignup={handleSocialSignup}
          handleCaptchaVerify={handleCaptchaVerify}
          onSubmit={onSubmit}
        />
      </div>
    </MainLayout>
  );
}
