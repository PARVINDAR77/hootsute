'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { apiClient } from './api-client';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'omnisocial_theme';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeClass(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', mode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (Light is always default)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      const initial: ThemeMode = stored === 'dark' ? 'dark' : 'light';
      setThemeState(initial);
      applyThemeClass(initial);
    } catch {
      applyThemeClass('light');
    } finally {
      setHydrated(true);
    }
  }, []);

  // Sync with backend user preference once authenticated if no explicit local override differs
  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user?.themePreference) return;
    const serverPref: ThemeMode = user.themePreference === 'dark' ? 'dark' : 'light';
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeState(serverPref);
        applyThemeClass(serverPref);
        window.localStorage.setItem(THEME_STORAGE_KEY, serverPref);
      }
    } catch {
      setThemeState(serverPref);
      applyThemeClass(serverPref);
    }
  }, [hydrated, isAuthenticated, user?.themePreference]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setThemeState(next);
      applyThemeClass(next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Ignore storage quota / private mode issues
      }

      if (isAuthenticated) {
        apiClient('/users/me/preferences', {
          method: 'PATCH',
          body: JSON.stringify({ themePreference: next }),
        }).catch(() => {
          // Non-blocking persistence: local theme remains active
        });
      }
    },
    [isAuthenticated],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Graceful fallback for isolated component tests rendered outside ThemeProvider
    return {
      theme: 'light',
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
