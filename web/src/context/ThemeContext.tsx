'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemeValue = { mode: ThemeMode; toggle: () => void; compactLists: boolean; setCompactLists: (value: boolean) => void };
const ThemeContext = createContext<ThemeValue>({ mode: 'light', toggle: () => {}, compactLists: false, setCompactLists: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [compactLists, setCompactListsState] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem('gestorize-theme');
    if (stored === 'light' || stored === 'dark') setMode(stored);
    setCompactListsState(window.localStorage.getItem('gestorize-compact-lists') === 'true');
  }, []);
  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    window.localStorage.setItem('gestorize-theme', next);
  };
  const setCompactLists = (value: boolean) => {
    setCompactListsState(value);
    window.localStorage.setItem('gestorize-compact-lists', String(value));
  };
  return <ThemeContext.Provider value={{ mode, toggle, compactLists, setCompactLists }}><div className="theme-root" data-theme={mode} data-compact={compactLists}>{children}</div></ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
