'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SafeUser } from '@packages/shared';
import { apiClient, setAccessToken } from './api-client';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from './constants';

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await apiClient<SafeUser>('/auth/me');
      setUser(userData);
      return userData;
    } catch (error) {
      setUser(null);
      setAccessToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    const res = await apiClient<{ user: SafeUser; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.accessToken) {
      setAccessToken(res.accessToken);
    }
    setUser(res.user);
    router.push(ROUTES.DASHBOARD);
  };

  const register = async (name: string, email: string, password: string) => {
    await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    // After registration, automatically log the user in
    await login(email, password);
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      router.push(ROUTES.LOGIN);
    }
  };

  const logoutAll = async () => {
    try {
      await apiClient('/auth/logout-all', { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setAccessToken(null);
      router.push(ROUTES.LOGIN);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
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
        logoutAll,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
