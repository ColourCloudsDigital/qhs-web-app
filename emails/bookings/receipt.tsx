import React from 'react';
import { Text, Button, Section, Row, Column, Hr } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface PaymentReceiptProps {
  name: string;
  bookingId: string;
  hotelName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  paymentId: string;
  paymentDate: string;
  paymentMethod: string;
  receiptUrl: string;
}

export default function PaymentReceipt({
  name,
  bookingId,
  hotelName,
  roomType,
  checkInDate,
  checkOutDate,
  totalAmount,
  paymentId,
  paymentDate,
  paymentMethod,
  receiptUrl,
}: PaymentReceiptProps) {
  return (
    <EmailLayout
      preview={`Payment Receipt - ${hotelName}`}
      heading="Payment Receipt"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          Thank you for your payment. This email serves as your receipt for your booking at {hotelName}.
        </Text>
        
        <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <Text className="text-lg font-bold text-gray-800">Payment Details</Text>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Payment ID:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{paymentId}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Date:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{paymentDate}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Method:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{paymentMethod}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Amount:</Text>
            </Column>
            <Column>
              <Text className="text-sm font-bold text-primary">{totalAmount}</Text>
            </Column>
          </Row>
        </Section>
        
        <Hr className="my-6 border-t-2 border-gray-200" />
        
        <Section>
          <Text className="text-lg font-bold text-gray-800">Booking Information</Text>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Booking ID:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{bookingId}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Hotel:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{hotelName}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Room Type:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{roomType}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Check-in:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{checkInDate}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Check-out:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{checkOutDate}</Text>
            </Column>
          </Row>
        </Section>
        
        <Section className="my-8 text-center">
          <Button
            href={receiptUrl}
            className="rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            View Full Receipt
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700">
          This receipt has been automatically generated. If you have any questions about your payment or booking, please contact our customer support.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hotels Team
        </Text>
      </Section>
    </EmailLayout>
  );
}