import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    // Return default theme settings
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
    }

    return NextResponse.json(defaultTheme)
  } catch (error) {
    console.error('Error fetching theme settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' },
      { status: 500 }
    )
  }
}
