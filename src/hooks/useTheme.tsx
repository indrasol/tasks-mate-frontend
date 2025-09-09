import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const getInitialTheme = (): Theme => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      return stored || 'system';
    } catch {
      return 'system';
    }
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const media = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);
  const prefersDark = media.matches;

  const resolvedTheme: 'light' | 'dark' =
    theme === 'dark' || (theme === 'system' && prefersDark) ? 'dark' : 'light';

  const apply = useCallback(
    (next: Theme) => {
      const prefersDarkLocal = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = next === 'dark' || (next === 'system' && prefersDarkLocal);
      document.documentElement.classList.toggle('dark', isDark);
    },
    []
  );

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      try {
        localStorage.setItem('theme', t);
      } catch {}
      apply(t);
    },
    [apply]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    apply(theme);
  }, [theme, apply]);

  useEffect(() => {
    const listener = () => {
      if (theme === 'system') apply('system');
    };
    media.addEventListener?.('change', listener);
    return () => media.removeEventListener?.('change', listener);
  }, [media, theme, apply]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}


