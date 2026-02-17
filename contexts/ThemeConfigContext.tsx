'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeConfig {
  isDarkMode: boolean;
  sidebar: boolean;
  theme: string;
  menu: string;
  layout: string;
  rtlClass: string;
  animation: string;
  navbar: string;
  locale: string;
  semidark: boolean;
  languageList: Array<{ code: string; name: string }>;
}

interface ThemeConfigContextType {
  themeConfig: ThemeConfig;
  toggleTheme: (payload?: string) => void;
  toggleMenu: (payload?: string) => void;
  toggleLayout: (payload?: string) => void;
  toggleRTL: (payload?: string) => void;
  toggleAnimation: (payload?: string) => void;
  toggleNavbar: (payload?: string) => void;
  toggleSemidark: (payload?: boolean | string) => void;
  toggleSidebar: () => void;
  resetToggleSidebar: () => void;
}

const defaultThemeConfig: ThemeConfig = {
  isDarkMode: false,
  sidebar: false,
  theme: 'light',
  menu: 'vertical',
  layout: 'full',
  rtlClass: 'ltr',
  animation: '',
  navbar: 'navbar-sticky',
  locale: 'en',
  semidark: false,
  languageList: [
    { code: 'zh', name: 'Chinese' },
    { code: 'da', name: 'Danish' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'es', name: 'Spanish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ae', name: 'Arabic' },
  ],
};

const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined);

export function useThemeConfig() {
  const context = useContext(ThemeConfigContext);
  if (context === undefined) {
    throw new Error('useThemeConfig must be used within a ThemeConfigProvider');
  }
  return context;
}

export function ThemeConfigProvider({ children }: { children: ReactNode }) {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const savedMenu = localStorage.getItem('menu') || 'vertical';
      const savedLayout = localStorage.getItem('layout') || 'full';
      const savedRtlClass = localStorage.getItem('rtlClass') || 'ltr';
      const savedAnimation = localStorage.getItem('animation') || '';
      const savedNavbar = localStorage.getItem('navbar') || 'navbar-sticky';
      const savedSemidark = localStorage.getItem('semidark') === 'true';

      let isDarkMode = false;
      if (savedTheme === 'dark') {
        isDarkMode = true;
      } else if (savedTheme === 'system') {
        isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setThemeConfig({
        ...defaultThemeConfig,
        theme: savedTheme,
        menu: savedMenu,
        layout: savedLayout,
        rtlClass: savedRtlClass,
        animation: savedAnimation,
        navbar: savedNavbar,
        semidark: savedSemidark,
        isDarkMode,
      });

      // Apply initial theme
      if (isDarkMode) {
        document.querySelector('body')?.classList.add('dark');
      } else {
        document.querySelector('body')?.classList.remove('dark');
      }

      // Apply RTL
      document.querySelector('html')?.setAttribute('dir', savedRtlClass);

      setIsInitialized(true);
    }
  }, []);

  const toggleTheme = (payload?: string) => {
    const newTheme = payload || themeConfig.theme;
    localStorage.setItem('theme', newTheme);

    let isDarkMode = false;
    if (newTheme === 'light') {
      isDarkMode = false;
    } else if (newTheme === 'dark') {
      isDarkMode = true;
    } else if (newTheme === 'system') {
      isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDarkMode) {
      document.querySelector('body')?.classList.add('dark');
    } else {
      document.querySelector('body')?.classList.remove('dark');
    }

    setThemeConfig((prev) => ({ ...prev, theme: newTheme, isDarkMode }));
  };

  const toggleMenu = (payload?: string) => {
    const newMenu = payload || themeConfig.menu;
    localStorage.setItem('menu', newMenu);
    setThemeConfig((prev) => ({ ...prev, menu: newMenu }));
  };

  const toggleLayout = (payload?: string) => {
    const newLayout = payload || themeConfig.layout;
    localStorage.setItem('layout', newLayout);
    setThemeConfig((prev) => ({ ...prev, layout: newLayout }));
  };

  const toggleRTL = (payload?: string) => {
    const newRtlClass = payload || themeConfig.rtlClass;
    localStorage.setItem('rtlClass', newRtlClass);
    document.querySelector('html')?.setAttribute('dir', newRtlClass);
    setThemeConfig((prev) => ({ ...prev, rtlClass: newRtlClass }));
  };

  const toggleAnimation = (payload?: string) => {
    const newAnimation = payload?.trim() || themeConfig.animation;
    localStorage.setItem('animation', newAnimation);
    setThemeConfig((prev) => ({ ...prev, animation: newAnimation }));
  };

  const toggleNavbar = (payload?: string) => {
    const newNavbar = payload || themeConfig.navbar;
    localStorage.setItem('navbar', newNavbar);
    setThemeConfig((prev) => ({ ...prev, navbar: newNavbar }));
  };

  const toggleSemidark = (payload?: boolean | string) => {
    const newSemidark = payload === true || payload === 'true';
    localStorage.setItem('semidark', String(newSemidark));
    setThemeConfig((prev) => ({ ...prev, semidark: newSemidark }));
  };

  const toggleSidebar = () => {
    setThemeConfig((prev) => ({ ...prev, sidebar: !prev.sidebar }));
  };

  const resetToggleSidebar = () => {
    setThemeConfig((prev) => ({ ...prev, sidebar: false }));
  };

  // Don't render children until initialized to avoid hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeConfigContext.Provider
      value={{
        themeConfig,
        toggleTheme,
        toggleMenu,
        toggleLayout,
        toggleRTL,
        toggleAnimation,
        toggleNavbar,
        toggleSemidark,
        toggleSidebar,
        resetToggleSidebar,
      }}
    >
      {children}
    </ThemeConfigContext.Provider>
  );
}
