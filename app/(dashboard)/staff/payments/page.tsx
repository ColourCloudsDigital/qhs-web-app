import { Metadata } from 'next'
import { StaffPaymentsClient } from './components/StaffPaymentsClient'

export const metadata: Metadata = {
  title: 'Payments | Staff Dashboard',
  description: 'Manage hotel payments and transactions',
}

export default function StaffPaymentsPage() {
  return <StaffPaymentsClient />
}