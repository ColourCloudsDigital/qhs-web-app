'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import CookieConsentDialog, { CookieSettings, CookieCategory } from '@/components/common/CookieConsentDialog';

interface CookieConsentProviderProps {
  children: React.ReactNode;
}

interface CookieConsentContextType {
  cookieConsent: {
    accepted: boolean;
    categories: string[];
    timestamp: string;
  } | null;
  resetConsent: () => void;
  showConsentDialog: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

export default function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [cookieConsent, setCookieConsent] = useState<CookieConsentContextType['cookieConsent']>(null);
  const [cookieSettings, setCookieSettings] = useState<CookieSettings | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const COOKIE_CONSENT_KEY = 'qaras-cookie-consent';

  // Fetch cookie settings from API
  useEffect(() => {
    const fetchCookieSettings = async () => {
      try {
        const response = await fetch('/api/public/settings/cookies');
        
        if (response.ok) {
          const data = await response.json();
          
          // Default settings that will be overridden by API data
          const settings: CookieSettings = {
            title: data.bannerTitle || 'Cookie Consent',
            content: data.bannerDescription || 'We use cookies to enhance your browsing experience and provide personalized services. By using our website, you agree to our use of cookies.',
            categories: [
              {
                id: 'necessary',
                name: 'Necessary',
                description: data.necessaryCookiesDesc || 'These cookies are required for the website to function properly.',
                isRequired: true,
                isEnabled: true,
              },
              {
                id: 'preferences',
                name: 'Preferences',
                description: data.preferenceCookiesDesc || 'These cookies allow us to remember choices you make and provide enhanced features.',
                isEnabled: false,
              },
              {
                id: 'statistics',
                name: 'Statistics',
                description: data.statisticsCookiesDesc || 'These cookies help us understand how visitors interact with websites.',
                isEnabled: false,
              },
              {
                id: 'marketing',
                name: 'Marketing',
                description: data.marketingCookiesDesc || 'These cookies are used to track visitors across websites to display relevant advertisements.',
                isEnabled: false,
              },
            ],
            acceptButtonText: data.acceptAllButtonText || 'Accept All',
            rejectButtonText: data.rejectAllButtonText || 'Reject All',
            settingsButtonText: 'Cookie Settings',
            saveButtonText: data.savePreferencesButtonText || 'Save Preferences',
            privacyPolicyUrl: data.cookiePolicyUrl || '/privacy',
            termsOfServiceUrl: '/terms',
            backgroundColorHex: '#ffffff',
            textColorHex: '#111827',
            accentColorHex: '#1e40af',
          };
          
          // If there's default consent in the data, apply it
          if (data.defaultConsent) {
            try {
              const consent = typeof data.defaultConsent === 'string' 
                ? JSON.parse(data.defaultConsent) 
                : data.defaultConsent;
                
              // Update the enabled state based on defaultConsent
              settings.categories = settings.categories.map(cat => ({
                ...cat,
                isEnabled: cat.isRequired || consent[cat.id] === true
              }));
            } catch (e) {
              console.error('Error parsing default consent:', e);
            }
          }
          
          setCookieSettings(settings);
        } else {
          console.error('Failed to fetch cookie settings, status:', response.status);
          // Fallback to default settings if API fails
          setDefaultCookieSettings();
        }
      } catch (error) {
        console.error('Error fetching cookie settings:', error);
        setDefaultCookieSettings();
      }
    };
    
    const setDefaultCookieSettings = () => {
      // Default settings
      const settings: CookieSettings = {
        title: 'Cookie Consent',
        content: 'We use cookies to enhance your browsing experience and provide personalized services. By using our website, you agree to our use of cookies.',
        categories: [
          {
            id: 'necessary',
            name: 'Necessary',
            description: 'These cookies are required for the website to function properly.',
            isRequired: true,
            isEnabled: true,
          },
          {
            id: 'preferences',
            name: 'Preferences',
            description: 'These cookies allow us to remember choices you make and provide enhanced features.',
            isEnabled: false,
          },
          {
            id: 'statistics',
            name: 'Statistics',
            description: 'These cookies help us understand how visitors interact with our website.',
            isEnabled: false,
          },
          {
            id: 'marketing',
            name: 'Marketing',
            description: 'These cookies are used to track visitors across websites to display relevant advertisements.',
            isEnabled: false,
          },
        ],
        acceptButtonText: 'Accept All',
        rejectButtonText: 'Reject All',
        settingsButtonText: 'Cookie Settings',
        saveButtonText: 'Save Preferences',
        privacyPolicyUrl: '/privacy',
        termsOfServiceUrl: '/terms',
        backgroundColorHex: '#ffffff',
        textColorHex: '#111827',
        accentColorHex: '#1e40af',
      };
      
      setCookieSettings(settings);
    };
    
    fetchCookieSettings();
  }, []);

  // Check if consent was already given
  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (storedConsent) {
        setCookieConsent(JSON.parse(storedConsent));
      } else {
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error checking cookie consent:', error);
      // If there's an error (e.g., localStorage is disabled), show the dialog
      setShowDialog(true);
    }
  }, []);

  const handleAccept = (categories: string[]) => {
    const consent = {
      accepted: true,
      categories,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setCookieConsent(consent);
    setShowDialog(false);
    
    // Here you can also initialize analytics based on accepted categories
    if (categories.includes('statistics')) {
      // Initialize analytics like Google Analytics
      initializeAnalytics();
    }
    
    if (categories.includes('marketing')) {
      // Initialize marketing tools like Facebook Pixel
      initializeMarketingTools();
    }
  };

  const handleReject = () => {
    // Only accept necessary cookies
    const necessaryOnly = ['necessary'];
    const consent = {
      accepted: false,
      categories: necessaryOnly,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setCookieConsent(consent);
    setShowDialog(false);
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setCookieConsent(null);
    setShowDialog(true);
  };

  const showConsentDialog = () => {
    setShowDialog(true);
  };

  // Placeholder functions for analytics and marketing tools
  const initializeAnalytics = () => {
    // This would be where you initialize Google Analytics or similar
    console.log('Analytics initialized');
  };

  const initializeMarketingTools = () => {
    // This would be where you initialize Facebook Pixel or similar
    console.log('Marketing tools initialized');
  };

  return (
    <CookieConsentContext.Provider 
      value={{ 
        cookieConsent, 
        resetConsent,
        showConsentDialog
      }}
    >
      {children}
      {showDialog && (
        <CookieConsentDialog
          settings={cookieSettings || undefined}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </CookieConsentContext.Provider>
  );
}