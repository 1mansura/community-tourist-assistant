'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService } from '@/services/auth';
import { api } from '@/lib/api';
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_tokens';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadStoredTokens = useCallback(async () => {
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }
      
      const tokens: AuthTokens = JSON.parse(stored);
      api.setAccessToken(tokens.access);
      
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      api.setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadStoredTokens();
  }, [loadStoredTokens]);
  
  const login = async (credentials: LoginCredentials) => {
    const tokens = await authService.login(credentials);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    
    const profile = await authService.getProfile();
    setUser(profile);
    return profile;
  };
  
  const register = async (data: RegisterData) => {
    await authService.register(data);
    return login({ email: data.email, password: data.password });
  };
  
  const logout = () => {
    authService.logout();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };
  
  const refreshUser = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch {
      logout();
      return null;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
