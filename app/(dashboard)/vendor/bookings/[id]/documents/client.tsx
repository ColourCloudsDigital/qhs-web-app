'use client';

import { useState } from 'react';
import BookingDocuments from '../../../components/BookingDocuments';

interface DocumentsPageClientProps {
  bookingId: string;
}

export default function DocumentsPageClient({ bookingId }: DocumentsPageClientProps) {
  return <BookingDocuments bookingId={bookingId} />;
} 