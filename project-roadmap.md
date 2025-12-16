# Complete Development Roadmap with Auth & Email Templates

## Phase 0: Authentication & Email System (Week 1)

### 1. Authentication Pages
- ✅ `app/(auth)/login/page.tsx`: Login page
- ✅ `app/(auth)/register/page.tsx`: Registration page
- ✅ `app/(auth)/forgot-password/page.tsx`: Password recovery
- ✅ `app/(auth)/reset-password/[token]/page.tsx`: Password reset
- ✅ `app/(auth)/verify-email/[token]/page.tsx`: Email verification
- ✅ `lib/auth.ts`: NextAuth configuration
- ✅ `lib/services/auth.service.ts`: Authentication logic

## Database Updates:
- ✅ Add `SMTPConfiguration` model to Prisma schema

## Admin Dashboard:

- ✅ `app/(dashboard)/admin/settings/email/page.tsx`: SMTP configuration interface
- ✅ `components/admin/settings/SMTPConfigForm.tsx`: Config form component

Service Updates:

- ✅ Update lib/services/email.service.ts to retrieve SMTP settings from database
- ✅ Add lib/services/settings.service.ts for managing system settings

### 2. Email Template System
- ✅ `lib/services/email.service.ts`: Email sending service
- ✅ `emails/templates/layout.tsx`: Base email layout
- ✅ `emails/auth/welcome.tsx`: Welcome email
- ✅ `emails/auth/verify-email.tsx`: Email verification
- ✅ `emails/auth/reset-password.tsx`: Password reset
- ✅ `emails/bookings/confirmation.tsx`: Booking confirmation
- ✅ `emails/bookings/reminder.tsx`: Check-in reminder
- ✅ `emails/bookings/receipt.tsx`: Payment receipt
- ✅ `emails/vendor/subscription-confirmation.tsx`: Subscription confirmation
- ✅ `emails/vendor/subscription-expiring.tsx`: Subscription expiry reminder
- ✅ `emails/notifications/task-assigned.tsx`: Staff task assignment
- ✅ `emails/notifications/booking-notification.tsx`: New booking alert

## Phase 1: Booking System (Weeks 2-3)

### 1. API Development
- ✅ `app/api/rooms/route.ts`: GET/POST endpoints for rooms
- ✅ `app/api/rooms/[id]/route.ts`: GET/PUT/DELETE for single room
- ✅ `app/api/bookings/route.ts`: GET/POST endpoints
- ✅ `app/api/bookings/[id]/route.ts`: GET/PUT/DELETE for booking
- ✅ `app/api/bookings/[id]/status/route.ts`: Booking status updates
- ✅ `app/api/payments/route.ts`: Payment creation
- ✅ `app/api/payments/webhook/route.ts`: Payment gateway webhooks
- ✅ `lib/services/room.service.ts`: Room data operations
- ✅ `lib/services/booking.service.ts`: Booking business logic
- ✅ `lib/services/availability.service.ts`: Room availability checker
- ✅ `lib/services/payment.service.ts`: Payment processing logic
- ✅ `app/api/admin/settings/smtp/route.ts`: GET/PUT for SMTP configuration

### 2. Dashboard Components
- ✅ `app/(dashboard)/vendor/bookings/page.tsx`: Bookings list view
- ✅ `app/(dashboard)/vendor/bookings/[id]/page.tsx`: Booking details
- ✅ `app/(dashboard)/vendor/bookings/[id]/client.tsx`: Client-side component for booking details
- ✅ `app/(dashboard)/customer/bookings/page.tsx`: Customer bookings
- ✅ `app/(marketing)/hotels/[id]/book/page.tsx`: Booking form
- ✅ `components/booking/BookingForm.tsx`: Multi-step booking form
- ✅ `components/booking/RoomSelector.tsx`: Room selection component
- ✅ `components/booking/DateRangePicker.tsx`: Check-in/out selection
- ✅ `components/booking/PaymentForm.tsx`: Payment details form

