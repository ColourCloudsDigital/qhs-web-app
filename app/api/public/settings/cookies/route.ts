import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    // Return default cookie settings
    const defaultCookieSettings = {
      bannerTitle: 'Cookie Consent',
      bannerDescription: 'We use cookies to enhance your browsing experience and provide personalized services. By using our website, you agree to our use of cookies.',
      necessaryCookiesDesc: 'These cookies are required for the website to function properly.',
      preferenceCookiesDesc: 'These cookies allow us to remember choices you make and provide enhanced features.',
      statisticsCookiesDesc: 'These cookies help us understand how visitors interact with our website.',
      marketingCookiesDesc: 'These cookies are used to track visitors across websites to display relevant advertisements.',
      acceptAllButtonText: 'Accept All',
      rejectAllButtonText: 'Reject All',
      savePreferencesButtonText: 'Save Preferences',
      cookiePolicyUrl: '/privacy',
      defaultConsent: {
        necessary: true,
        preferences: false,
        statistics: false,
        marketing: false
      }
    }

    return NextResponse.json(defaultCookieSettings)
  } catch (error) {
    console.error('Error fetching cookie settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cookie settings' },
      { status: 500 }
    )
  }
}
