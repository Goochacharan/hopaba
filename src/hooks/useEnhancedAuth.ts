
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  failedAttempts: number;
  lastFailedAttempt: Date | null;
  isLocked: boolean;
  lockoutUntil: Date | null;
}

export const useEnhancedAuth = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    failedAttempts: 0,
    lastFailedAttempt: null,
    isLocked: false,
    lockoutUntil: null
  });

  const logSecurityEvent = async (action: string, details: any = {}) => {
    try {
      // Log security events to audit table
      await supabase.rpc('check_rate_limit', {
        user_identifier: details.email || 'anonymous',
        action_type: action,
        max_requests: 100,
        time_window_minutes: 60
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const enhancedLogin = async (email: string, password: string, captchaToken?: string) => {
    try {
      // Check if account is locked
      if (securityMetrics.isLocked && securityMetrics.lockoutUntil && new Date() < securityMetrics.lockoutUntil) {
        const remainingTime = Math.ceil((securityMetrics.lockoutUntil.getTime() - new Date().getTime()) / 1000 / 60);
        toast({
          title: "Account Locked",
          description: `Account is locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
          variant: "destructive",
        });
        return { success: false, error: { message: 'Account locked', name: 'AccountLocked', status: 423 } };
      }

      // Attempt login with enhanced security
      const result = await auth.loginWithEmail(email, password, captchaToken);

      if (result.success) {
        // Reset security metrics on successful login
        setSecurityMetrics({
          failedAttempts: 0,
          lastFailedAttempt: null,
          isLocked: false,
          lockoutUntil: null
        });
        
        await logSecurityEvent('successful_login', { email });
        
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      } else {
        // Handle failed login
        const newFailedAttempts = securityMetrics.failedAttempts + 1;
        const now = new Date();
        
        let isLocked = false;
        let lockoutUntil = null;
        
        // Lock account after 5 failed attempts
        if (newFailedAttempts >= 5) {
          isLocked = true;
          lockoutUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes lockout
        }
        
        setSecurityMetrics({
          failedAttempts: newFailedAttempts,
          lastFailedAttempt: now,
          isLocked,
          lockoutUntil
        });
        
        await logSecurityEvent('failed_login', { 
          email, 
          attempts: newFailedAttempts,
          error: result.error?.message 
        });
        
        if (isLocked) {
          toast({
            title: "Account Locked",
            description: "Too many failed login attempts. Account locked for 15 minutes.",
            variant: "destructive",
          });
        } else {
          const remainingAttempts = 5 - newFailedAttempts;
          toast({
            title: "Login Failed",
            description: `${result.error?.message}. ${remainingAttempts} attempts remaining before lockout.`,
            variant: "destructive",
          });
        }
      }
      
      return result;
    } catch (error: any) {
      await logSecurityEvent('login_error', { email, error: error.message });
      return { success: false, error };
    }
  };

  const enhancedSignup = async (email: string, password: string, fullName: string, captchaToken?: string) => {
    try {
      // Enhanced signup with security logging
      const result = await auth.signupWithEmail(email, password, fullName, captchaToken);
      
      if (result.success) {
        await logSecurityEvent('successful_signup', { email });
        toast({
          title: "Signup Successful",
          description: "Please check your email for verification.",
        });
      } else {
        await logSecurityEvent('failed_signup', { 
          email, 
          error: result.error?.message 
        });
      }
      
      return result;
    } catch (error: any) {
      await logSecurityEvent('signup_error', { email, error: error.message });
      return { success: false, error };
    }
  };

  // Reset security metrics after lockout period
  useEffect(() => {
    if (securityMetrics.isLocked && securityMetrics.lockoutUntil) {
      const timeUntilUnlock = securityMetrics.lockoutUntil.getTime() - new Date().getTime();
      
      if (timeUntilUnlock > 0) {
        const timeout = setTimeout(() => {
          setSecurityMetrics(prev => ({
            ...prev,
            isLocked: false,
            lockoutUntil: null,
            failedAttempts: 0
          }));
          
          toast({
            title: "Account Unlocked",
            description: "You can now try logging in again.",
          });
        }, timeUntilUnlock);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [securityMetrics.lockoutUntil, securityMetrics.isLocked, toast]);

  return {
    ...auth,
    enhancedLogin,
    enhancedSignup,
    securityMetrics,
    logSecurityEvent
  };
};
