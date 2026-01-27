import { Metadata } from 'next'
import { StaffCustomersClient } from './components/StaffCustomersClient'

export const metadata: Metadata = {
  title: 'Customers | Staff Dashboard',
  description: 'Manage hotel customers and guest information',
}

export default function StaffCustomersPage() {
  return <StaffCustomersClient />
}