### 3. Vendor Booking Components
- ✅ `app/(dashboard)/vendor/components/VendorBookingsHeader.tsx`: Header with search and filters
- ✅ `app/(dashboard)/vendor/components/BookingsAnalytics.tsx`: Dashboard analytics
- ✅ `app/(dashboard)/vendor/components/BookingsList.tsx`: Table listing of bookings
- ✅ `app/(dashboard)/vendor/components/BookingVisualGrid.tsx`: Visual room booking grid
- ✅ `app/(dashboard)/vendor/components/BookingStatusBadge.tsx`: Status indicator
- ✅ `app/(dashboard)/vendor/components/PaymentStatusBadge.tsx`: Payment status indicator
- ✅ `app/(dashboard)/vendor/components/BookingActionButtons.tsx`: Action buttons for bookings
- ✅ `app/(dashboard)/vendor/components/BookingStatusUpdateModal.tsx`: Status update modal
- ✅ `app/(dashboard)/vendor/components/BookingDetailHeader.tsx`: Detail page header
- ✅ `app/(dashboard)/vendor/components/CustomerInfoCard.tsx`: Customer information display
- ✅ `app/(dashboard)/vendor/components/BookingRoomDetails.tsx`: Room details component
- ✅ `app/(dashboard)/vendor/components/BookingPaymentDetails.tsx`: Payment details component
- ✅ `app/(dashboard)/vendor/components/BookingDocuments.tsx`: Document management component
- ✅ `app/(dashboard)/vendor/components/BookingNotes.tsx`: Notes and special requests component

### 4. Customer Booking Components
- ✅ `app/(dashboard)/customer/components/CustomerBookingsList.tsx`: Bookings list for customers
- ✅ `app/(dashboard)/customer/components/CustomerBookingsHeader.tsx`: Customer bookings header
- ✅ `app/(dashboard)/customer/components/CustomerBookingStats.tsx`: Customer booking statistics

## Phase 2: QR Menu Module (Week 4)

### 1. API Development
- ✅ `app/api/menus/route.ts`: GET/POST for menus
- ✅ `app/api/menus/[id]/route.ts`: GET/PUT/DELETE for menu
- ✅ `app/api/menus/[id]/qrcode/route.ts`: Generate QR code
- ✅ `app/api/qrcode/route.ts`: General QR code generation
- ✅ `app/api/menus/public/[qrId]/route.ts`: Public menu access endpoint
- ✅ `lib/services/menu.service.ts`: Menu management operations
- ✅ `lib/services/qrcode.service.ts`: QR code generation
- ✅ `lib/services/toast.service.ts`: Toast notification wrapper

### 2. Dashboard Components
- ✅ `app/(dashboard)/vendor/menus/page.tsx`: Menus list
- ✅ `app/(dashboard)/vendor/menus/new/page.tsx`: Create menu
- ✅ `app/(dashboard)/vendor/menus/[id]/page.tsx`: Edit menu
- ✅ `app/(dashboard)/vendor/menus/[id]/preview/page.tsx`: Preview menu
- ✅ `app/menu/[qrId]/page.tsx`: Public menu view page
- ✅ `components/dashboard/vendor/MenuBuilder.tsx`: Menu interface
- ✅ `components/dashboard/vendor/MenusList.tsx`: Menus list component
- ✅ `components/dashboard/vendor/QrCodeGenerator.tsx`: QR generation
- ✅ `components/dashboard/vendor/HotelSelector.tsx`: Hotel selector component

### 3. UI Components
- ✅ `components/ui/tabs.tsx`: Tabs component
- ✅ `components/ui/badge.tsx`: Badge component 
- ✅ `components/ui/dialog.tsx`: Dialog component
- ✅ `components/ui/dropdown-menu.tsx`: Dropdown menu component
- ✅ `components/ui/select.tsx`: Select component (updated)
- ✅ `components/ui/pagination.tsx`: Pagination component

## Phase 3: Subscription Management (Week 5)

### 1. API Development
- ✅ `app/api/subscriptions/plans/route.ts`: GET/POST for plans
- ✅ `app/api/subscriptions/plans/[id]/route.ts`: GET/PUT/DELETE for plans
- ✅ `app/api/subscriptions/vendor/route.ts`: Vendor subscriptions
- ✅ `app/api/modules/route.ts`: Module listing endpoint
- ✅ `lib/services/subscription.service.ts`: Subscription logic
- ✅ `lib/services/module-access.service.ts`: Module access control

