import '../../styles/tailwind.css';
import { Nunito } from 'next/font/google';
import { ToastProvider } from '@/components/providers/toast-provider';
import ThemeProvider from '@/components/providers/theme-provider';
import Script from 'next/script';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

const nunito = Nunito({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

export const metadata = {
  title: 'Qaras Hotels - Hotel Booking & Management Platform',
  description: 'Find and book the best hotels for your next trip. Hotel owners can manage their properties efficiently.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="handle-chunk-error" strategy="beforeInteractive">
        {`
          window.addEventListener('error', function(e) {
            if (e.message && e.message.includes('Loading chunk') && e.message.includes('failed')) {
              console.log('Handling chunk loading error');
              if (window.location.pathname.includes('marketing')) {
                window.location.href = '/marketing';
              }
            }
          });
        `}
      </Script>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}