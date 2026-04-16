import { Metadata } from 'next';
import PaymentVerifyClient from './client';

export const metadata: Metadata = {
  title: 'Verifying Payment | Qaras Hospitality Solutions',
  description: 'Verifying your payment...',
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PaymentVerifyPage({ searchParams }: PageProps) {
  // Get the payment reference from query parameters
  const reference = 
    typeof searchParams.reference === 'string' 
      ? searchParams.reference 
      : Array.isArray(searchParams.reference) 
        ? searchParams.reference[0]
        : undefined;
  
  // Get payment status (if any)
  const status = 
    typeof searchParams.status === 'string' 
      ? searchParams.status 
      : Array.isArray(searchParams.status) 
        ? searchParams.status[0]
        : undefined;
  
  return <PaymentVerifyClient reference={reference} status={status} />;
}