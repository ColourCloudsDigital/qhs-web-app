import React from 'react';
import { Text, Button, Section } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface ResetPasswordProps {
  name: string;
  resetUrl: string;
}

export default function ResetPassword({ name, resetUrl }: ResetPasswordProps) {
  return (
    <EmailLayout
      preview="Reset your Qaras Hotels password"
      heading="Reset Your Password"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          We received a request to reset your password for your Qaras Hotels account. 
          If you didn't make this request, you can safely ignore this email.
        </Text>
        
        <Text className="text-base text-gray-700">
          To reset your password, click the button below:
        </Text>
        
        <Section className="my-8 text-center">
          <Button
            href={resetUrl}
            className="rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            Reset Password
          </Button>
        </Section>
        
        <Text className="text-sm text-gray-600">
          Or copy and paste this URL into your browser: <br />
          <a href={resetUrl} className="text-primary underline">
            {resetUrl}
          </a>
        </Text>
        
        <Text className="text-base text-gray-700">
          This link will expire in 1 hour for security reasons.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hotels Team
        </Text>
      </Section>
    </EmailLayout>
  );
}