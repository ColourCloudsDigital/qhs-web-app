import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { formatDate } from '@/lib/utils';

interface LegalDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  effectiveDate: string;
  updatedAt: string;
}

interface LegalPageProps {
  params: {
    slug: string;
  };
}

// Use generateMetadata to set dynamic page metadata
export async function generateMetadata(
  { params }: LegalPageProps
): Promise<Metadata> {
  // Fetch the document
  const document = await getLegalDocument(params.slug);
  
  // Return 404 if not found
  if (!document) {
    return {
      title: 'Document Not Found',
    };
  }

  return {
    title: document.title,
    description: `${document.title} - Version ${document.version} - Last updated: ${formatDate(document.updatedAt)}`,
  };
}

async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/legal/${slug}`, { 
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch legal document: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching legal document:', error);
    return null;
  }
}

export default async function LegalPage({ params }: LegalPageProps) {
  const document = await getLegalDocument(params.slug);
  
  if (!document) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{document.title}</h1>
        <div className="text-sm text-gray-500">
          <p>Version {document.version}</p>
          <p>Effective Date: {formatDate(document.effectiveDate)}</p>
          <p>Last Updated: {formatDate(document.updatedAt)}</p>
        </div>
      </div>
      
      <div className="prose prose-lg mx-auto dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: document.content }} />
      </div>
    </div>
  );
}