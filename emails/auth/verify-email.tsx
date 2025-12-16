import React from 'react';
import { Text, Button, Section } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface VerifyEmailProps {
  name: string;
  verificationUrl: string;
}

export default function VerifyEmail({ name, verificationUrl }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Verify your email address for Qaras Hotels"
      heading="Verify Your Email Address"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          Thank you for registering with Qaras Hotels. Please verify your email address by clicking the button below:
        </Text>
        
        <Section className="my-8 text-center">
          <Button
            href={verificationUrl}
            className="rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            Verify Email Address
          </Button>
        </Section>
        
        <Text className="text-sm text-gray-600">
          Or copy and paste this URL into your browser: <br />
          <a href={verificationUrl} className="text-primary underline">
            {verificationUrl}
          </a>
        </Text>
        
        <Text className="text-base text-gray-700">
          This link will expire in 24 hours. If you didn't request this verification, you can safely ignore this email.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hotels Team
        </Text>
      </Section>
    </EmailLayout>
  );
}