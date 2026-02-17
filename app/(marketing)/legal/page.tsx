import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';

interface LegalDocument {
  id: string;
  type: string;
  title: string;
  slug: string;
  effectiveDate: string;
  updatedAt: string;
  version: string;
}

export const metadata: Metadata = {
  title: 'Legal Documents',
  description: 'View our legal documents including Privacy Policy, Terms of Service, and more.',
};

async function getLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/legal`, { 
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch legal documents: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return [];
  }
}

export default async function LegalDocumentsPage() {
  const documents = await getLegalDocuments();

  const documentTypeMap: Record<string, string> = {
    'PRIVACY_POLICY': 'Privacy Policy',
    'TERMS_OF_SERVICE': 'Terms of Service',
    'COOKIE_POLICY': 'Cookie Policy',
    'REFUND_POLICY': 'Refund Policy',
    'USER_AGREEMENT': 'User Agreement'
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Legal Documents</h1>
        <p className="text-muted-foreground">
          Our legal documents that govern the use of our services
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No documents available</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            We&apos;re currently updating our legal documents. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link 
              key={doc.id} 
              href={`/legal/${doc.slug}`} 
              className="block transition-all hover:no-underline"
            >
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription>
                    {documentTypeMap[doc.type] || doc.type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Version {doc.version}</p>
                    <p>Last updated: {formatDate(doc.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}