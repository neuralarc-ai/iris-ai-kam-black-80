
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  pin: string;
  openrouter_api_key: string | null;
  deepseek_api_key: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!session;

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile data when authenticated
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (profileData) {
                setProfile(profileData);
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    try {
      console.log('Attempting login with PIN:', pin);
      
      // First, check if a profile with this PIN exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('pin', pin)
        .single();

      if (profileError || !profileData) {
        console.error('Profile not found:', profileError);
        return false;
      }

      console.log('Profile found:', profileData);

      // If profile already has a user_id, try to sign in directly
      if (profileData.user_id) {
        console.log('Profile has user_id, attempting direct sign in');
        const email = `pin_${pin}@iris.internal`;
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: pin,
        });

        if (authError) {
          console.error('Direct auth error:', authError);
          return false;
        }

        console.log('Direct login successful');
        return true;
      }

      // If profile exists but no user_id, create auth user
      console.log('Profile exists but no user_id, creating auth user');
      const { data: authUserId, error: functionError } = await supabase.rpc(
        'create_auth_user_for_pin',
        { pin_value: pin }
      );

      if (functionError) {
        console.error('Function error:', functionError);
        return false;
      }

      console.log('Auth user created:', authUserId);

      // Now sign in with the created auth user
      const email = `pin_${pin}@iris.internal`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pin,
      });

      if (authError) {
        console.error('Auth error after creation:', authError);
        return false;
      }

      console.log('Login successful after user creation');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAuthenticated, login, logout, loading }}>
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
