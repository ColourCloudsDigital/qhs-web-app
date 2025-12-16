'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterHandle: string;
  canonicalUrl: string;
  robotsTxt: string;
  structuredData: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  children?: React.ReactNode;
}

export default function SEO({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage,
  children,
}: SEOProps) {
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  // Fetch SEO settings from API
  useEffect(() => {
    const fetchSEOSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/seo');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching SEO settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSEOSettings();
  }, []);
  
  if (isLoading) return null;
  
  // Use provided props or fall back to settings from API
  const pageTitle = title || settings?.metaTitle || 'Qaras Hotels';
  const pageDescription = description || settings?.metaDescription || 'Book hotels online with Qaras Hotels';
  const pageKeywords = keywords || settings?.metaKeywords || 'hotels, booking, accommodation';
  const pageOgTitle = title || settings?.ogTitle || settings?.metaTitle || 'Qaras Hotels';
  const pageOgDescription = description || settings?.ogDescription || settings?.metaDescription || 'Book hotels online with Qaras Hotels';
  const pageOgImage = ogImage || settings?.ogImage || '/images/og-image.jpg';
  
  // Construct canonical URL if provided in settings
  const baseUrl = settings?.canonicalUrl?.endsWith('/') 
    ? settings.canonicalUrl.slice(0, -1) 
    : settings?.canonicalUrl || '';
  const canonicalUrl = baseUrl ? `${baseUrl}${pathname}` : '';
  
  // Parse structured data if provided
  let structuredData;
  if (settings?.structuredData) {
    try {
      structuredData = JSON.parse(settings.structuredData);
    } catch (e) {
      console.error('Error parsing structured data:', e);
    }
  }
  
  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {pageKeywords && <meta name="keywords" content={pageKeywords} />}
      
      {/* Open Graph tags */}
      <meta property="og:title" content={pageOgTitle} />
      <meta property="og:description" content={pageOgDescription} />
      <meta property="og:type" content={ogType} />
      {pageOgImage && <meta property="og:image" content={pageOgImage} />}
      {pathname && <meta property="og:url" content={`${baseUrl}${pathname}`} />}
      
      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      {settings?.twitterHandle && <meta name="twitter:site" content={settings.twitterHandle} />}
      <meta name="twitter:title" content={pageOgTitle} />
      <meta name="twitter:description" content={pageOgDescription} />
      {pageOgImage && <meta name="twitter:image" content={pageOgImage} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Structured data */}
      {structuredData && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
        />
      )}
      
      {/* Analytics */}
      {settings?.googleAnalyticsId && (
        <>
          <script 
            async 
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}');
              `,
            }}
          />
        </>
      )}
      
      {/* Google Tag Manager */}
      {settings?.googleTagManagerId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${settings.googleTagManagerId}');
            `,
          }}
        />
      )}
      
      {children}
    </Head>
  );
} 