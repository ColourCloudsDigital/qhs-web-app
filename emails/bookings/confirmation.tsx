import React from 'react';
import { Text, Button, Section, Row, Column, Link } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface BookingConfirmationProps {
  name: string;
  bookingId: string;
  hotelName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  numberOfGuests: number;
  bookingDetailsUrl: string;
}

export default function BookingConfirmation({
  name,
  bookingId,
  hotelName,
  roomType,
  checkInDate,
  checkOutDate,
  totalAmount,
  numberOfGuests,
  bookingDetailsUrl,
}: BookingConfirmationProps) {
  return (
    <EmailLayout
      preview={`Booking Confirmation - ${hotelName}`}
      heading="Booking Confirmation"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          Thank you for booking with Qaras Hotels. Your reservation has been confirmed!
        </Text>
        
        <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <Text className="text-lg font-bold text-gray-800">Booking Details</Text>
          
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
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Guests:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{numberOfGuests}</Text>
            </Column>
          </Row>
          
          <Row className="mt-4">
            <Column className="w-40">
              <Text className="text-base font-bold text-gray-600">Total Amount:</Text>
            </Column>
            <Column>
              <Text className="text-base font-bold text-primary">{totalAmount}</Text>
            </Column>
          </Row>
        </Section>
        
        <Section className="my-8 text-center">
          <Button
            href={bookingDetailsUrl}
            className="rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            View Booking Details
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700">
          You can view and manage your booking anytime by logging into your account. If you need to make any changes to your reservation, please contact us at least 24 hours before your check-in date.
        </Text>
        
        <Text className="mt-6 text-base text-gray-700">
          We look forward to welcoming you to {hotelName}!
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hotels Team
        </Text>
      </Section>
    </EmailLayout>
  );
}