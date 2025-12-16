import React from 'react';
import { Text, Button, Section, Row, Column } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface SubscriptionExpiringProps {
  name: string;
  planName: string;
  expiryDate: string;
  daysLeft: number;
  renewalUrl: string;
  planUpgradeUrl: string;
}

export default function SubscriptionExpiring({
  name,
  planName,
  expiryDate,
  daysLeft,
  renewalUrl,
  planUpgradeUrl,
}: SubscriptionExpiringProps) {
  return (
    <EmailLayout
      preview={`Your ${planName} subscription is expiring soon`}
      heading="Subscription Expiring Soon"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          This is a friendly reminder that your {planName} subscription on Qaras Hotels will expire in {daysLeft} days on {expiryDate}.
        </Text>
        
        <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <Text className="text-lg font-bold text-gray-800">Subscription Details</Text>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Plan:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{planName}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Expiry Date:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{expiryDate}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Days Left:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{daysLeft}</Text>
            </Column>
          </Row>
        </Section>
        
        <Text className="text-base text-gray-700">
          To ensure uninterrupted access to all the features and services included in your plan, please renew your subscription before the expiration date.
        </Text>
        
        <Text className="text-base text-gray-700">
          If you've enjoyed your experience with Qaras Hotels, you might also consider upgrading to a higher tier plan for additional benefits and features.
        </Text>
        
        <Section className="my-8 text-center">
          <Button
            href={renewalUrl}
            className="mx-2 rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            Renew Subscription
          </Button>
          <Button
            href={planUpgradeUrl}
            className="mx-2 rounded-md bg-gray-700 px-6 py-3 text-center text-base font-medium text-white"
          >
            Explore Plan Options
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700">
          If your subscription expires, your hotels and listings will become inactive and you'll lose access to premium features. However, your data will be retained for up to 30 days, so you can easily reactivate your account by renewing your subscription.
        </Text>
        
        <Text className="mt-6 text-base text-gray-700">
          If you have any questions about your subscription or need assistance with the renewal process, please contact our support team.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hotels Team
        </Text>
      </Section>
    </EmailLayout>
  );
}