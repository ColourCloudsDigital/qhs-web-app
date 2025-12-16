import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/public/settings/cookies
 * Public route to fetch cookie settings
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch cookie settings
    const [cookieSettings] = await pool.query<RowDataPacket[]>(`
      SELECT 
        bannerTitle, bannerDescription, 
        necessaryCookiesDesc, preferenceCookiesDesc, statisticsCookiesDesc, marketingCookiesDesc,
        acceptAllButtonText, rejectAllButtonText, savePreferencesButtonText,
        cookiePolicyUrl, defaultConsent
      FROM cookie_settings 
      LIMIT 1
    `);
    
    // If no settings found, return default values
    if (!cookieSettings || cookieSettings.length === 0) {
      return NextResponse.json({
        bannerTitle: 'Cookie Consent',
        bannerDescription: 'We use cookies to enhance your browsing experience and provide personalized services.',
        necessaryCookiesDesc: 'These cookies are required for the website to function properly.',
        preferenceCookiesDesc: 'These cookies allow us to remember choices you make and provide enhanced features.',
        statisticsCookiesDesc: 'These cookies help us understand how visitors interact with our website.',
        marketingCookiesDesc: 'These cookies are used to track visitors across websites to display relevant advertisements.',
        acceptAllButtonText: 'Accept All',
        rejectAllButtonText: 'Reject All',
        savePreferencesButtonText: 'Save Preferences',
        cookiePolicyUrl: '/privacy',
        defaultConsent: JSON.stringify({ necessary: true, preferences: false, statistics: false, marketing: false })
      });
    }
    
    return NextResponse.json(cookieSettings[0]);
  } catch (error) {
    console.error('Error fetching cookie settings:', error);
    // Return default values in case of error
    return NextResponse.json({
      bannerTitle: 'Cookie Consent',
      bannerDescription: 'We use cookies to enhance your browsing experience and provide personalized services.',
      necessaryCookiesDesc: 'These cookies are required for the website to function properly.',
      preferenceCookiesDesc: 'These cookies allow us to remember choices you make and provide enhanced features.',
      statisticsCookiesDesc: 'These cookies help us understand how visitors interact with our website.',
      marketingCookiesDesc: 'These cookies are used to track visitors across websites to display relevant advertisements.',
      acceptAllButtonText: 'Accept All',
      rejectAllButtonText: 'Reject All',
      savePreferencesButtonText: 'Save Preferences',
      cookiePolicyUrl: '/privacy',
      defaultConsent: JSON.stringify({ necessary: true, preferences: false, statistics: false, marketing: false })
    });
  }
} 