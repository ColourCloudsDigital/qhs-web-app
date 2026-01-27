import { Metadata } from 'next'
import { StaffReportsClient } from './components/StaffReportsClient'

export const metadata: Metadata = {
  title: 'Reports | Staff Dashboard',
  description: 'View hotel reports and analytics',
}

export default function StaffReportsPage() {
  return <StaffReportsClient />
}