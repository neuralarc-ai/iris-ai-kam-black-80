
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string | null;
  name: string | null;
  pin: string;
  openrouter_api_key: string | null;
  deepseek_api_key: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: UserProfile | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!session;

  // Check for existing session in localStorage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('iris_user_profile');
    if (storedProfile) {
      try {
        const profileData = JSON.parse(storedProfile);
        setUser(profileData);
        setSession(profileData);
        setProfile(profileData);
      } catch (error) {
        console.error('Error parsing stored profile:', error);
        localStorage.removeItem('iris_user_profile');
      }
    }
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    try {
      console.log('Attempting login with PIN:', pin);
      setLoading(true);
      
      // Check if a profile with this PIN exists
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

      // Store the profile in localStorage for persistence
      localStorage.setItem('iris_user_profile', JSON.stringify(profileData));

      // Set the authenticated state
      setUser(profileData);
      setSession(profileData);
      setProfile(profileData);

      console.log('Login successful');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('iris_user_profile');
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
