import { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import '@/styles/tailwind.css';
import { ThemeConfigProvider } from '@/contexts/ThemeConfigContext';

export const metadata: Metadata = {
  title: 'Qaras Hospitality Solutions - Authentication',
  description: 'Hotel booking and management platform',
};

const nunito = Nunito({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeConfigProvider>
      <div className={`${nunito.variable} min-h-screen bg-gray-100 font-sans dark:bg-gray-900`}>
        <div className="flex min-h-screen flex-col">
          <main className="flex-grow">{children}</main>
        </div>
      </div>
    </ThemeConfigProvider>
  );
}