### 2. Dashboard Components
- ✅ `app/(dashboard)/admin/subscriptions/page.tsx`: Plan management
- ✅ `app/(dashboard)/admin/subscriptions/new/page.tsx`: Create plan
- ✅ `app/(dashboard)/admin/subscriptions/[id]/page.tsx`: View plan details
- ✅ `app/(dashboard)/admin/subscriptions/[id]/edit/page.tsx`: Edit plan
- ✅ `app/(dashboard)/vendor/subscription/page.tsx`: Subscription management
- ✅ `app/(dashboard)/vendor/subscription/upgrade/page.tsx`: Upgrade flow
- ✅ `components/admin/subscriptions/PlanForm.tsx`: Plan creation form
- ✅ `components/dashboard/vendor/PlanComparison.tsx`: Plan comparison
- ✅ `app/(marketing)/pricing/page.tsx`: Public pricing page with real data

## Phase 4: WiFi Module (Week 6)

### 1. API Development
- ✅ `app/api/wifi/credentials/route.ts`: GET/POST for credentials
- ✅ `app/api/wifi/credentials/[id]/route.ts`: GET/PUT/DELETE for credential
- ✅ `app/api/hotels/[id]/wifi/configuration/route.ts`: WiFi config
- ✅ `lib/services/wifi.service.ts`: WiFi credential operations

### 2. Dashboard Components
- ✅ `app/(dashboard)/vendor/wifi/page.tsx`: WiFi management dashboard
- ✅ `app/(dashboard)/vendor/wifi/configuration/page.tsx`: Configuration
- ✅ `components/dashboard/vendor/wifi/CredentialsList.tsx`: Credentials list
- ✅ `components/dashboard/vendor/wifi/CredentialGenerator.tsx`: Generator

## Phase 5: Notification System (Week 7)

### 1. API Development
- ✅ `app/api/notifications/route.ts`: GET/POST for notifications
- ✅ `app/api/notifications/[id]/route.ts`: GET/PUT for notification
- ✅ `app/api/notifications/count/route.ts`: Get unread notification count
- ✅ `app/api/notifications/mark-all-read/route.ts`: Mark all notifications as read
- ✅ `app/api/notifications/settings/route.ts`: Notification preferences
- ✅ `app/api/push-subscriptions/route.ts`: Push subscription management
- ✅ `lib/services/notification.service.ts`: Notification operations
- ✅ `lib/services/push.service.ts`: Push notification delivery

### 2. Components
- ✅ `components/common/NotificationCenter.tsx`: Global notification UI
- ✅ `components/dashboard/NotificationList.tsx`: Notification list
- ✅ `components/dashboard/NotificationSettings.tsx`: Notification preferences
- ✅ `components/admin/notifications/SendNotificationForm.tsx`: Admin notification sending
- ✅ `components/client/NotificationPWASetup.tsx`: PWA push notification setup

### 3. Dashboard Pages
- ✅ `app/(dashboard)/admin/notifications/page.tsx`: Admin notifications list
- ✅ `app/(dashboard)/admin/notifications/settings/page.tsx`: Admin settings
- ✅ `app/(dashboard)/admin/notifications/send/page.tsx`: Send notifications page
- ✅ `app/(dashboard)/vendor/notifications/page.tsx`: Vendor notifications list
- ✅ `app/(dashboard)/vendor/notifications/settings/page.tsx`: Vendor settings
- ✅ `app/(dashboard)/customer/notifications/page.tsx`: Customer notifications list
- ✅ `app/(dashboard)/customer/notifications/settings/page.tsx`: Customer settings
- ✅ `app/(dashboard)/dashboard/notifications/pwa-setup/page.tsx`: PWA setup page

### 4. PWA Support
- ✅ `public/service-worker.js`: Service worker for push notifications
- ✅ `public/manifest.json`: PWA manifest

### 5. Database Schema
- ✅ Notification model
- ✅ NotificationPreference model
- ✅ PushSubscription model
- ✅ Enums for notification types, statuses, and recipients

## Phase 6: Keycard/RFID Module (Week 8)

### 1. API Development
- ✅ `app/api/keycards/route.ts`: GET/POST for keycards
- ✅ `app/api/keycards/[id]/route.ts`: GET/PUT/DELETE for keycard
- ✅ `app/api/keycards/[id]/assign/route.ts`: Assign to booking/room
- ✅ `app/api/locks/route.ts`: GET/POST for managing door locks
- ✅ `app/api/locks/[id]/route.ts`: GET/PUT/DELETE for single lock
- ✅ `app/api/locks/[id]/history/route.ts`: Lock access history tracking
- ✅ `lib/services/keycard.service.ts`: Keycard management logic
- ✅ `lib/services/lock.service.ts`: Lock management operations

