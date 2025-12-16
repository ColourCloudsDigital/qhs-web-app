import { UserRole } from '@/lib/types/enums';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  isMaintenanceMode: boolean;
  maintenanceMessage: string | null;
  currencyCode: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string | null;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string | null;
  googleAnalyticsId: string | null;
  googleSiteVerification: string | null;
  enableSitemap: boolean;
  enableRobotsTxt: boolean;
  enableStructuredData: boolean;
  customMetaTags: Array<{ name: string; content: string }>;
}

export interface CookieSettings {
  enableCookieConsent: boolean;
  cookieConsentTitle: string;
  cookieConsentDescription: string;
  necessaryCookiesDescription: string;
  analyticsCookiesDescription: string;
  marketingCookiesDescription: string;
  functionalCookiesDescription: string;
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  acceptButtonText: string;
  rejectButtonText: string;
  customizeButtonText: string;
  savePreferencesButtonText: string;
  cookieExpireDays: number;
}

export interface PaymentSettings {
  availableGateways: Array<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER' | 'CASH'>;
  defaultGateway: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER' | 'CASH';
  defaultTaxRate: number;
  defaultCommissionRate: number;
  showPricesWithTax: boolean;
  allowPartialPayments: boolean;
  requirePaymentVerification: boolean;
  enableInvoices: boolean;
}

export interface PaystackSettings {
  publicKey: string;
  secretKey: string;
  isLive: boolean;
  webhookSecret: string | null;
  chargePercentage: number;
  additionalCharge: number;
}

export interface FlutterwaveSettings {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  isLive: boolean;
  webhookSecret: string | null;
  chargePercentage: number;
  additionalCharge: number;
}

export interface EmailSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enableEmailVerification: boolean;
  enableWelcomeEmail: boolean;
  enableBookingConfirmationEmail: boolean;
  enablePaymentConfirmationEmail: boolean;
  enableAdminNotificationEmail: boolean;
}

export interface AdminSecuritySettings {
  id?: string;
  passwordStrength: 'basic' | 'medium' | 'strong';
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  twoFactorRequiredFor: Array<UserRole | string>;
  sessionTimeoutMinutes: number;
  rememberMeDays: number;
  apiRateLimit: number;
  apiSecurityMode: 'standard' | 'enhanced' | 'strict';
  corsEnabled: boolean;
  corsAllowedDomains: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LegalDocumentSettings {
  documents: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    lastUpdated: string;
    requiresAcceptance: boolean;
    version: string;
  }>;
}

export interface ThemeSettings {
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily: string | null;
  };
  buttons: {
    borderRadius: string;
    primaryBackground: string;
    primaryText: string;
    secondaryBackground: string;
    secondaryText: string;
  };
  layout: {
    containerWidth: string;
    sidebarWidth: string;
  };
  customCSS: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  loginBannerUrl: string | null;
}