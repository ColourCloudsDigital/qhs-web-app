import React from 'react';
import { Text, Button, Section, Row, Column } from '@react-email/components';
import EmailLayout from '../templates/layout';

interface CheckInReminderProps {
  name: string;
  bookingId: string;
  hotelName: string;
  roomType: string;
  checkInDate: string;
  checkInTime: string;
  hotelAddress: string;
  bookingDetailsUrl: string;
  mapUrl: string;
}

export default function CheckInReminder({
  name,
  bookingId,
  hotelName,
  roomType,
  checkInDate,
  checkInTime,
  hotelAddress,
  bookingDetailsUrl,
  mapUrl,
}: CheckInReminderProps) {
  return (
    <EmailLayout
      preview={`Your stay at ${hotelName} is coming up!`}
      heading="Check-in Reminder"
    >
      <Section>
        <Text className="text-base text-gray-700">
          Hello {name},
        </Text>
        
        <Text className="text-base text-gray-700">
          This is a friendly reminder that your stay at {hotelName} is coming up soon. We're looking forward to your arrival!
        </Text>
        
        <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <Text className="text-lg font-bold text-gray-800">Check-in Information</Text>
          
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
              <Text className="text-sm font-semibold text-gray-600">Check-in Date:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{checkInDate}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Check-in Time:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{checkInTime}</Text>
            </Column>
          </Row>
          
          <Row className="my-2">
            <Column className="w-40">
              <Text className="text-sm font-semibold text-gray-600">Address:</Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-800">{hotelAddress}</Text>
            </Column>
          </Row>
        </Section>
        
        <Text className="text-base text-gray-700">
          Please remember to bring a valid photo ID and the credit card used for booking. If you need directions to the hotel, you can use the map link below.
        </Text>
        
        <Section className="my-8 text-center">
          <Button
            href={mapUrl}
            className="mx-2 rounded-md bg-gray-700 px-6 py-3 text-center text-base font-medium text-white"
          >
            Get Directions
          </Button>
          <Button
            href={bookingDetailsUrl}
            className="mx-2 rounded-md bg-primary px-6 py-3 text-center text-base font-medium text-white"
          >
            View Booking Details
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700">
          If you need to make any changes to your reservation or have special requests, please contact us as soon as possible.
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