### 2. Database Schema Updates
- ✅ Enhanced `Keycard` model with additional fields
- ✅ Added `Lock` model for door locks management
- ✅ Added `LockHistory` model for access tracking
- ✅ Added `LockError` model for maintenance tracking
- ✅ Added `KeycardType` enum for different card types

### 3. Dashboard Components
- ✅ `app/(dashboard)/vendor/keycards/page.tsx`: Keycard management 
- ✅ `components/dashboard/vendor/keycards/KeycardDashboardClient.tsx`: Client component for keycard dashboard
- ✅ `components/dashboard/vendor/keycards/KeycardManagement.tsx`: Keycards management interface
- ✅ `components/dashboard/vendor/keycards/LockManagement.tsx`: Lock management interface
- ✅ `components/dashboard/vendor/keycards/KeycardStats.tsx`: Stats for keycards dashboard
- ✅ `components/ui/loading-spinner.tsx`: Loading indicator component

### 4. Form Components
- ✅ `components/dashboard/vendor/keycards/KeycardRegisterForm.tsx`: Register new keycards
- ✅ `components/dashboard/vendor/keycards/KeycardConfigureForm.tsx`: Configure keycards with locks
- ✅ `components/dashboard/vendor/keycards/KeycardAssignForm.tsx`: Assign keycards to bookings/staff
- ✅ `components/dashboard/vendor/keycards/LockRegisterForm.tsx`: Register new locks
- ✅ `components/dashboard/vendor/keycards/LockUpdateForm.tsx`: Update lock details

### 5. Detail View Components
- ✅ `components/dashboard/vendor/keycards/KeycardDetailView.tsx`: Keycard details
- ✅ `components/dashboard/vendor/keycards/LockDetailView.tsx`: Lock details
- ✅ `components/dashboard/vendor/keycards/LockHistoryView.tsx`: Lock access history

## Phase 7: Facility Management - Completed Items
### API Development

- ✅ app/api/tasks/route.ts: GET/POST for facility tasks
- ✅ app/api/tasks/[id]/route.ts: GET/PUT/DELETE for task
- ✅ app/api/tasks/[id]/assign/route.ts: Assign to staff
- ✅ app/api/tasks/[id]/comments/route.ts: Task comments management
- ✅ app/api/tasks/[id]/checklist/[itemId]/route.ts: Checklist item management
- ✅ app/api/tasks/stats/route.ts: Task statistics endpoint
- ✅ lib/services/task.service.ts: Task management operations
- ✅ lib/utils/date.ts: Utility for handling recurring task scheduling

### Dashboard Components

- ✅ app/(dashboard)/vendor/facility/tasks/page.tsx: Task management dashboard for vendors
- ✅ app/(dashboard)/vendor/facility/components/TaskDashboardClient.tsx: Client component for task dashboard
- ✅ app/(dashboard)/vendor/facility/components/TaskList.tsx: Task list view
- ✅ app/(dashboard)/vendor/facility/components/TaskStatusBadge.tsx: Task status visual indicator
- ✅ app/(dashboard)/vendor/facility/components/TaskPriorityBadge.tsx: Task priority visual indicator
- ✅ app/(dashboard)/vendor/facility/components/TaskStatsCards.tsx: Task statistics display
- ✅ app/(dashboard)/vendor/facility/components/TaskFilters.tsx: Filtering for tasks
- ✅ app/(dashboard)/vendor/facility/components/TaskActionsMenu.tsx: Context menu for task actions
- ✅ app/(dashboard)/vendor/facility/components/CreateTaskModal.tsx: Modal for creating new tasks
- ✅ app/(dashboard)/vendor/facility/components/UpdateTaskStatusDialog.tsx: Dialog for updating task status
- ✅ app/(dashboard)/vendor/facility/components/AssignTaskDialog.tsx: Dialog for task assignment

### Staff Components

- ✅ app/(dashboard)/staff/tasks/page.tsx: Staff task management interface
- ✅ app/(dashboard)/staff/tasks/[id]/page.tsx: Task detail page for staff
- ✅ app/(dashboard)/staff/components/StaffTasksClient.tsx: Client component for staff tasks
- ✅ app/(dashboard)/staff/components/StaffTaskDetailClient.tsx: Task detail component for staff
- ✅ app/(dashboard)/staff/components/task/TaskHeader.tsx: Task header component
- ✅ app/(dashboard)/staff/components/task/TaskDetailsTab.tsx: Task details tab
- ✅ app/(dashboard)/staff/components/task/TaskChecklistTab.tsx: Task checklist tab
- ✅ app/(dashboard)/staff/components/task/TaskCommentsTab.tsx: Task comments tab

