import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans | Qaras Hospitality Solutions',
  description: 'Choose the perfect subscription plan for your hotel management needs',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable cache for this page

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 