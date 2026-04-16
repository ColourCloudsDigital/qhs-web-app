import React from 'react';
import { Text, Button, Section } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface WelcomeEmailProps {
  name: string;
  verificationUrl: string;
}

export default function WelcomeEmail({ name, verificationUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={`Welcome to Qaras Hospitality Solutions, ${name}!`}
      heading="Welcome to Qaras Hospitality Solutions!"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          Thank you for registering with Qaras Hospitality Solutions. We're excited to have you onboard!
        </Text>
        
        <Text className="text-base text-gray-700">
          Please verify your email address to get started. This helps secure your account and ensures we can reach you with important updates.
        </Text>
        
        <Section className="my-8 text-center">
          <Button
            href={verificationUrl}
            className="rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            Verify Email Address
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700">
          If you didn't create an account with us, you can safely ignore this email.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hospitality Solutions Team
        </Text>
      </Section>
    </EmailLayout>
  );
}