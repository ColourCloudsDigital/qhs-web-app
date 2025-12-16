import React from 'react';
import { Html, Head, Body, Container, Text, Tailwind, Heading, Hr, Link, Section, Preview } from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  footerText?: string;
}

export default function EmailLayout({
  preview,
  heading,
  children,
  footerText = '© Qaras Hotels. All rights reserved.',
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-600 rounded-lg bg-white p-8 shadow-lg">
            <Section className="mb-8 text-center">
              <Heading className="text-2xl font-bold text-primary">{heading}</Heading>
            </Section>
            
            <Section>
              {children}
            </Section>
            
            <Hr className="my-8 border-t-2 border-gray-200" />
            
            <Section className="text-center">
              <Text className="text-sm text-gray-500">{footerText}</Text>
              <Text className="text-sm text-gray-500">
                <Link href="https://qarashotels.com" className="text-primary underline">
                  Visit our website
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}