'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Check, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CookieCategory = {
  id: string;
  name: string;
  description: string;
  isRequired?: boolean;
  isEnabled: boolean;
};

export type CookieSettings = {
  title: string;
  content: string;
  categories: CookieCategory[];
  acceptButtonText: string;
  rejectButtonText: string;
  settingsButtonText: string;
  saveButtonText: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  backgroundColorHex: string;
  textColorHex: string;
  accentColorHex: string;
};

const DEFAULT_SETTINGS: CookieSettings = {
  title: 'We value your privacy',
  content: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.',
  categories: [
    {
      id: 'necessary',
      name: 'Necessary',
      description: 'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website.',
      isRequired: true,
      isEnabled: true,
    },
    {
      id: 'preferences',
      name: 'Preferences',
      description: 'Preference cookies enable a website to remember information that changes the way the website behaves or looks.',
      isEnabled: false,
    },
    {
      id: 'statistics',
      name: 'Statistics',
      description: 'Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.',
      isEnabled: false,
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging.',
      isEnabled: false,
    },
  ],
  acceptButtonText: 'Accept All',
  rejectButtonText: 'Reject All',
  settingsButtonText: 'Cookie Settings',
  saveButtonText: 'Save Preferences',
  backgroundColorHex: '#ffffff',
  textColorHex: '#000000',
  accentColorHex: '#1e3a8a',
};

const COOKIE_CONSENT_KEY = 'qaras-cookie-consent';

interface CookieConsentDialogProps {
  settings?: Partial<CookieSettings>;
  onAccept?: (categories: string[]) => void;
  onReject?: () => void;
}

export default function CookieConsentDialog({
  settings = {},
  onAccept,
  onReject,
}: CookieConsentDialogProps) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('necessary');
  const [categories, setCategories] = useState<CookieCategory[]>([]);
  
  const mergedSettings: CookieSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    categories: settings.categories || DEFAULT_SETTINGS.categories,
  };

  // Initialize categories from settings
  useEffect(() => {
    setCategories(mergedSettings.categories);
  }, [mergedSettings.categories]);

  // Check if consent was already given
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setOpen(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const acceptedCategories = categories.map(cat => cat.id);
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        accepted: true,
        categories: acceptedCategories,
        timestamp: new Date().toISOString(),
      })
    );
    onAccept?.(acceptedCategories);
    setOpen(false);
  };

  const handleRejectAll = () => {
    const necessaryOnly = categories
      .filter(cat => cat.isRequired)
      .map(cat => cat.id);
    
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        accepted: false,
        categories: necessaryOnly,
        timestamp: new Date().toISOString(),
      })
    );
    onReject?.();
    setOpen(false);
  };

  const handleSavePreferences = () => {
    const acceptedCategories = categories
      .filter(cat => cat.isEnabled)
      .map(cat => cat.id);
    
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        accepted: true,
        categories: acceptedCategories,
        timestamp: new Date().toISOString(),
      })
    );
    onAccept?.(acceptedCategories);
    setOpen(false);
  };

  const toggleCategory = (categoryId: string, enabled: boolean) => {
    setCategories(
      categories.map(cat =>
        cat.id === categoryId && !cat.isRequired
          ? { ...cat, isEnabled: enabled }
          : cat
      )
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div 
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      ></div>
      
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 sm:relative",
          "z-50 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-lg sm:max-w-lg sm:rounded-lg",
          "border border-gray-200 shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700"
        )}
        style={{ 
          backgroundColor: mergedSettings.backgroundColorHex,
          color: mergedSettings.textColorHex,
        }}
      >
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold">{mergedSettings.title}</h2>
              <p className="text-sm">{mergedSettings.content}</p>
            </div>
            {showDetails && (
              <button
                onClick={() => setShowDetails(false)}
                className="absolute right-6 top-6 rounded-sm text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showDetails && (
            <div className="mt-6">
              <div className="flex space-x-2 border-b overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={cn(
                      "flex-none px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px",
                      activeTab === category.id
                        ? `border-primary text-primary`
                        : "border-transparent hover:border-gray-300"
                    )}
                    style={{
                      borderColor: activeTab === category.id ? mergedSettings.accentColorHex : 'transparent',
                      color: activeTab === category.id ? mergedSettings.accentColorHex : mergedSettings.textColorHex,
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              {categories.map(category => (
                <div 
                  key={category.id} 
                  className={cn(
                    "mt-4 space-y-4", 
                    activeTab !== category.id && "hidden"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{category.name}</h4>
                      <p className="text-sm opacity-70">{category.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        className="sr-only peer"
                        checked={category.isEnabled}
                        onChange={(e) => toggleCategory(category.id, e.target.checked)}
                        disabled={category.isRequired}
                      />
                      <div className={cn(
                        "w-11 h-6 bg-gray-200 rounded-full peer",
                        "peer-checked:after:translate-x-full peer-checked:after:border-white",
                        "after:content-[''] after:absolute after:top-0.5 after:left-[2px]",
                        "after:bg-white after:border-gray-300 after:border after:rounded-full",
                        "after:h-5 after:w-5 after:transition-all",
                        category.isRequired ? "opacity-60" : "",
                        category.isEnabled ? "bg-primary" : ""
                      )}
                      style={{
                        backgroundColor: category.isEnabled ? mergedSettings.accentColorHex : '#e5e7eb',
                      }}
                      ></div>
                    </label>
                  </div>
                </div>
              ))}

              <div className="mt-4 text-sm flex gap-4">
                {mergedSettings.privacyPolicyUrl && (
                  <Link 
                    href={mergedSettings.privacyPolicyUrl}
                    className="hover:underline"
                    style={{ color: mergedSettings.accentColorHex }}
                  >
                    Privacy Policy
                  </Link>
                )}
                {mergedSettings.termsOfServiceUrl && (
                  <Link 
                    href={mergedSettings.termsOfServiceUrl}
                    className="hover:underline"
                    style={{ color: mergedSettings.accentColorHex }}
                  >
                    Terms of Service
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className={cn(
            "mt-6 flex gap-3 flex-wrap",
            showDetails ? "justify-end" : "justify-between"
          )}>
            {!showDetails ? (
              <>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  style={{ borderColor: mergedSettings.textColorHex }}
                >
                  {mergedSettings.rejectButtonText}
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDetails(true)}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    style={{ borderColor: mergedSettings.textColorHex }}
                  >
                    <Settings2 className="w-4 h-4 inline mr-1 -mt-0.5" />
                    {mergedSettings.settingsButtonText}
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm text-white border rounded-md"
                    style={{ 
                      backgroundColor: mergedSettings.accentColorHex,
                      borderColor: mergedSettings.accentColorHex 
                    }}
                  >
                    <Check className="w-4 h-4 inline mr-1 -mt-0.5" />
                    {mergedSettings.acceptButtonText}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm text-white border rounded-md"
                style={{ 
                  backgroundColor: mergedSettings.accentColorHex,
                  borderColor: mergedSettings.accentColorHex 
                }}
              >
                {mergedSettings.saveButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}