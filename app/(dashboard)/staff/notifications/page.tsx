import { Metadata } from 'next'
import { StaffNotificationsClient } from './components/StaffNotificationsClient'

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'View and manage your notifications',
}

export default function StaffNotificationsPage() {
  return <StaffNotificationsClient />
}