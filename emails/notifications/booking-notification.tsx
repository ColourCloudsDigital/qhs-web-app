import React from 'react';
import { Text, Button, Section, Row, Column } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface BookingNotificationProps {
  vendorName: string;
  hotelName: string;
  bookingId: string;
  guestName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: string;
  bookingDetailsUrl: string;
}

export default function BookingNotification({
  vendorName,
  hotelName,
  bookingId,
  guestName,
  roomType,
  checkInDate,
  checkOutDate,
  numberOfGuests,
  totalAmount,
  bookingDetailsUrl,
}: BookingNotificationProps) {
  return (
    <EmailLayout
      preview={`New Booking at ${hotelName}`}
      heading="New Booking Notification"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {vendorName},
        </Text>
        
        <Text className="text-base text-gray-700">
          Great news! You have received a new booking at {hotelName}.
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
              <Text className="text-sm font-semibold text-gray-600">Guest:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{guestName}</Text>
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
          Please review the booking details and ensure that all arrangements are in place for the guest's arrival. The room should be properly prepared and all the requested amenities should be available.
        </Text>
        
        <Text className="mt-6 text-base text-gray-700">
          You can manage this booking from your vendor dashboard, including sending welcome messages, updating room details, or handling special requests.
        </Text>
        
        <Text className="mt-8 text-base text-gray-700">
          Best regards,<br />
          The Qaras Hospitality Solutions Team
        </Text>
      </Section>
    </EmailLayout>
  );
}