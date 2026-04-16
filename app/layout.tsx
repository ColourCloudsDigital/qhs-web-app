import AuthProvider from '@/components/providers/auth-provider';
import { Nunito } from 'next/font/google';
import 'react-perfect-scrollbar/dist/css/styles.css';
import '@/styles/tailwind.css';
import { ToastProvider } from '@/components/providers/toast-provider';
import CookieConsentProvider from '@/components/providers/CookieConsentProvider';
import ThemeProvider from '@/components/providers/theme-provider';
import { Metadata, Viewport } from 'next';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
// SEO component is handled client-side for dynamic settings

const nunito = Nunito({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

// Separate viewport settings from metadata (Next.js 14 requirement)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // Better for accessibility
  themeColor: '#4f46e5', // Move themeColor to viewport
};

export const metadata: Metadata = {
  title: {
    template: '%s | Qaras Hospitality Solutions',
    default: 'Qaras Hospitality Solutions - Hotel Management System',
  },
  description: 'Hotel management system for Qaras Hospitality Solutions',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Qaras Hospitality Solutions',
  },
  applicationName: 'Qaras Hospitality Solutions',
  formatDetection: {
    telephone: true,
  },
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/logo.png',
      sizes: '192x192',
    },
    {
      rel: 'shortcut icon',
      url: '/favicon.ico',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" crossOrigin="use-credentials" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={nunito.variable}>
        <ToastProvider>
          <ThemeProvider>
            <AuthProvider>
              <CookieConsentProvider>
                <div className="flex min-h-screen flex-col">
                  {/* Only render Navbar and Footer in route group layouts, not here */}
                    <main className="flex-grow">
                      {children}
                    </main>
                </div>
              </CookieConsentProvider>
            </AuthProvider>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}