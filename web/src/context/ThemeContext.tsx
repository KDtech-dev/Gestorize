'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemeValue = { mode: ThemeMode; toggle: () => void };
const ThemeContext = createContext<ThemeValue>({ mode: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  useEffect(() => {
    const stored = window.localStorage.getItem('gestorize-theme');
    if (stored === 'light' || stored === 'dark') setMode(stored);
  }, []);
  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    window.localStorage.setItem('gestorize-theme', next);
  };
  return <ThemeContext.Provider value={{ mode, toggle }}><div className="theme-root" data-theme={mode}>{children}</div></ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