### UI Components

- ✅ components/ui/separator.tsx: UI component for visual separators
- ✅ components/ui/toast.tsx: Toast notification component
- ✅ components/ui/use-toast.ts: Hook for toast functionality
- ✅ components/providers/toast-provider.tsx: Toast provider component
- ✅ components/shared/SubscriptionRequired.tsx: Component for subscription access control

### Database Schema Updates

- ✅ prisma/migrations/20250314000000_facility_management/migration.sql: Migration for facility management
- ✅ Updated Prisma schema with facility management models:

- FacilityTask with improved fields
- TaskComment
- TaskChecklistItem
- MaintenancePart
- Inventory
- StaffPermission
- Asset

### Module Access Service

✅ lib/services/module-access.service.ts: Updated with canAccessModule function

## Phase 8: CCTV Module (Week 10)
## 1. API Development

- ✅ app/api/cctv/cameras/route.ts: GET/POST for cameras
- ✅ app/api/cctv/cameras/[id]/route.ts: GET/PUT/DELETE for camera
- ✅ app/api/cctv/streams/route.ts: Camera stream access
- ✅ app/api/cctv/cameras/[id]/ptz/route.ts: PTZ camera controls
- ✅ lib/services/cctv.service.ts: Camera management operations

## 2. Dashboard Components

- ✅ app/(dashboard)/vendor/cctv/page.tsx: Camera management
- ✅ app/(dashboard)/vendor/cctv/view/page.tsx: Live view interface
- ✅ app/(dashboard)/vendor/cctv/multi/page.tsx: Multi-camera view interface

## 3. Camera Management Components

- ✅ app/(dashboard)/vendor/cctv/components/CctvDashboardClient.tsx: Main dashboard client
- ✅ app/(dashboard)/vendor/cctv/components/CameraList.tsx: Camera listing with controls
- ✅ app/(dashboard)/vendor/cctv/components/CameraForm.tsx: Add/edit camera form

## 4. Camera View Components

- ✅ app/(dashboard)/vendor/cctv/view/components/CameraViewClient.tsx: Single view client
- ✅ app/(dashboard)/vendor/cctv/view/components/CameraStream.tsx: Stream renderer
- ✅ app/(dashboard)/vendor/cctv/view/components/CameraControls.tsx: PTZ controls interface
- ✅ app/(dashboard)/vendor/cctv/multi/components/MultiCameraViewClient.tsx: Multi-view client

## 5. Database Schema Updates

- ✅ Added Camera model for storing camera configurations
- ✅ Added CameraSnapshot model for storing image captures
- ✅ Added CameraAccessLog model for security audit logging

Let me update the Phase 9 project roadmap based on our progress so far:

## Phase 9: Admin Settings Enhancements (Weeks 11-12)

### 1. Schema Updates ✅
- ✅ Add `SiteSettings` model
- ✅ Add `SEOSettings` model
- ✅ Add `CookieSettings` model
- ✅ Enhance `PaystackConfiguration` model
- ✅ Add `FlutterwaveConfiguration` model
- ✅ Add `LegalDocument` model
- ✅ Add `AdminPreferences` model
- ✅ Add `ScriptInjection` model
- ✅ Add `ThemeSettings` model
- ✅ Add `SecuritySettings` model
- ✅ Add `AnalyticsSettings` model

### 2. API Development ✅
- ✅ `app/api/admin/settings/general/route.ts`: General site settings
- ✅ `app/api/admin/settings/cookies/route.ts`: Cookie consent settings
- ✅ `app/api/admin/settings/paystack/route.ts`: Paystack integration
- ✅ `app/api/admin/settings/flutterwave/route.ts`: Flutterwave integration
- ✅ `app/api/admin/settings/seo/route.ts`: SEO configuration
- ✅ `app/api/admin/settings/legal/route.ts`: Legal documents management
- ✅ `app/api/admin/settings/legal/[id]/route.ts`: Individual legal document operations
- ✅ `app/api/admin/settings/payment/general/route.ts`: Payment general settings
- ✅ `app/api/admin/settings/security/route.ts`: Security settings
- ✅ `app/api/admin/settings/theme/route.ts`: Theme settings
- ✅ `app/api/admin/settings/analytics/route.ts`: Analytics settings
- ✅ `app/api/settings/cookies/route.ts`: Public cookie settings
- ✅ `app/api/legal/route.ts`: Public legal documents list
- ✅ `app/api/legal/[slug]/route.ts`: Public legal document by slug
- ✅ Update `lib/services/settings.service.ts`: Combined settings service

