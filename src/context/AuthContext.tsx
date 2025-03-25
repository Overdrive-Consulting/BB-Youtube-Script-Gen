import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Utility function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  
  // Ref to track if we're currently in the signin process
  const isSigningIn = useRef(false);
  // Ref to track forced loading (for showing loading screen)
  const forceLoading = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.id);
      
      // Don't immediately turn off loading if we're in signin process
      // This prevents the loading state from being reset before our delay completes
      if (isSigningIn.current || forceLoading.current) {
        console.log("Keeping loading state true because signin is in progress");
        setSession(session);
        setUser(session?.user ?? null);
        // Don't set loading to false here
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      isSigningIn.current = true;
      forceLoading.current = true;
      
      // Show loading state for minimum 1 second to avoid flickering
      const authPromise = supabase.auth.signInWithPassword({ email, password });
      const delayPromise = delay(1000);
      
      // Wait for both promises to complete
      const [authResult] = await Promise.all([authPromise, delayPromise]);
      const { error } = authResult;
      
      if (error) {
        throw error;
      }
      
      // Add a moderate delay for loading experience (5 seconds)
      console.log("Authentication successful, showing loader for 5 seconds");
      await delay(5000);
      
      // Navigate to homepage
      navigate('/');
      toast.success('Signed in successfully');
      
      // Add an additional delay before completing the process
      // This ensures the loading screen stays visible during transition
      await delay(2000);
    } catch (error: any) {
      toast.error(`Error signing in: ${error.message}`);
      console.error('Error signing in:', error);
    } finally {
      // Always clean up our refs and loading state
      isSigningIn.current = false;
      forceLoading.current = false;
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setLoading(true);
      isSigningIn.current = true;
      forceLoading.current = true;
      
      // Show loading state for minimum 1 second to avoid flickering
      const authPromise = supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      const delayPromise = delay(1000);
      
      // Wait for both promises to complete
      const [authResult] = await Promise.all([authPromise, delayPromise]);
      const { error } = authResult;
      
      if (error) {
        throw error;
      }
      
      // Add a moderate delay for loading experience (5 seconds)
      console.log("Sign up successful, showing loader for 5 seconds");
      await delay(5000);
      
      toast.success('Signed up successfully!');
    } catch (error: any) {
      toast.error(`Error signing up: ${error.message}`);
      console.error('Error signing up:', error);
    } finally {
      isSigningIn.current = false;
      forceLoading.current = false;
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      forceLoading.current = true;

      // First, try to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Then clear local state
      setSession(null);
      setUser(null);
      isSigningIn.current = false;
      
      // Add a small delay to ensure state updates are processed
      await delay(500);
      
      // Use replace: true to prevent back navigation
      navigate('/auth', { replace: true });
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Error signing out:', error);
      
      // If we get a session missing error, force clear everything
      if (error.message?.includes('Auth session missing')) {
        // Force clear the local state
        setSession(null);
        setUser(null);
        navigate('/auth', { replace: true });
        toast.success('Signed out successfully');
      } else {
        toast.error(`Error signing out: ${error.message}`);
      }
    } finally {
      setLoading(false);
      forceLoading.current = false;
      isSigningIn.current = false;
    }
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
