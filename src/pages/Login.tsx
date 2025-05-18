
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/MainLayout';
import { LoginCard } from '@/components/auth/LoginCard';
import { LoginFormValues } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserCheck, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const HCAPTCHA_SITE_KEY = 'fda043e0-8372-4d8a-b190-84a8fdee1528';
const REQUIRE_CAPTCHA = true;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { loginWithEmail, isRateLimited, authAttempts, logout, session } = useAuth();
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  
  // Check if user explicitly wants to see the login form (from URL parameter)
  const forceShowLogin = searchParams.get('forceLogin') === 'true';
  
  useEffect(() => {
    const handleRedirectResponse = async () => {
      const hasHashParams = window.location.hash && window.location.hash.length > 1;
      
      if (hasHashParams) {
        setIsLoading(true);
        
        try {
          const { data, error } = await supabase.auth.getSession();
          
          console.log("Auth session after redirect:", data);
          
          if (error) {
            console.error("Auth redirect error:", error);
            toast({
              title: "Login failed",
              description: error.message || "Could not complete authentication",
              variant: "destructive",
            });
          } else if (data.session) {
            toast({
              title: "Login successful",
              description: "You've been signed in with Google",
            });
            window.location.hash = '';
            navigate('/');
          }
        } catch (err) {
          console.error("Error handling redirect:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleRedirectResponse();
    
    // Only check for existing session if not forcing login view
    if (!forceShowLogin) {
      const checkUser = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setAlreadyLoggedIn(true);
          // Don't redirect automatically - show the "already logged in" view instead
        }
      };
      
      checkUser();
    }
  }, [navigate, toast, forceShowLogin]);

  const onSubmit = async (values: LoginFormValues) => {
    if (isRateLimited) {
      toast({
        title: "Too many attempts",
        description: "For security reasons, please try again later.",
        variant: "destructive",
      });
      return;
    }

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
      await loginWithEmail(values.email, values.password, REQUIRE_CAPTCHA ? captchaToken : undefined);
      navigate('/');
    } catch (error: any) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
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
      // Use the public URL from window.location.origin instead of hardcoded URL
      const redirectUrl = `${window.location.origin}/login`;
      
      console.log("Starting OAuth flow with redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }
      
      console.log("OAuth initiation response:", data);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong with social login",
        variant: "destructive",
      });
      console.error("Social login error:", error);
      setSocialLoading(null);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      // Clear any leftover auth tokens
      localStorage.removeItem('supabase.auth.token');
      // Clear all Supabase auth keys to be thorough
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Reset state and show the login form
      setAlreadyLoggedIn(false);
      toast({
        title: "Logged out successfully",
        description: "You can now log in with a different account"
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinue = () => {
    navigate('/');
  };

  // Show a different UI if the user is already logged in
  if (alreadyLoggedIn && !forceShowLogin) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto space-y-6 py-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Already Logged In</h1>
            <p className="text-muted-foreground">You're already signed in to your account</p>
          </div>
          
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-center py-2">
              {session?.user?.email && (
                <p className="font-medium mb-2">Signed in as: {session.user.email}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <Button 
                  onClick={handleContinue}
                  className="flex gap-2 items-center"
                >
                  <UserCheck size={16} />
                  Continue with current account
                </Button>
                <Button 
                  onClick={handleLogout} 
                  variant="outline"
                  className="flex gap-2 items-center"
                  disabled={isLoading}
                >
                  <LogOut size={16} />
                  {isLoading ? "Logging out..." : "Log out and switch accounts"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <a 
                href="/login?forceLogin=true" 
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login?forceLogin=true');
                }}
              >
                Want to use a different account? Click here to see the login form
              </a>
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Log In</h1>
          <p className="text-muted-foreground">Enter your credentials to access your account</p>
        </div>

        <LoginCard 
          isRateLimited={isRateLimited}
          socialLoading={socialLoading}
          captchaToken={captchaToken}
          captchaSiteKey={HCAPTCHA_SITE_KEY}
          isLoading={isLoading}
          handleSocialLogin={handleSocialLogin}
          handleCaptchaVerify={handleCaptchaVerify}
          onSubmit={onSubmit}
          requireCaptcha={REQUIRE_CAPTCHA}
        />

        {alreadyLoggedIn && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You are logged in with a different account
            </p>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
              className="flex gap-2 items-center"
              disabled={isLoading}
            >
              <LogOut size={16} />
              {isLoading ? "Logging out..." : "Log out first"}
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
