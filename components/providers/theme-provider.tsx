'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Head from 'next/head';

interface ThemeContextType {
  theme: any;
  isLoading: boolean;
}

const defaultTheme = {
  colorPalette: {
    primary: '#1e40af',
    secondary: '#4b5563',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: null,
  },
  buttons: {
    borderRadius: '0.375rem',
    primaryBackground: '#1e40af',
    primaryText: '#ffffff',
    secondaryBackground: '#4b5563',
    secondaryText: '#ffffff',
  },
  layout: {
    containerWidth: '1200px',
    sidebarWidth: '250px',
  },
  customCSS: null,
  logoUrl: null,
  faviconUrl: null,
  loginBannerUrl: null,
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<any>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Fetch theme settings from API
    const fetchTheme = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/public/settings/theme');
        
        if (response.ok) {
          const data = await response.json();
          
          // Create a theme object from the data - the API now returns data in our expected format
          const fetchedTheme = {
            colorPalette: data.colorPalette || defaultTheme.colorPalette,
            typography: data.typography || defaultTheme.typography,
            buttons: data.buttons || defaultTheme.buttons,
            layout: data.layout || defaultTheme.layout,
            customCSS: data.customCSS || null,
            logoUrl: data.logoUrl || null,
            faviconUrl: data.faviconUrl || null,
            loginBannerUrl: data.loginBannerUrl || null,
          };
          
          setTheme(fetchedTheme);
        } else {
          console.error('Failed to fetch theme settings, status:', response.status);
          // Fall back to default theme if there's an error
          setTheme(defaultTheme);
        }
      } catch (error) {
        console.error('Error fetching theme settings:', error);
        // Fall back to default theme if there's an error
        setTheme(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, [pathname]);

  // Generate CSS variables from theme
  const generateCSSVariables = () => {
    if (!theme || !theme.colorPalette) return '';

    return `
      :root {
        --color-primary: ${theme.colorPalette.primary};
        --color-secondary: ${theme.colorPalette.secondary};
        --color-accent: ${theme.colorPalette.accent};
        --color-background: ${theme.colorPalette.background};
        --color-text: ${theme.colorPalette.text};
        --color-success: ${theme.colorPalette.success};
        --color-warning: ${theme.colorPalette.warning};
        --color-error: ${theme.colorPalette.error};
        --color-info: ${theme.colorPalette.info};
        --button-radius: ${theme.buttons?.borderRadius || '0.375rem'};
        --font-family: ${theme.typography?.fontFamily || 'Inter, system-ui, sans-serif'};
        --heading-font-family: ${theme.typography?.headingFontFamily || theme.typography?.fontFamily || 'Inter, system-ui, sans-serif'};
        --container-width: ${theme.layout?.containerWidth || '1200px'};
        --sidebar-width: ${theme.layout?.sidebarWidth || '250px'};
      }
      
      ${theme.customCSS || ''}
    `;
  };

  return (
    <ThemeContext.Provider value={{ theme, isLoading }}>
      <Head>
        {theme.faviconUrl && <link rel="icon" href={theme.faviconUrl} />}
        <style>{generateCSSVariables()}</style>
      </Head>
      {children}
    </ThemeContext.Provider>
  );
}