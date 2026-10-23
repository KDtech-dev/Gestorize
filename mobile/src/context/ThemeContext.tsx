import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'gestorize.theme.mode';

type ThemeContextType = AppTheme & {
  isDark: boolean;
};

export type AppTheme = {
  colors: {
    primary: string;
    card: string;
    elevated: string;
    accent: string;
    accentText: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    success: string;
    error: string;
  };
};

const defaultTheme: AppTheme = {
  colors: {
    primary: '#005CE4',
    card: '#ffffff',
    elevated: '#f8fafc',
    accent: '#e6e3dd',
    accentText: '#062046',
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#ffffff',
    text: '#0f172a',
    muted: '#475569',
    success: '#16a34a',
    error: '#ef4444',
  },
};

const ThemeContext = createContext<ThemeContextType>({
  ...defaultTheme,
  isDark: false,
});
const ThemeToggleContext = createContext<{
  toggle: () => void;
  compactLists: boolean;
  setCompactLists: React.Dispatch<React.SetStateAction<boolean>>;
  mode: 'light' | 'dark';
}>({
  toggle: () => {},
  compactLists: false,
  setCompactLists: () => {},
  mode: 'light',
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [compactLists, setCompactLists] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const themeChangedByUser = useRef(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (mounted && !themeChangedByUser.current && (storedMode === 'light' || storedMode === 'dark')) {
          setMode(storedMode);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setThemeLoaded(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (themeLoaded) AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, [mode, themeLoaded]);

  const value = useMemo(() => {
    const light = defaultTheme;

    const dark: AppTheme = {
      colors: {
        primary: '#ffffff',
        card: '#254a79',
        elevated: '#05244d',
        accent: '#e0e0de',
        accentText: '#062046',
        background: '#062046',
        surface: '#0b274f',
        border: '#0e3266',
        text: '#ffffff',
        muted: '#cdd9f1',
        success: '#22c55e',
        error: '#f87171',
      },
    };

    const isDark = mode === 'dark';

    return {
      ...(isDark ? dark : light),
      isDark,
    };
  }, [mode]);

  const toggle = () => {
    themeChangedByUser.current = true;
    setMode((current) => current === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeToggleContext.Provider
      value={{ toggle, compactLists, setCompactLists, mode }}
    >
      <ThemeContext.Provider value={value}>{themeLoaded ? children : null}</ThemeContext.Provider>
    </ThemeToggleContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useThemeToggle = () => useContext(ThemeToggleContext);