### 3. Dashboard Structure ✅
- ✅ `app/(dashboard)/admin/settings/layout.tsx`: Settings layout with navigation
- ✅ `app/(dashboard)/admin/settings/general/page.tsx`: General settings
- ✅ `app/(dashboard)/admin/settings/email/page.tsx`: Email settings
- ✅ `app/(dashboard)/admin/settings/payment/page.tsx`: Payment gateway settings
- ✅ `app/(dashboard)/admin/settings/cookies/page.tsx`: Cookie consent settings
- ✅ `app/(dashboard)/admin/settings/seo/page.tsx`: SEO settings
- ✅ `app/(dashboard)/admin/settings/theme/page.tsx`: Theme & branding
- ✅ `app/(dashboard)/admin/settings/analytics/page.tsx`: Analytics & tracking
- ✅ `app/(dashboard)/admin/settings/legal/page.tsx`: Legal documents
- ✅ `app/(dashboard)/admin/settings/security/page.tsx`: Security settings
- ✅ `app/(dashboard)/admin/settings/users/page.tsx`: User Permission settings

### 4. Components ✅
- ✅ `components/common/CookieConsentDialog.tsx`: Cookie consent dialog
- ✅ `components/providers/CookieConsentProvider.tsx`: Cookie consent provider
- ✅ `app/providers.tsx`: Updated app providers with cookie consent
- ✅ `components/admin/settings/LegalDocumentEditor.tsx`: Document editor
- ✅ `components/admin/settings/ThemeColorPicker.tsx`: Theme color picker
- ✅ `components/admin/settings/LogoUploader.tsx`: Logo uploader

### 5. Public Components ✅
- ✅ `app/(marketing)/legal/page.tsx`: Legal documents list page
- ✅ `app/(marketing)/legal/[slug]/page.tsx`: Dynamic legal document page

### 6. Migration Scripts ✅
- ✅ `prisma/migrations/20250316000001_admin_settings/migration.sql`: Admin settings migration
- ✅ `scripts/update-schema.md`: Schema update and seeding guide

### Completed ✅
Phase 9 implementation is now complete. All dashboard pages, API routes, components, and database schemas for Admin Settings have been implemented. The cookie consent system is fully functional, and legal documents can be managed through the admin interface and viewed by users.


## Room Management System (Week X)

### 1. API Development
- ✅ `app/api/vendor/room-types/route.ts`: GET/POST for room types
- ✅ `app/api/vendor/room-types/[id]/route.ts`: GET/PUT/DELETE for room type
- ✅ `app/api/vendor/room-types/[id]/rooms/route.ts`: GET rooms by room type
- ✅ `app/api/vendor/rooms/route.ts`: GET/POST for rooms with room numbers
- ✅ `app/api/vendor/rooms/[id]/route.ts`: GET/PUT/DELETE for single room
- ✅ `app/api/vendor/rooms/check-availability/route.ts`: Check room number availability
- ✅ `app/api/vendor/hotels/[id]/stats/route.ts`: Hotel statistics

### 2. Service Updates
- ✅ `services/room-types.ts`: Room type management operations
- ✅ `services/rooms.ts`: Enhanced room service with room numbers

### 3. Components
- ✅ `components/vendor/RoomForm.tsx`: Form for creating/editing rooms
- ✅ `components/vendor/RoomTypeForm.tsx`: Form for room types
- ✅ `components/vendor/RoomList.tsx`: List component for rooms
- ✅ `components/vendor/RoomTypeList.tsx`: List component for room types

### 4. Pages
- ✅ `app/(dashboard)/vendor/hotels/[id]/page.tsx`: Hotel detail page with room management tabs
- ✅ `app/(dashboard)/vendor/hotels/[hotelId]/rooms/create/page.tsx`: Create room page
- ✅ `app/(dashboard)/vendor/hotels/[hotelId]/rooms/[roomId]/page.tsx`: View room details
- ✅ `app/(dashboard)/vendor/hotels/[hotelId]/rooms/[roomId]/edit/page.tsx`: Edit room page

### 5. Schema Updates
- ✅ Added `roomNumbers` field to Room model to store multiple physical room numbers