
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error: AuthError | null;
  }>;
  signUp: (email: string, password: string, metadata?: object) => Promise<{
    success: boolean;
    error: AuthError | null;
  }>;
  signOut: () => Promise<void>;
  // Add missing properties to fix TypeScript errors
  logout: () => Promise<void>; // Alias for signOut
  loginWithEmail: (email: string, password: string, captchaToken?: string | null) => Promise<{
    success: boolean;
    error: AuthError | null;
  }>;
  signupWithEmail: (email: string, password: string, fullName: string, captchaToken?: string | null) => Promise<{
    success: boolean;
    error: AuthError | null;
  }>;
  authAttempts: number;
  isRateLimited: boolean;
  resetAuthAttempts: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fix: Define AuthProvider properly as a React function component
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();
  // Add state for authentication attempts tracking
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<Date | null>(null);
  
  // Rate limiting logic
  const MAX_ATTEMPTS = 5;
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  const isRateLimited = authAttempts >= MAX_ATTEMPTS && 
    lastAttemptTime && 
    (new Date().getTime() - lastAttemptTime.getTime() < RATE_LIMIT_WINDOW);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setLoading(true);
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error retrieving initial session:', err);
        setError(err as AuthError);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else {
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Track authentication attempts for rate limiting
  const trackAuthAttempt = () => {
    setAuthAttempts(prev => prev + 1);
    setLastAttemptTime(new Date());
  };
  
  // Reset authentication attempts counter
  const resetAuthAttempts = () => {
    setAuthAttempts(0);
    setLastAttemptTime(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error signing in:', err);
      return { success: false, error: err as AuthError };
    }
  };

  // Alias for loginWithEmail that also implements captcha token
  const loginWithEmail = async (email: string, password: string, captchaToken?: string | null) => {
    if (isRateLimited) {
      return { 
        success: false, 
        error: { 
          message: 'Too many login attempts, please try again later', 
          name: 'RateLimitError',
          status: 429 
        } as AuthError 
      };
    }

    trackAuthAttempt();
    
    try {
      const options: any = {
        captchaToken
      };

      // Set timeout for login requests
      const timeoutPromise = new Promise<{success: false, error: AuthError}>(resolve => {
        setTimeout(() => {
          resolve({ 
            success: false, 
            error: {
              message: 'Login request timed out. Please try again.',
              name: 'TimeoutError',
              status: 408
            } as AuthError
          });
        }, 20000); // 20 second timeout
      });
      
      // Actual login request
      const loginPromise = (async () => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options
          });
          
          if (error) {
            return { success: false, error };
          }
          
          // Reset auth attempts on successful login
          resetAuthAttempts();
          return { success: true, error: null };
        } catch (err) {
          console.error('Error signing in:', err);
          return { success: false, error: err as AuthError };
        }
      })();
      
      // Race between timeout and login
      return await Promise.race([loginPromise, timeoutPromise]);
    } catch (err) {
      console.error('Error signing in:', err);
      return { success: false, error: err as AuthError };
    }
  };

  const signUp = async (email: string, password: string, metadata?: object) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error signing up:', err);
      return { success: false, error: err as AuthError };
    }
  };

  // Implementation for signupWithEmail with captcha
  const signupWithEmail = async (email: string, password: string, fullName: string, captchaToken?: string | null) => {
    if (isRateLimited) {
      return { 
        success: false, 
        error: { 
          message: 'Too many signup attempts, please try again later', 
          name: 'RateLimitError',
          status: 429 
        } as AuthError 
      };
    }

    trackAuthAttempt();
    
    try {
      const options: any = {
        data: { full_name: fullName }
      };
      
      if (captchaToken) {
        options.captchaToken = captchaToken;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
      });
      
      if (error) {
        throw error;
      }
      
      // Reset auth attempts on successful signup
      resetAuthAttempts();
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error signing up:', err);
      return { success: false, error: err as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      toast({
        title: "Logout error",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Alias for signOut for consistency with component naming
  const logout = async () => {
    return signOut();
  };

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    // Add the newly implemented functions to the context
    logout,
    loginWithEmail,
    signupWithEmail,
    authAttempts,
    isRateLimited,
    resetAuthAttempts
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
