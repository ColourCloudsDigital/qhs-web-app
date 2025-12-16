import React from 'react';
import { Text, Button, Section, Row, Column, Hr } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface SubscriptionConfirmationProps {
  name: string;
  planName: string;
  planPrice: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  features: string[];
  dashboardUrl: string;
}

export default function SubscriptionConfirmation({
  name,
  planName,
  planPrice,
  billingCycle,
  startDate,
  endDate,
  features,
  dashboardUrl,
}: SubscriptionConfirmationProps) {
  return (
    <EmailLayout
      preview={`Subscription Confirmation - ${planName} Plan`}
      heading="Subscription Confirmation"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          Thank you for subscribing to the {planName} plan on Qaras Hotels. Your subscription has been activated successfully!
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
              <Text className="text-sm font-semibold text-gray-600">Price:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{planPrice} / {billingCycle}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Start Date:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{startDate}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">End Date:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{endDate}</Text>
            </Column>
          </Row>
        </Section>
        
        <Hr className="my-6 border-t-2 border-gray-200" />
        
        <Text className="text-lg font-bold text-gray-800">Plan Features</Text>
        <ul>
          {features.map((feature, index) => (
            <li key={index} className="my-1 text-base text-gray-700">
              {feature}
            </li>
          ))}
        </ul>
        
        <Section className="my-8 text-center">
          <Button
            href={dashboardUrl}
            className="rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            Go to Dashboard
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700">
          You can manage your subscription, view billing history, and access all the features included in your plan from your vendor dashboard.
        </Text>
        
        <Text className="mt-6 text-base text-gray-700">
          If you have any questions about your subscription or need assistance with any of the features, please don't hesitate to contact our support team.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hotels Team
        </Text>
      </Section>
    </EmailLayout>
  );
}