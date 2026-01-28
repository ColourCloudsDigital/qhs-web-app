-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 28, 2026 at 01:39 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `qaras_combined`
--

-- --------------------------------------------------------

--
-- Table structure for table `amenities`
--

CREATE TABLE `amenities` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `amenities`
--

INSERT INTO `amenities` (`id`, `name`, `description`, `icon`, `type`, `isActive`, `createdAt`, `updatedAt`) VALUES
('7f36982e-34f3-11f0-9620-d36ca6faf4d8', 'WiFi', 'High-speed wireless internet', 'wifi', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369b1c-34f3-11f0-9620-d36ca6faf4d8', 'Swimming Pool', 'Outdoor swimming pool', 'pool', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369bb2-34f3-11f0-9620-d36ca6faf4d8', 'Gym', 'Fully equipped fitness center', 'gym', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369c52-34f3-11f0-9620-d36ca6faf4d8', 'Restaurant', 'On-site restaurant', 'restaurant', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369cac-34f3-11f0-9620-d36ca6faf4d8', 'Conference Room', 'Meeting and event spaces', 'meeting-room', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369d06-34f3-11f0-9620-d36ca6faf4d8', 'Spa', 'Wellness and spa services', 'spa', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369d56-34f3-11f0-9620-d36ca6faf4d8', 'Air Conditioning', 'Climate control in rooms', 'ac', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369da6-34f3-11f0-9620-d36ca6faf4d8', 'TV', 'Flat-screen television', 'tv', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369df6-34f3-11f0-9620-d36ca6faf4d8', 'Mini-bar', 'In-room refreshments', 'minibar', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369e5a-34f3-11f0-9620-d36ca6faf4d8', 'Safe', 'In-room safe for valuables', 'safe', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369eaa-34f3-11f0-9620-d36ca6faf4d8', 'Balcony', 'Private balcony or terrace', 'balcony', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369f40-34f3-11f0-9620-d36ca6faf4d8', 'Bathtub', 'Bath tub in bathroom', 'bathtub', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369f86-34f3-11f0-9620-d36ca6faf4d8', 'Shower', 'Walk-in shower', 'shower', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f369fd6-34f3-11f0-9620-d36ca6faf4d8', 'Room Service', '24/7 room service', 'room-service', 'ROOM', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f36a026-34f3-11f0-9620-d36ca6faf4d8', 'Free Parking', 'Complimentary on-site parking', 'parking', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46'),
('7f36a076-34f3-11f0-9620-d36ca6faf4d8', 'Breakfast', 'Complimentary breakfast', 'breakfast', 'HOTEL', 1, '2025-05-19 21:54:46', '2025-05-19 21:54:46');

-- --------------------------------------------------------

--
-- Table structure for table `analytics_settings`
--

CREATE TABLE `analytics_settings` (
  `id` varchar(36) NOT NULL,
  `googleAnalyticsEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `googleAnalyticsId` varchar(255) DEFAULT NULL,
  `googleTagManagerEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `googleTagManagerId` varchar(255) DEFAULT NULL,
  `facebookPixelEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `facebookPixelId` varchar(255) DEFAULT NULL,
  `hotjarEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `hotjarId` varchar(255) DEFAULT NULL,
  `customScripts` text DEFAULT NULL,
  `dataRetentionPeriod` int(11) DEFAULT 365,
  `anonymizeIp` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `analytics_settings`
--

INSERT INTO `analytics_settings` (`id`, `googleAnalyticsEnabled`, `googleAnalyticsId`, `googleTagManagerEnabled`, `googleTagManagerId`, `facebookPixelEnabled`, `facebookPixelId`, `hotjarEnabled`, `hotjarId`, `customScripts`, `dataRetentionPeriod`, `anonymizeIp`, `createdAt`, `updatedAt`, `isActive`) VALUES
('33f29890-dbe6-11f0-9764-10653019422e', 0, NULL, 0, NULL, 0, NULL, 0, NULL, '{\"enabled\":false,\"headScripts\":\"\",\"bodyStartScripts\":\"\",\"bodyEndScripts\":\"\",\"customScriptsRaw\":\"\"}', 365, 1, '2025-12-18 08:50:20', '2025-12-18 09:22:06', 1);

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) DEFAULT 'string',
  `group` varchar(100) DEFAULT NULL,
  `isPublic` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `app_settings`
--

INSERT INTO `app_settings` (`id`, `key`, `value`, `description`, `type`, `group`, `isPublic`, `createdAt`, `updatedAt`) VALUES
('9b45c1d6-3569-11f0-808a-f39922e0fe56', 'defaultTaxRate', '5', 'Default tax rate for the platform', 'number', 'payment', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c500-3569-11f0-808a-f39922e0fe56', 'defaultCommissionRate', '10', 'Default commission rate for the platform', 'number', 'payment', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c622-3569-11f0-808a-f39922e0fe56', 'contactEmail', 'support@qarashotels.com', 'Primary contact email', 'string', 'contact', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c6cc-3569-11f0-808a-f39922e0fe56', 'contactPhone', '+234 800 123 4567', 'Primary contact phone', 'string', 'contact', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c76c-3569-11f0-808a-f39922e0fe56', 'supportEmail', 'help@qarashotels.com', 'Support email address', 'string', 'contact', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c802-3569-11f0-808a-f39922e0fe56', 'appVersion', '1.0.0', 'Current app version', 'string', 'system', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c898-3569-11f0-808a-f39922e0fe56', 'termsUrl', '/terms', 'Terms of service URL', 'string', 'legal', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c942-3569-11f0-808a-f39922e0fe56', 'privacyUrl', '/privacy', 'Privacy policy URL', 'string', 'legal', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45c9d8-3569-11f0-808a-f39922e0fe56', 'bookingFee', '0', 'Booking fee amount', 'number', 'payment', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14'),
('9b45ca82-3569-11f0-808a-f39922e0fe56', 'allowGuestBooking', 'true', 'Allow booking without an account', 'boolean', 'booking', 1, '2025-05-20 12:00:14', '2025-05-20 12:00:14');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `roomUnitId` varchar(36) NOT NULL,
  `customerId` varchar(36) NOT NULL,
  `checkInDate` date NOT NULL,
  `checkOutDate` date NOT NULL,
  `numberOfGuests` int(11) NOT NULL,
  `numberOfRooms` int(11) DEFAULT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL,
  `paymentStatus` varchar(50) NOT NULL,
  `specialRequests` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `hotelId`, `roomUnitId`, `customerId`, `checkInDate`, `checkOutDate`, `numberOfGuests`, `numberOfRooms`, `totalAmount`, `status`, `paymentStatus`, `specialRequests`, `createdAt`, `updatedAt`) VALUES
('0228d7b2-6ffe-42bc-ba1d-c0df7e2b5920', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '978fb42a-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2025-12-28', '2025-12-30', 3, 0, 60000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Too much noise (by CUSTOMER)', '2025-12-23 10:17:22', '2026-01-07 08:56:14'),
('02e829e3-d8ee-43f8-88ee-91ec88913e42', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '978a27d0-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-13', '2026-01-14', 4, 1, 25000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: I don\'t like how the place looks (by CUSTOMER)', '2026-01-12 15:25:37', '2026-01-12 16:52:13'),
('0cd19d02-ce56-4329-8d02-45c3bbc7d693', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '978fb42a-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-15', '2026-01-17', 2, 1, 60000.00, 'CONFIRMED', 'PENDING', '', '2026-01-15 14:06:33', '2026-01-15 14:06:33'),
('0e1754b6-ad3a-4025-ba02-2e2bf31647fb', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-02-03', '2026-02-10', 2, 1, 140000.00, 'CONFIRMED', 'PENDING', '', '2026-01-08 10:57:26', '2026-01-08 10:57:26'),
('1be1c8c7-bf95-4841-874d-3e63757ee4c5', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-08', '2026-01-09', 5, 2, 36000.00, 'CHECKED_OUT', 'PENDING', 'I need to play some games like Snooker during the day. ', '2026-01-09 08:49:42', '2026-01-13 16:56:16'),
('20017311-7ee2-4e3c-add5-afe734e1605f', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-06', '2026-01-08', 2, 0, 40000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Mistake (by CUSTOMER)', '2026-01-06 12:49:02', '2026-01-06 15:21:03'),
('2aef1280-156d-490c-b5bc-1ab42bc31ee2', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-09', 2, 0, 80000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: No reason (by CUSTOMER)', '2026-01-05 16:55:09', '2026-01-07 08:56:14'),
('2be6d2de-85ac-49bb-b095-4e3af9082fd8', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-09', '2026-01-14', 4, 0, 100000.00, 'CANCELLED', 'PENDING', '', '2026-01-06 16:16:31', '2026-01-07 08:56:14'),
('2dcf805f-222f-4f04-ae02-1bee9a839fc7', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-12', '2026-01-14', 3, 1, 40000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Mistake in the booking (by CUSTOMER)', '2026-01-12 15:05:27', '2026-01-12 15:07:31'),
('3197b9b6-ef5e-4581-bcb8-6fa2db821e23', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 36000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: It is far (by CUSTOMER)', '2026-01-05 15:43:08', '2026-01-07 08:56:14'),
('3cf4b595-0643-4809-bf7a-ab9cb9b48199', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-06', '2026-01-08', 2, 0, 40000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Mistake (by CUSTOMER)', '2026-01-06 15:57:43', '2026-01-06 15:58:53'),
('3f6682b1-3d06-4b51-be24-4cd71876a4e1', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 36000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Mistake, I wanted to choose another one (by CUSTOMER)', '2026-01-05 15:46:17', '2026-01-07 08:56:14'),
('53a70e62-0fba-416a-952a-511c0a11cec8', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-07', '2026-01-09', 2, 0, 36000.00, 'CHECKED_OUT', 'PENDING', '', '2026-01-07 11:06:15', '2026-01-13 16:56:16'),
('5896b281-9696-4866-948d-6399a02f959a', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 36000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: It was a mistake (by CUSTOMER)', '2026-01-05 15:38:36', '2026-01-07 08:56:14'),
('58dbbc6f-8ac5-434a-940e-2d2551e0726e', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 36000.00, 'CANCELLED', 'PENDING', '', '2026-01-05 14:24:39', '2026-01-07 08:56:14'),
('59d45235-51fe-49ec-be8d-36eb37d3ff49', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '978a27d0-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2025-12-22', '2025-12-24', 1, 0, 50000.00, 'CANCELLED', 'PENDING', '', '2025-12-22 14:25:45', '2026-01-07 08:56:14'),
('6e171e8b-b073-433b-add7-d2ac08b1084e', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 36000.00, 'CANCELLED', 'PENDING', '', '2026-01-05 14:25:22', '2026-01-07 08:56:14'),
('78b2c29a-9292-4cc9-9275-c9d720c1f64b', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-09', '2026-01-10', 2, 2, 36000.00, 'CANCELLED', 'PENDING', 'Indoor Delivery\n\nCANCELLATION: I have a function and won\'t be able to make it (by CUSTOMER)', '2026-01-07 15:16:20', '2026-01-08 10:06:57'),
('79e29e0c-9b17-476d-928d-f6b535afbb1c', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 36000.00, 'CANCELLED', 'PENDING', '', '2026-01-05 14:21:54', '2026-01-07 08:56:14'),
('898a4ade-8954-4d29-87df-9ea573f739f2', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-06', '2026-01-08', 2, 0, 40000.00, 'CANCELLED', 'PENDING', '', '2026-01-06 11:08:06', '2026-01-07 08:56:14'),
('9fe9f20b-ec80-4a0a-8795-5c7725003228', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-20', '2026-01-22', 2, 1, 40000.00, 'CONFIRMED', 'PENDING', '', '2026-01-15 13:47:54', '2026-01-15 13:47:54'),
('a3af7f3b-c583-48c9-b71b-8b5e3067a468', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-13', '2026-01-14', 3, 3, 54000.00, 'CHECKED_OUT', 'PENDING', 'Special Room Delivery', '2026-01-13 16:48:00', '2026-01-15 10:36:46'),
('a525c547-0277-4ff5-ba01-fcdd36ce0838', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-15', '2026-01-16', 4, 2, 36000.00, 'CONFIRMED', 'PENDING', '', '2026-01-15 13:05:21', '2026-01-15 13:05:21'),
('a833b033-c7d8-45ee-8ddb-7791b886df91', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2025-12-23', '2025-12-26', 2, 0, 60000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Wrong booking (by CUSTOMER)', '2025-12-22 10:33:43', '2026-01-07 08:56:14'),
('a883feb9-fbc2-4179-a8f1-32dcbca3784c', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 36000.00, 'CANCELLED', 'PENDING', '', '2026-01-05 15:02:01', '2026-01-07 08:56:14'),
('aec02875-8bae-44e1-ab80-cc4bb2e2794c', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-14', '2026-01-15', 4, 1, 20000.00, 'CONFIRMED', 'PENDING', '', '2026-01-14 08:23:51', '2026-01-14 08:23:51'),
('be8f487c-6f76-4821-b921-7ee8c436e0a5', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2025-12-17', '2025-12-24', 2, 0, 126000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Too high of a price, I want something cheaper (by CUSTOMER)', '2025-12-17 16:10:52', '2026-01-07 08:56:14'),
('c1545be9-c59e-4a9e-9522-b066be904d47', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 40000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Nothing (by CUSTOMER)', '2026-01-05 16:21:01', '2026-01-07 08:56:14'),
('d89cbb4c-e1c5-492d-988f-c50eea279c6b', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '978a27d0-35b9-11f0-8cf5-f19e416d5e91', '0c34c864-3e97-4c4b-8680-2c994d8e2999', '2025-05-22', '2025-05-24', 2, 0, 50000.00, 'CHECKED_OUT', 'PENDING', NULL, '2025-05-22 17:57:34', '2026-01-13 16:56:16'),
('d8c18723-e012-4a4a-8dda-918552fc0f57', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-15', '2026-01-16', 1, 1, 18000.00, 'CONFIRMED', 'PENDING', '', '2026-01-13 17:05:00', '2026-01-13 17:05:00'),
('df52f56f-579c-4377-b923-9c45143db2f5', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893b36-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-27', '2026-01-29', 2, 1, 40000.00, 'CHECKED_IN', 'PENDING', '', '2026-01-27 16:47:26', '2026-01-27 22:33:43'),
('e0d2653f-b922-4595-8c71-8911fac07759', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-05', '2026-01-07', 2, 0, 40000.00, 'CANCELLED', 'PENDING', 'CANCELLATION: Nothing in particular (by CUSTOMER)', '2026-01-05 15:57:20', '2026-01-07 08:56:14'),
('e28ec6f8-b685-4e04-87dd-31d113cb932c', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-06', '2026-01-08', 2, 0, 40000.00, 'CANCELLED', 'PENDING', '', '2026-01-06 12:05:12', '2026-01-07 08:56:14'),
('ed4dc22d-396a-4017-9765-2d8cb14bdba7', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-10', '2026-01-11', 3, 1, 20000.00, 'CANCELLED', 'PENDING', 'Room delivery service\n\nCANCELLATION: I have an urgent function and won\'t be able to make it on that day (by CUSTOMER)', '2026-01-08 14:48:09', '2026-01-09 08:51:37'),
('f5494a10-1eb4-4f21-b296-b8c0ad7c34a8', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97893e60-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2026-01-09', '2026-01-11', 4, 1, 40000.00, 'CHECKED_OUT', 'PENDING', '', '2026-01-09 11:10:06', '2026-01-13 16:56:16'),
('fbb18a5c-1e92-46a4-a0de-488a7619aa10', '06a129c4-348f-11f0-b65f-9f7e9986d28a', '97874240-35b9-11f0-8cf5-f19e416d5e91', '6efbd341-db59-11f0-9764-10653019422e', '2025-12-22', '2025-12-24', 2, 0, 36000.00, 'CANCELLED', 'PENDING', '', '2025-12-22 09:02:59', '2026-01-07 08:56:14');

-- --------------------------------------------------------

--
-- Table structure for table `booking_documents`
--

CREATE TABLE `booking_documents` (
  `id` varchar(36) NOT NULL,
  `bookingId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cookie_settings`
--

CREATE TABLE `cookie_settings` (
  `id` varchar(36) NOT NULL,
  `cookieBannerEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `cookiePolicyUrl` varchar(255) DEFAULT NULL,
  `necessaryCookiesDesc` text DEFAULT NULL,
  `preferenceCookiesDesc` text DEFAULT NULL,
  `statisticsCookiesDesc` text DEFAULT NULL,
  `marketingCookiesDesc` text DEFAULT NULL,
  `defaultConsent` longtext DEFAULT NULL,
  `bannerTitle` varchar(255) DEFAULT 'We use cookies',
  `bannerDescription` text DEFAULT NULL,
  `acceptAllButtonText` varchar(255) DEFAULT 'Accept All',
  `rejectAllButtonText` varchar(255) DEFAULT 'Reject All',
  `savePreferencesButtonText` varchar(255) DEFAULT 'Save Preferences',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cookie_settings`
--

INSERT INTO `cookie_settings` (`id`, `cookieBannerEnabled`, `cookiePolicyUrl`, `necessaryCookiesDesc`, `preferenceCookiesDesc`, `statisticsCookiesDesc`, `marketingCookiesDesc`, `defaultConsent`, `bannerTitle`, `bannerDescription`, `acceptAllButtonText`, `rejectAllButtonText`, `savePreferencesButtonText`, `createdAt`, `updatedAt`) VALUES
('7f89af10-356f-11f0-a505-2f6c908f19d1', 1, '/cookie-policy', 'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website.', 'Preference cookies enable a website to remember information that changes the way the website behaves or looks.', 'Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.', 'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging.', NULL, 'We value your privacy', 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.', 'Accept All', 'Reject All', 'Save Preferences', '2025-05-20 12:42:24', '2025-05-20 12:43:56');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `userId` varchar(36) DEFAULT NULL,
  `hotelId` varchar(36) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nationality` varchar(150) DEFAULT NULL,
  `idType` varchar(150) DEFAULT NULL,
  `idNumber` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `firstName`, `lastName`, `userId`, `hotelId`, `phone`, `address`, `createdAt`, `updatedAt`, `nationality`, `idType`, `idNumber`) VALUES
('0c34c864-3e97-4c4b-8680-2c994d8e2999', 'Bluxton', 'Hill', NULL, '06a129c4-348f-11f0-b65f-9f7e9986d28a', '+2347059992238', NULL, '2025-05-22 17:57:34', '2025-05-22 17:57:34', NULL, NULL, NULL),
('2999a2d9-494a-498b-bea4-c4f1b3ef2a25', 'Fortune', 'Precious', '92d4deb3-aa00-4b4b-9568-bf9f319ce67c', NULL, '07015917361', NULL, '2026-01-08 14:03:34', '2026-01-23 07:48:32', NULL, NULL, NULL),
('3c96ee4e-db31-11f0-9764-10653019422e', NULL, NULL, '8253b6dc-34ed-11f0-9f7f-5fe7685262f6', NULL, NULL, NULL, '2025-12-17 11:14:56', '2025-12-17 11:14:56', NULL, NULL, NULL),
('6efbd341-db59-11f0-9764-10653019422e', NULL, NULL, '6efa9852-db59-11f0-9764-10653019422e', NULL, '09133846637', NULL, '2025-12-17 16:02:40', '2025-12-17 16:02:40', NULL, NULL, NULL),
('bf168d3d-da52-11f0-a35e-10653019422e', NULL, NULL, 'bf160a57-da52-11f0-a35e-10653019422e', NULL, '08062180546', 'No. 9, AP Miller Street, Abuloma, Port Harcourt', '2025-12-16 08:42:17', '2025-12-16 08:42:17', NULL, NULL, NULL),
('c6c1ec07-db39-11f0-9c7c-f0b61e9d0e9e', NULL, NULL, 'c6c181b0-db39-11f0-9c7c-f0b61e9d0e9e', NULL, '07015917361', '4 Wali Close, Off Okporo Road, Mgbuesilaru', '2025-12-17 12:15:50', '2026-01-07 17:04:45', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `email_templates`
--

CREATE TABLE `email_templates` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) DEFAULT NULL,
  `template_key` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `bodyText` text DEFAULT NULL,
  `variables` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `email_templates`
--

INSERT INTO `email_templates` (`id`, `vendorId`, `template_key`, `name`, `subject`, `body`, `bodyText`, `variables`, `isActive`, `createdAt`, `updatedAt`) VALUES
('7891c838-3721-11f0-bd42-362101a43314', NULL, 'booking_confirmation', 'Booking Confirmation', 'Your Booking Confirmation - {{booking_reference}}', '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Booking Confirmation</title>\r\n  <style>\r\n    body {\r\n      font-family: Arial, sans-serif;\r\n      line-height: 1.6;\r\n      color: #333;\r\n      margin: 0;\r\n      padding: 0;\r\n    }\r\n    .container {\r\n      max-width: 600px;\r\n      margin: 0 auto;\r\n      padding: 20px;\r\n    }\r\n    .header {\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 20px;\r\n      text-align: center;\r\n    }\r\n    .content {\r\n      padding: 20px;\r\n      background-color: #f9f9f9;\r\n    }\r\n    .booking-details {\r\n      background-color: white;\r\n      padding: 15px;\r\n      margin-bottom: 20px;\r\n      border-radius: 5px;\r\n      border: 1px solid #eee;\r\n    }\r\n    .hotel-details {\r\n      background-color: white;\r\n      padding: 15px;\r\n      border-radius: 5px;\r\n      border: 1px solid #eee;\r\n    }\r\n    .footer {\r\n      text-align: center;\r\n      padding: 20px;\r\n      font-size: 12px;\r\n      color: #777;\r\n    }\r\n    h1, h2, h3 {\r\n      color: {{primary_color}};\r\n    }\r\n    .button {\r\n      display: inline-block;\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 10px 20px;\r\n      text-decoration: none;\r\n      border-radius: 5px;\r\n      margin-top: 15px;\r\n    }\r\n    table {\r\n      width: 100%;\r\n      border-collapse: collapse;\r\n    }\r\n    table td {\r\n      padding: 8px;\r\n      border-bottom: 1px solid #eee;\r\n    }\r\n    table td:first-child {\r\n      font-weight: bold;\r\n      width: 40%;\r\n    }\r\n  </style>\r\n</head>\r\n<body>\r\n  <div class=\"container\">\r\n    <div class=\"header\">\r\n      <h1>Booking Confirmation</h1>\r\n    </div>\r\n    \r\n    <div class=\"content\">\r\n      <p>Dear {{guest_name}},</p>\r\n      \r\n      <p>Thank you for choosing to stay at {{hotel_name}}. Your booking has been confirmed.</p>\r\n      \r\n      <div class=\"booking-details\">\r\n        <h2>Your Booking Details</h2>\r\n        <table>\r\n          <tr>\r\n            <td>Booking Reference:</td>\r\n            <td>{{booking_reference}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Check-in Date:</td>\r\n            <td>{{check_in_date}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Check-out Date:</td>\r\n            <td>{{check_out_date}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Room Type:</td>\r\n            <td>{{room_type}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Number of Guests:</td>\r\n            <td>{{guest_count}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Total Amount:</td>\r\n            <td>{{currency_symbol}}{{total_amount}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Payment Status:</td>\r\n            <td>{{payment_status}}</td>\r\n          </tr>\r\n        </table>\r\n        \r\n        <a href=\"{{booking_url}}\" class=\"button\">View Booking</a>\r\n      </div>\r\n      \r\n      <div class=\"hotel-details\">\r\n        <h2>Hotel Information</h2>\r\n        <table>\r\n          <tr>\r\n            <td>Hotel Name:</td>\r\n            <td>{{hotel_name}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Address:</td>\r\n            <td>{{hotel_address}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Phone:</td>\r\n            <td>{{hotel_phone}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Email:</td>\r\n            <td>{{hotel_email}}</td>\r\n          </tr>\r\n        </table>\r\n      </div>\r\n      \r\n      <div class=\"policies\">\r\n        <h3>Cancellation Policy</h3>\r\n        <p>{{cancellation_policy}}</p>\r\n      </div>\r\n      \r\n      <p>If you have any questions about your booking, please contact us at {{contact_email}} or call us at {{contact_phone}}.</p>\r\n      \r\n      <p>We look forward to welcoming you to {{hotel_name}}!</p>\r\n      \r\n      <p>Best regards,<br>\r\n      The {{hotel_name}} Team</p>\r\n    </div>\r\n    \r\n    <div class=\"footer\">\r\n      <p>&copy; {{year}} {{hotel_name}}. All rights reserved.</p>\r\n      <p>{{email_footer_text}}</p>\r\n    </div>\r\n  </div>\r\n</body>\r\n</html>', 'Dear {{guest_name}},\r\n\r\nThank you for choosing to stay at {{hotel_name}}. Your booking has been confirmed.\r\n\r\nYOUR BOOKING DETAILS:\r\n--------------------\r\nBooking Reference: {{booking_reference}}\r\nCheck-in Date: {{check_in_date}}\r\nCheck-out Date: {{check_out_date}}\r\nRoom Type: {{room_type}}\r\nNumber of Guests: {{guest_count}}\r\nTotal Amount: {{currency_symbol}}{{total_amount}}\r\nPayment Status: {{payment_status}}\r\n\r\nTo view your booking online, visit: {{booking_url}}\r\n\r\nHOTEL INFORMATION:\r\n----------------\r\nHotel Name: {{hotel_name}}\r\nAddress: {{hotel_address}}\r\nPhone: {{hotel_phone}}\r\nEmail: {{hotel_email}}\r\n\r\nCANCELLATION POLICY:\r\n------------------\r\n{{cancellation_policy}}\r\n\r\nIf you have any questions about your booking, please contact us at {{contact_email}} or call us at {{contact_phone}}.\r\n\r\nWe look forward to welcoming you to {{hotel_name}}!\r\n\r\nBest regards,\r\nThe {{hotel_name}} Team\r\n\r\n© {{year}} {{hotel_name}}. All rights reserved.\r\n{{email_footer_text}}', '[\"guest_name\",\"booking_reference\",\"check_in_date\",\"check_out_date\",\"room_type\",\"guest_count\",\"total_amount\",\"payment_status\",\"booking_url\",\"hotel_name\",\"hotel_address\",\"hotel_phone\",\"hotel_email\",\"cancellation_policy\",\"contact_email\",\"contact_phone\",\"primary_color\",\"currency_symbol\",\"year\",\"email_footer_text\"]', 1, '2025-05-22 16:28:54', '2025-05-22 16:28:54'),
('ef82420a-3731-11f0-b953-fa2ced23e514', NULL, 'account_signup', 'Account Signup Confirmation', 'Welcome to Qaras Hotels - Please Confirm Your Email', '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Welcome to Qaras Hotels</title>\r\n  <style>\r\n    body {\r\n      font-family: Arial, sans-serif;\r\n      line-height: 1.6;\r\n      color: #333;\r\n      margin: 0;\r\n      padding: 0;\r\n    }\r\n    .container {\r\n      max-width: 600px;\r\n      margin: 0 auto;\r\n      padding: 20px;\r\n    }\r\n    .header {\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 20px;\r\n      text-align: center;\r\n    }\r\n    .content {\r\n      padding: 20px;\r\n      background-color: #f9f9f9;\r\n    }\r\n    .button {\r\n      display: inline-block;\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 10px 20px;\r\n      text-decoration: none;\r\n      border-radius: 5px;\r\n      margin-top: 15px;\r\n    }\r\n    .footer {\r\n      text-align: center;\r\n      padding: 20px;\r\n      font-size: 12px;\r\n      color: #777;\r\n    }\r\n  </style>\r\n</head>\r\n<body>\r\n  <div class=\"container\">\r\n    <div class=\"header\">\r\n      <h1>Welcome to Qaras Hotels!</h1>\r\n    </div>\r\n    \r\n    <div class=\"content\">\r\n      <p>Dear {{first_name}},</p>\r\n      \r\n      <p>Thank you for signing up with Qaras Hotels. We\'re excited to have you on board!</p>\r\n      \r\n      <p>To complete your registration and verify your email address, please click the button below:</p>\r\n      \r\n      <p style=\"text-align: center;\">\r\n        <a href=\"{{verification_link}}\" class=\"button\">Verify Email Address</a>\r\n      </p>\r\n      \r\n      <p>If the button doesn\'t work, you can also copy and paste the following link into your browser:</p>\r\n      \r\n      <p style=\"word-break: break-all;\">{{verification_link}}</p>\r\n      \r\n      <p>This link will expire in 24 hours for security reasons.</p>\r\n      \r\n      <p>If you didn\'t create an account, please ignore this email or contact our support team if you have any concerns.</p>\r\n      \r\n      <p>Best regards,<br>\r\n      The Qaras Hotels Team</p>\r\n    </div>\r\n    \r\n    <div class=\"footer\">\r\n      <p>&copy; {{year}} Qaras Hotels. All rights reserved.</p>\r\n      <p>{{email_footer_text}}</p>\r\n    </div>\r\n  </div>\r\n</body>\r\n</html>', 'Dear {{first_name}},\r\n\r\nThank you for signing up with Qaras Hotels. We\'re excited to have you on board!\r\n\r\nTo complete your registration and verify your email address, please visit the following link:\r\n\r\n{{verification_link}}\r\n\r\nThis link will expire in 24 hours for security reasons.\r\n\r\nIf you didn\'t create an account, please ignore this email or contact our support team if you have any concerns.\r\n\r\nBest regards,\r\nThe Qaras Hotels Team\r\n\r\n© {{year}} Qaras Hotels. All rights reserved.\r\n{{email_footer_text}}', '[\"first_name\",\"last_name\",\"verification_link\",\"primary_color\",\"year\",\"email_footer_text\"]', 1, '2025-05-22 18:26:45', '2025-05-22 18:26:45'),
('ef86373e-3731-11f0-b953-fa2ced23e514', NULL, 'password_reset', 'Password Reset Request', 'Qaras Hotels - Password Reset Request', '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Password Reset Request</title>\r\n  <style>\r\n    body {\r\n      font-family: Arial, sans-serif;\r\n      line-height: 1.6;\r\n      color: #333;\r\n      margin: 0;\r\n      padding: 0;\r\n    }\r\n    .container {\r\n      max-width: 600px;\r\n      margin: 0 auto;\r\n      padding: 20px;\r\n    }\r\n    .header {\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 20px;\r\n      text-align: center;\r\n    }\r\n    .content {\r\n      padding: 20px;\r\n      background-color: #f9f9f9;\r\n    }\r\n    .button {\r\n      display: inline-block;\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 10px 20px;\r\n      text-decoration: none;\r\n      border-radius: 5px;\r\n      margin-top: 15px;\r\n    }\r\n    .footer {\r\n      text-align: center;\r\n      padding: 20px;\r\n      font-size: 12px;\r\n      color: #777;\r\n    }\r\n    .warning {\r\n      background-color: #fff3cd;\r\n      color: #856404;\r\n      padding: 10px;\r\n      border-radius: 5px;\r\n      margin: 15px 0;\r\n    }\r\n  </style>\r\n</head>\r\n<body>\r\n  <div class=\"container\">\r\n    <div class=\"header\">\r\n      <h1>Password Reset Request</h1>\r\n    </div>\r\n    \r\n    <div class=\"content\">\r\n      <p>Hello,</p>\r\n      \r\n      <p>We received a request to reset the password for your Qaras Hotels account. If you didn\'t make this request, you can safely ignore this email.</p>\r\n      \r\n      <p>To reset your password, please click the button below:</p>\r\n      \r\n      <p style=\"text-align: center;\">\r\n        <a href=\"{{reset_link}}\" class=\"button\">Reset Password</a>\r\n      </p>\r\n      \r\n      <p>If the button doesn\'t work, you can also copy and paste the following link into your browser:</p>\r\n      \r\n      <p style=\"word-break: break-all;\">{{reset_link}}</p>\r\n      \r\n      <div class=\"warning\">\r\n        <p><strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>\r\n      </div>\r\n      \r\n      <p>If you continue having trouble, please contact our support team for assistance.</p>\r\n      \r\n      <p>Best regards,<br>\r\n      The Qaras Hotels Team</p>\r\n    </div>\r\n    \r\n    <div class=\"footer\">\r\n      <p>&copy; {{year}} Qaras Hotels. All rights reserved.</p>\r\n      <p>{{email_footer_text}}</p>\r\n    </div>\r\n  </div>\r\n</body>\r\n</html>', 'Hello,\r\n\r\nWe received a request to reset the password for your Qaras Hotels account. If you didn\'t make this request, you can safely ignore this email.\r\n\r\nTo reset your password, please visit the following link:\r\n\r\n{{reset_link}}\r\n\r\nIMPORTANT: This password reset link will expire in 1 hour for security reasons.\r\n\r\nIf you continue having trouble, please contact our support team for assistance.\r\n\r\nBest regards,\r\nThe Qaras Hotels Team\r\n\r\n© {{year}} Qaras Hotels. All rights reserved.\r\n{{email_footer_text}}', '[\"reset_link\",\"primary_color\",\"year\",\"email_footer_text\"]', 1, '2025-05-22 18:26:45', '2025-05-22 18:26:45');

-- --------------------------------------------------------

--
-- Table structure for table `facility_tasks`
--

CREATE TABLE `facility_tasks` (
  `taskId` varchar(50) NOT NULL,
  `hotelId` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT 'General',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT','EMERGENCY') DEFAULT 'MEDIUM',
  `due_date` date NOT NULL,
  `staffId` varchar(50) DEFAULT NULL,
  `vendorId` varchar(50) DEFAULT NULL,
  `roomUnitId` varchar(50) DEFAULT NULL,
  `maintenance_type` enum('CORRECTIVE','PREVENTIVE','PREDICTIVE','EMERGENCY','OTHER') DEFAULT 'CORRECTIVE',
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `cost_estimate` decimal(15,2) DEFAULT NULL,
  `is_recurring` tinyint(1) DEFAULT 0,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facility_tasks`
--

INSERT INTO `facility_tasks` (`taskId`, `hotelId`, `title`, `description`, `category`, `priority`, `due_date`, `staffId`, `vendorId`, `roomUnitId`, `maintenance_type`, `estimated_hours`, `cost_estimate`, `is_recurring`, `status`, `created_at`, `updated_at`) VALUES
('500baa0e-d68e-4313-ab16-f1723988582e', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Broken Toilet', 'Broken Toilet', 'REPAIR', 'MEDIUM', '2025-12-18', 'e3580441-db39-11f0-9c7c-f0b61e9d0e9e', '327781f0-3558-11f0-808a-f39922e0fe56', '9789413a-35b9-11f0-8cf5-f19e416d5e91', 'CORRECTIVE', 4.00, 2.00, 0, 'COMPLETED', '2026-01-20 13:55:12', '2026-01-20 14:55:14'),
('9695f0e5-1694-43d6-8510-c25be7333287', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Send in your report', 'Send in your report before 12pm, do not forget to add the room we owed Mr Ikenna', 'General', 'MEDIUM', '2026-01-27', '5fa39a9b-825b-464a-9db3-202844d926f2', '327781f0-3558-11f0-808a-f39922e0fe56', NULL, 'CORRECTIVE', NULL, NULL, 0, 'COMPLETED', '2026-01-27 21:40:45', '2026-01-28 12:18:59');

-- --------------------------------------------------------

--
-- Table structure for table `flutterwave_settings`
--

CREATE TABLE `flutterwave_settings` (
  `id` varchar(36) NOT NULL,
  `livePublicKey` varchar(255) DEFAULT NULL,
  `liveSecretKey` varchar(255) DEFAULT NULL,
  `testPublicKey` varchar(255) DEFAULT NULL,
  `testSecretKey` varchar(255) DEFAULT NULL,
  `encryptionKey` varchar(255) DEFAULT NULL,
  `isLive` tinyint(1) DEFAULT 0,
  `webhookUrl` varchar(255) DEFAULT NULL,
  `webhookSecret` varchar(255) DEFAULT NULL,
  `isEnabled` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hotels`
--

CREATE TABLE `hotels` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `zipCode` varchar(20) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `images` text DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `whitelabelConfig` text DEFAULT NULL,
  `wifiConfig` text DEFAULT NULL,
  `cctvConfig` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`id`, `vendorId`, `name`, `description`, `address`, `city`, `state`, `country`, `zipCode`, `phone`, `email`, `website`, `images`, `rating`, `isActive`, `whitelabelConfig`, `wifiConfig`, `cctvConfig`, `createdAt`, `updatedAt`) VALUES
('06a129c4-348f-11f0-b65f-9f7e9986d28a', '327781f0-3558-11f0-808a-f39922e0fe56', 'Bluxton Hill', 'Luxury hotel with stunning views', 'No 30 Hilltop Drive', 'Port Harcourt', 'Rivers State', 'Nigeria', '', '+234 123 456 7891', 'bluxton@qarashotels.com.ng', 'https://bluxton.qarashotels.com.ng', '[\"/uploads/hotels/deb53661-c166-4137-978b-d69d963464d6.jpg\",\"/uploads/hotels/11376356-c3b8-43c6-a160-999e99cecf87.jpg\",\"/uploads/hotels/56af004a-1141-4077-8b4d-754d01c96900.jpg\",\"/uploads/hotels/540a61c8-dd3a-418e-b197-79ad906a42a3.jpg\"]', 0, 1, '{\"logo\":null,\"primaryColor\":\"#1e3a8a\",\"secondaryColor\":\"#f59e0b\",\"fontFamily\":\"Poppins, sans-serif\"}', '{\"networkName\":\"BLUXTON_2ND_FLOOR\",\"isEnabled\":true,\"bandwidthLimit\":10}', NULL, '2025-05-19 09:55:34', '2025-05-20 23:12:45'),
('06a3a82a-348f-11f0-b65f-9f7e9986d28a', '327781f0-3558-11f0-808a-f39922e0fe56', 'House 3', 'Modern boutique hotel in the heart of the city', '3 Faithful Lane', 'Port Harcourt', 'Rivers State', 'Nigeria', '', '+234 123 456 7892', 'house3@qarashotels.com.ng', 'https://house3.qarashotels.com.ng', '[\"/uploads/hotels/a9df34ec-2d70-444c-acb8-58cfa5cd7610.jpg\",\"/uploads/hotels/c5627403-2c6b-4dec-b531-0054c1f0f2ea.jpg\",\"/uploads/hotels/76fdb9d9-5482-467e-8f0f-e21741cfe1c5.jpg\"]', 0, 1, '{\"logo\":null,\"primaryColor\":\"#1e3a8a\",\"secondaryColor\":\"#f59e0b\",\"fontFamily\":\"Poppins, sans-serif\"}', '{\"networkName\":\"Qaras House-3\",\"isEnabled\":true,\"bandwidthLimit\":10}', NULL, '2025-05-19 09:55:34', '2025-05-21 12:00:36');

-- --------------------------------------------------------

--
-- Table structure for table `hotel_amenities`
--

CREATE TABLE `hotel_amenities` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `amenityId` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `legal_documents`
--

CREATE TABLE `legal_documents` (
  `id` varchar(36) NOT NULL,
  `type` enum('PRIVACY_POLICY','TERMS_OF_SERVICE','COOKIE_POLICY','REFUND_POLICY','USER_AGREEMENT') NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `version` varchar(50) NOT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `effectiveDate` datetime NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_access_logs`
--

CREATE TABLE `menu_access_logs` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `userAgent` varchar(255) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `accessedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_categories`
--

CREATE TABLE `menu_categories` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `displayOrder` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` varchar(36) NOT NULL,
  `categoryId` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `discountedPrice` decimal(10,2) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `ingredients` text DEFAULT NULL,
  `allergens` text DEFAULT NULL,
  `isVegetarian` tinyint(1) DEFAULT 0,
  `isVegan` tinyint(1) DEFAULT 0,
  `isGlutenFree` tinyint(1) DEFAULT 0,
  `isSpicy` tinyint(1) DEFAULT 0,
  `calories` int(11) DEFAULT NULL,
  `preparationTime` int(11) DEFAULT NULL,
  `displayOrder` int(11) NOT NULL DEFAULT 0,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 1,
  `isFeatured` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_settings`
--

CREATE TABLE `menu_settings` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `theme` varchar(50) DEFAULT 'default',
  `primaryColor` varchar(20) DEFAULT '#1a73e8',
  `secondaryColor` varchar(20) DEFAULT '#34a853',
  `fontFamily` varchar(100) DEFAULT 'Inter, sans-serif',
  `logoUrl` varchar(255) DEFAULT NULL,
  `bannerUrl` varchar(255) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'NGN',
  `showPrices` tinyint(1) DEFAULT 1,
  `enableOrdering` tinyint(1) DEFAULT 0,
  `qrCodeStyle` varchar(20) DEFAULT 'standard',
  `lastUpdated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `basePrice` decimal(10,2) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `modules`
--

INSERT INTO `modules` (`id`, `name`, `description`, `type`, `basePrice`, `isActive`, `createdAt`, `updatedAt`) VALUES
('7f2d8c1a-3595-11f0-9207-db0ca828cf96', 'Booking Management', 'Manage guest bookings and reservations', 'CORE', 0.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2d9b4e-3595-11f0-9207-db0ca828cf96', 'Room Management', 'Manage rooms and room units', 'CORE', 0.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2daa82-3595-11f0-9207-db0ca828cf96', 'Payment Processing', 'Process payments and transactions', 'CORE', 0.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2db9c6-3595-11f0-9207-db0ca828cf96', 'Staff Management', 'Manage staff and permissions', 'ADDON', 5000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2dc8fa-3595-11f0-9207-db0ca828cf96', 'Analytics', 'View analytics and reports', 'ADDON', 5000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2dd82e-3595-11f0-9207-db0ca828cf96', 'Channel Manager', 'Manage multiple booking channels', 'ADDON', 10000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2de762-3595-11f0-9207-db0ca828cf96', 'Revenue Management', 'Optimize pricing and revenue', 'ADDON', 10000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2df696-3595-11f0-9207-db0ca828cf96', 'FACILITY_MANAGEMENT', 'Track facility maintenance tasks', 'ADDON', 5000.00, 1, '2025-05-20 17:17:41', '2026-01-28 09:04:52'),
('7f2e05ca-3595-11f0-9207-db0ca828cf96', 'CCTV', 'CCTV system integration', 'ADDON', 10000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2e14fe-3595-11f0-9207-db0ca828cf96', 'WiFi', 'WiFi management and monitoring', 'ADDON', 5000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2e2432-3595-11f0-9207-db0ca828cf96', 'QR Menu', 'Digital QR menu system', 'PREMIUM', 5000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('7f2e3366-3595-11f0-9207-db0ca828cf96', 'POS', 'Point of Sale system', 'PREMIUM', 10000.00, 1, '2025-05-20 17:17:41', '2025-05-20 17:17:41');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `recipient` varchar(50) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `senderId` varchar(36) DEFAULT NULL,
  `metadata` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'UNREAD',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `title`, `content`, `type`, `recipient`, `userId`, `senderId`, `metadata`, `status`, `createdAt`, `updatedAt`) VALUES
('1e893c31-bec8-4913-bb2a-6b2bee71546d', 'Task Completed', 'Task completed: Send in your report', 'MAINTENANCE', 'USER', '5fe7159f-3df1-4508-90df-d45fbeb1efad', '1a5c4d20-34ed-11f0-9f7f-5fe7685262f6', '{\"taskId\":\"9695f0e5-1694-43d6-8510-c25be7333287\",\"hotelId\":\"06a129c4-348f-11f0-b65f-9f7e9986d28a\",\"action\":\"completed\",\"entityType\":\"task\"}', 'UNREAD', '2026-01-28 13:18:41', '2026-01-28 13:18:41'),
('7ef6ef41-3d83-40e6-84f2-583e457b03ea', 'New Staff Member Added', 'Fortune Precious has been added as Receptionist', 'SYSTEM', 'STAFF', 'e3580441-db39-11f0-9c7c-f0b61e9d0e9e', 'e3580441-db39-11f0-9c7c-f0b61e9d0e9e', '{\"action\":\"staff_created\",\"staffName\":\"Fortune Precious\",\"position\":\"Receptionist\"}', 'UNREAD', '2026-01-27 22:39:42', '2026-01-27 22:39:42'),
('84600388-6119-4587-8c5d-8fafad95c5c4', 'New Task Assigned', 'You have been assigned a new task: Send in your report', 'MAINTENANCE', 'STAFF', '5fe7159f-3df1-4508-90df-d45fbeb1efad', 'e3580441-db39-11f0-9c7c-f0b61e9d0e9e', '{\"action\":\"task_assigned\",\"taskTitle\":\"Send in your report\",\"dueDate\":\"2026-01-27T12:59\"}', 'READ', '2026-01-27 22:40:45', '2026-01-28 09:10:26'),
('8acb48cb-181f-4a68-a561-41475f81bfbe', 'Task Completed', 'Task completed: Send in your report', 'MAINTENANCE', 'USER', 'e3580441-db39-11f0-9c7c-f0b61e9d0e9e', '1a5c4d20-34ed-11f0-9f7f-5fe7685262f6', '{\"taskId\":\"9695f0e5-1694-43d6-8510-c25be7333287\",\"hotelId\":\"06a129c4-348f-11f0-b65f-9f7e9986d28a\",\"action\":\"completed\",\"entityType\":\"task\"}', 'UNREAD', '2026-01-28 13:18:41', '2026-01-28 13:18:41'),
('aa1a47ed-9aeb-4e3d-8767-28a101c62514', 'Task Completed', 'Task completed: Send in your report', 'MAINTENANCE', 'USER', 'de5cf460-e2a7-465d-825a-02212854c180', '1a5c4d20-34ed-11f0-9f7f-5fe7685262f6', '{\"taskId\":\"9695f0e5-1694-43d6-8510-c25be7333287\",\"hotelId\":\"06a129c4-348f-11f0-b65f-9f7e9986d28a\",\"action\":\"completed\",\"entityType\":\"task\"}', 'UNREAD', '2026-01-28 13:18:41', '2026-01-28 13:18:41'),
('d0f80cee-be90-4b71-8074-882682a963ca', 'Task Completed', 'Task completed: Send in your report', 'MAINTENANCE', 'USER', '1a5c4d20-34ed-11f0-9f7f-5fe7685262f6', '1a5c4d20-34ed-11f0-9f7f-5fe7685262f6', '{\"taskId\":\"9695f0e5-1694-43d6-8510-c25be7333287\",\"action\":\"completed\",\"entityType\":\"task\"}', 'UNREAD', '2026-01-28 13:18:41', '2026-01-28 13:18:41'),
('e0728f4e-2438-4be6-b60b-c2ed377b2a7f', 'Booking Confirmed', 'Your booking at Bluxton Hill for Executive Room has been confirmed. Check-in: 2026-01-27, Check-out: 2026-01-29. Total: ₦40,000', 'BOOKING', 'CUSTOMERS', '6efa9852-db59-11f0-9764-10653019422e', NULL, '{\"bookingId\":\"df52f56f-579c-4377-b923-9c45143db2f5\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Executive Room\",\"checkInDate\":\"2026-01-27\",\"checkOutDate\":\"2026-01-29\",\"totalAmount\":40000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}', 'UNREAD', '2026-01-27 16:47:26', '2026-01-27 16:47:26');

-- --------------------------------------------------------

--
-- Table structure for table `notification_preferences`
--

CREATE TABLE `notification_preferences` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `emailEnabled` tinyint(1) DEFAULT 1,
  `pushEnabled` tinyint(1) DEFAULT 1,
  `inAppEnabled` tinyint(1) DEFAULT 1,
  `subscribedTypes` text DEFAULT NULL,
  `unsubscribedTypes` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `bookingId` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL,
  `paymentMethod` varchar(50) DEFAULT 'card',
  `transactionId` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(10) DEFAULT 'NGN',
  `transaction_reference` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `subscription_plan_id` varchar(36) DEFAULT NULL,
  `vendor_id` varchar(36) DEFAULT NULL,
  `customer_id` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_settings`
--

CREATE TABLE `payment_settings` (
  `id` varchar(36) NOT NULL,
  `defaultTaxRate` decimal(5,2) DEFAULT 5.00,
  `defaultCommissionRate` decimal(5,2) DEFAULT 10.00,
  `defaultCurrency` varchar(10) DEFAULT 'NGN',
  `paymentMethods` longtext DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `paystack_configurations`
--

CREATE TABLE `paystack_configurations` (
  `id` varchar(36) NOT NULL,
  `publicKey` varchar(255) NOT NULL,
  `secretKey` varchar(255) NOT NULL,
  `isTest` tinyint(1) NOT NULL DEFAULT 1,
  `isDefault` tinyint(1) NOT NULL DEFAULT 1,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `webhookSecret` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `paystack_settings`
--

CREATE TABLE `paystack_settings` (
  `id` varchar(36) NOT NULL,
  `livePublicKey` varchar(255) DEFAULT NULL,
  `liveSecretKey` varchar(255) DEFAULT NULL,
  `testPublicKey` varchar(255) DEFAULT NULL,
  `testSecretKey` varchar(255) DEFAULT NULL,
  `isLive` tinyint(1) DEFAULT 0,
  `webhookUrl` varchar(255) DEFAULT NULL,
  `webhookSecret` varchar(255) DEFAULT NULL,
  `isEnabled` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plan_features`
--

CREATE TABLE `plan_features` (
  `id` varchar(36) NOT NULL,
  `planId` varchar(36) NOT NULL,
  `moduleId` varchar(36) NOT NULL,
  `isIncluded` tinyint(1) DEFAULT 0,
  `limits` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `plan_features`
--

INSERT INTO `plan_features` (`id`, `planId`, `moduleId`, `isIncluded`, `limits`, `createdAt`, `updatedAt`) VALUES
('001a-1e7c-9b4a-BOOKING', '1e7c9b4a-359f-11f0-b65f-9f7e9986d28a', '7f2d8c1a-3595-11f0-9207-db0ca828cf96', 1, '{\"bookings_per_month\": 10}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('001b-3f9a-5c2d-BOOKING', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2d8c1a-3595-11f0-9207-db0ca828cf96', 1, '{\"bookings_per_month\": 100}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('001c-5d8f-4c1b-BOOKING', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2d8c1a-3595-11f0-9207-db0ca828cf96', 1, '{\"bookings_per_month\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('001d-9c9b-8d5a-BOOKING', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2d8c1a-3595-11f0-9207-db0ca828cf96', 1, '{\"bookings_per_month\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('002a-1e7c-9b4a-ROOM', '1e7c9b4a-359f-11f0-b65f-9f7e9986d28a', '7f2d9b4e-3595-11f0-9207-db0ca828cf96', 1, '{\"rooms\": 5}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('002b-3f9a-5c2d-ROOM', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2d9b4e-3595-11f0-9207-db0ca828cf96', 1, '{\"rooms\": 20}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('002c-5d8f-4c1b-ROOM', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2d9b4e-3595-11f0-9207-db0ca828cf96', 1, '{\"rooms\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('002d-9c9b-8d5a-ROOM', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2d9b4e-3595-11f0-9207-db0ca828cf96', 1, '{\"rooms\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('003a-1e7c-9b4a-PAYMENT', '1e7c9b4a-359f-11f0-b65f-9f7e9986d28a', '7f2daa82-3595-11f0-9207-db0ca828cf96', 1, '{\"transactions\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('003b-3f9a-5c2d-PAYMENT', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2daa82-3595-11f0-9207-db0ca828cf96', 1, '{\"transactions\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('003c-5d8f-4c1b-PAYMENT', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2daa82-3595-11f0-9207-db0ca828cf96', 1, '{\"transactions\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('003d-9c9b-8d5a-PAYMENT', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2daa82-3595-11f0-9207-db0ca828cf96', 1, '{\"transactions\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('004a-1e7c-9b4a-STAFF', '1e7c9b4a-359f-11f0-b65f-9f7e9986d28a', '7f2db9c6-3595-11f0-9207-db0ca828cf96', 1, '{\"staff_members\": 2}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('004b-3f9a-5c2d-STAFF', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2db9c6-3595-11f0-9207-db0ca828cf96', 1, '{\"staff_members\": 5}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('004c-5d8f-4c1b-STAFF', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2db9c6-3595-11f0-9207-db0ca828cf96', 1, '{\"staff_members\": 10}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('004d-9c9b-8d5a-STAFF', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2db9c6-3595-11f0-9207-db0ca828cf96', 1, '{\"staff_members\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('005a-1e7c-9b4a-ANALYTICS', '1e7c9b4a-359f-11f0-b65f-9f7e9986d28a', '7f2dc8fa-3595-11f0-9207-db0ca828cf96', 1, '{\"data_retention\": 5}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('005b-3f9a-5c2d-ANALYTICS', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2dc8fa-3595-11f0-9207-db0ca828cf96', 1, '{\"data_retention\": 12}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('005c-5d8f-4c1b-ANALYTICS', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2dc8fa-3595-11f0-9207-db0ca828cf96', 1, '{\"data_retention\": 24}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('005d-9c9b-8d5a-ANALYTICS', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2dc8fa-3595-11f0-9207-db0ca828cf96', 1, '{\"data_retention\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('006b-3f9a-5c2d-CHANNEL', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2dd82e-3595-11f0-9207-db0ca828cf96', 1, '{\"channels\": 2}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('006c-5d8f-4c1b-CHANNEL', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2dd82e-3595-11f0-9207-db0ca828cf96', 1, '{\"channels\": 5}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('006d-9c9b-8d5a-CHANNEL', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2dd82e-3595-11f0-9207-db0ca828cf96', 1, '{\"channels\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('007b-3f9a-5c2d-WIFI', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2e14fe-3595-11f0-9207-db0ca828cf96', 1, '{\"networks\": 10}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('007c-5d8f-4c1b-REVENUE', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2de762-3595-11f0-9207-db0ca828cf96', 1, '{\"price_rules\": 10}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('007d-9c9b-8d5a-REVENUE', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2de762-3595-11f0-9207-db0ca828cf96', 1, '{\"price_rules\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('008b-3f9a-5c2d-QRMENU', '3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', '7f2e2432-3595-11f0-9207-db0ca828cf96', 1, '{\"menus\": 50}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('008c-5d8f-4c1b-MAINT', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2df696-3595-11f0-9207-db0ca828cf96', 1, '{\"tasks\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('008d-9c9b-8d5a-MAINT', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2df696-3595-11f0-9207-db0ca828cf96', 1, '{\"tasks\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('009c-5d8f-4c1b-CCTV', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2e05ca-3595-11f0-9207-db0ca828cf96', 1, '{\"cameras\": 10}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('009d-9c9b-8d5a-CCTV', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2e05ca-3595-11f0-9207-db0ca828cf96', 1, '{\"cameras\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('010c-5d8f-4c1b-WIFI', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2e14fe-3595-11f0-9207-db0ca828cf96', 1, '{\"networks\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('010d-9c9b-8d5a-WIFI', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2e14fe-3595-11f0-9207-db0ca828cf96', 1, '{\"networks\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('011c-5d8f-4c1b-QRMENU', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', '7f2e2432-3595-11f0-9207-db0ca828cf96', 1, '{\"menus\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('011d-9c9b-8d5a-QRMENU', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2e2432-3595-11f0-9207-db0ca828cf96', 1, '{\"menus\": \"unlimited\"}', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('012d-9c9b-8d5a-POS', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', '7f2e3366-3595-11f0-9207-db0ca828cf96', 1, '{\"terminals\": \"unlimited\", \"api_access\": true}', '2025-05-20 17:17:41', '2025-05-20 17:17:41');

-- --------------------------------------------------------

--
-- Table structure for table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `expirationTime` bigint(20) DEFAULT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `capacity` int(11) NOT NULL,
  `pricePerNight` decimal(10,2) NOT NULL,
  `discountedPrice` decimal(10,2) DEFAULT NULL,
  `images` text DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `roomNumbers` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `hotelId`, `name`, `type`, `description`, `capacity`, `pricePerNight`, `discountedPrice`, `images`, `status`, `roomNumbers`, `createdAt`, `updatedAt`) VALUES
('f4853f3e-3595-11f0-9207-db0ca828cf96', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Standard Room', 'Standard', 'Comfortable room with city view', 2, 18000.00, NULL, NULL, 'available', '[\"101\", \"102\", \"203\", \"205\", \"207\", \"302\", \"308\", \"303\", \"305\"]', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('f4867610-3595-11f0-9207-db0ca828cf96', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Executive Room', 'Executive', 'Spacious executive room with premium amenities', 2, 20000.00, NULL, NULL, 'available', '[\"204\", \"206\", \"202\", \"303\", \"307\", \"309\", \"311\"]', '2025-05-20 17:17:41', '2025-05-20 17:17:41'),
('f487851e-3595-11f0-9207-db0ca828cf96', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Lounge Room', 'Lounge Room', 'Comfortable lounge with seating area and premium services', 2, 25000.00, 25000.00, '[\"/uploads/hotels/06a129c4-348f-11f0-b65f-9f7e9986d28a/rooms/9c9ca9ea-0d64-472c-a5ed-c0409bf7e25e.jpg\",\"/uploads/hotels/06a129c4-348f-11f0-b65f-9f7e9986d28a/rooms/b0163468-f883-4eda-883e-214fc67529df.JPG\"]', 'available', '[\"306\"]', '2025-05-20 17:17:41', '2025-05-21 14:52:00'),
('f488fd04-3595-11f0-9207-db0ca828cf96', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Mini Suite', 'Mini-Suite', 'Luxury mini-suite with separate living area', 3, 30000.00, NULL, NULL, 'available', '[\"201\"]', '2025-05-20 17:17:41', '2025-05-20 17:17:41');

-- --------------------------------------------------------

--
-- Table structure for table `room_amenities`
--

CREATE TABLE `room_amenities` (
  `id` varchar(36) NOT NULL,
  `roomId` varchar(36) NOT NULL,
  `amenityId` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_units`
--

CREATE TABLE `room_units` (
  `id` varchar(36) NOT NULL,
  `roomId` varchar(36) NOT NULL,
  `roomNumber` varchar(20) NOT NULL,
  `status` enum('available','occupied','maintenance','reserved','cleaning') DEFAULT 'available',
  `currentBookingId` varchar(36) DEFAULT NULL,
  `lastCleanedAt` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_units`
--

INSERT INTO `room_units` (`id`, `roomId`, `roomNumber`, `status`, `currentBookingId`, `lastCleanedAt`, `notes`, `createdAt`, `updatedAt`) VALUES
('97874240-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '101', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('97878d9a-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '102', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('97878f34-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '203', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('9787904c-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '205', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('9787911e-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '207', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('978791dc-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '302', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('9787929a-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '303', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('9787933a-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '305', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('978793d0-35b9-11f0-8cf5-f19e416d5e91', 'f4853f3e-3595-11f0-9207-db0ca828cf96', '308', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('97893b36-35b9-11f0-8cf5-f19e416d5e91', 'f4867610-3595-11f0-9207-db0ca828cf96', '202', 'reserved', 'df52f56f-579c-4377-b923-9c45143db2f5', NULL, NULL, '2025-05-20 20:32:47', '2026-01-27 15:47:26'),
('97893e60-35b9-11f0-8cf5-f19e416d5e91', 'f4867610-3595-11f0-9207-db0ca828cf96', '204', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('97893f3c-35b9-11f0-8cf5-f19e416d5e91', 'f4867610-3595-11f0-9207-db0ca828cf96', '206', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('97893ffa-35b9-11f0-8cf5-f19e416d5e91', 'f4867610-3595-11f0-9207-db0ca828cf96', '303', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('978940a4-35b9-11f0-8cf5-f19e416d5e91', 'f4867610-3595-11f0-9207-db0ca828cf96', '307', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2026-01-26 09:58:39'),
('9789413a-35b9-11f0-8cf5-f19e416d5e91', 'f4867610-3595-11f0-9207-db0ca828cf96', '309', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('978941da-35b9-11f0-8cf5-f19e416d5e91', 'f4867610-3595-11f0-9207-db0ca828cf96', '311', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('978a27d0-35b9-11f0-8cf5-f19e416d5e91', 'f487851e-3595-11f0-9207-db0ca828cf96', '306', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47'),
('978fb42a-35b9-11f0-8cf5-f19e416d5e91', 'f488fd04-3595-11f0-9207-db0ca828cf96', '201', 'available', NULL, NULL, NULL, '2025-05-20 20:32:47', '2025-05-20 20:32:47');

-- --------------------------------------------------------

--
-- Table structure for table `security_settings`
--

CREATE TABLE `security_settings` (
  `id` varchar(36) NOT NULL,
  `twoFactorAuthEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `passwordPolicy` longtext DEFAULT NULL,
  `loginAttempts` int(11) DEFAULT 5,
  `lockoutDuration` int(11) DEFAULT 30,
  `jwtSecret` varchar(255) DEFAULT NULL,
  `jwtExpiry` int(11) DEFAULT 86400,
  `sessionTimeout` int(11) DEFAULT 3600,
  `allowedIPs` text DEFAULT NULL,
  `blockedIPs` text DEFAULT NULL,
  `corsOrigins` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seo_settings`
--

CREATE TABLE `seo_settings` (
  `id` varchar(36) NOT NULL,
  `metaTitle` varchar(255) DEFAULT NULL,
  `metaDescription` text DEFAULT NULL,
  `metaKeywords` text DEFAULT NULL,
  `ogTitle` varchar(255) DEFAULT NULL,
  `ogDescription` text DEFAULT NULL,
  `ogImage` varchar(255) DEFAULT NULL,
  `twitterHandle` varchar(255) DEFAULT NULL,
  `canonicalUrl` varchar(255) DEFAULT NULL,
  `robotsTxt` text DEFAULT NULL,
  `structuredData` text DEFAULT NULL,
  `googleAnalyticsId` varchar(255) DEFAULT NULL,
  `googleTagManagerId` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` varchar(36) NOT NULL,
  `siteName` varchar(255) NOT NULL DEFAULT 'Qaras Hotels',
  `siteDescription` text DEFAULT NULL,
  `defaultLanguage` varchar(10) DEFAULT 'en',
  `timezone` varchar(50) DEFAULT 'UTC',
  `defaultCurrency` varchar(10) DEFAULT 'NGN',
  `maintenanceMode` tinyint(1) NOT NULL DEFAULT 0,
  `maintenanceMsg` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `smtp_settings`
--

CREATE TABLE `smtp_settings` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) DEFAULT NULL,
  `host` varchar(255) NOT NULL,
  `port` int(11) NOT NULL DEFAULT 587,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fromEmail` varchar(255) NOT NULL,
  `fromName` varchar(255) NOT NULL,
  `encryption` enum('none','ssl','tls') DEFAULT 'tls',
  `isDefault` tinyint(1) NOT NULL DEFAULT 1,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `vendorId` varchar(36) DEFAULT NULL,
  `hotelId` varchar(36) DEFAULT NULL,
  `position` varchar(100) NOT NULL,
  `permissions` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `userId`, `vendorId`, `hotelId`, `position`, `permissions`, `createdAt`, `updatedAt`) VALUES
('5fa39a9b-825b-464a-9db3-202844d926f2', '5fe7159f-3df1-4508-90df-d45fbeb1efad', '327781f0-3558-11f0-808a-f39922e0fe56', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Receptionist', '[\"bookings\",\"customers\",\"tasks\",\"reports\"]', '2026-01-27 22:39:42', '2026-01-27 22:39:42'),
('e2e62c10-4ae2-408f-aaa9-c066f393d531', 'de5cf460-e2a7-465d-825a-02212854c180', '327781f0-3558-11f0-808a-f39922e0fe56', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Waitstaff', '[\"reports\",\"customers\",\"tasks\"]', '2026-01-28 09:28:15', '2026-01-28 09:30:59'),
('e3580441-db39-11f0-9c7c-f0b61e9d0e9e', 'e3580441-db39-11f0-9c7c-f0b61e9d0e9e', '327781f0-3558-11f0-808a-f39922e0fe56', '06a129c4-348f-11f0-b65f-9f7e9986d28a', 'Supervisor', '[\"bookings\", \"rooms\", \"customers\", \"payments\", \"reports\", \"staff\", \"tasks\"]', '2025-05-21 12:00:00', '2025-05-21 12:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_payments`
--

CREATE TABLE `subscription_payments` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) NOT NULL,
  `subscriptionPlanId` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentReference` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `paymentDate` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `billingCycle` varchar(20) NOT NULL,
  `features` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `description`, `price`, `billingCycle`, `features`, `isActive`, `createdAt`, `updatedAt`) VALUES
('1e7c9b4a-359f-11f0-b65f-9f7e9986d28a', 'Free Plan', 'Perfect for getting started', 0.00, 'MONTHLY', '[\"Booking Management\", \"Room Management\", \"Payment Processing\"]', 1, '2025-05-19 09:55:34', '2025-05-19 09:55:34'),
('3f9a5c2d-359f-11f0-b65f-9f7e9986d28a', 'Basic Plan', 'Great for small hotels', 15000.00, 'MONTHLY', '[\"Booking Management\", \"Room Management\", \"Payment Processing\", \"Staff Management\", \"Analytics\"]', 1, '2025-05-19 09:55:34', '2025-05-19 09:55:34'),
('5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', 'Professional Plan', 'Ideal for established hotels', 35000.00, 'MONTHLY', '[\"Booking Management\", \"Room Management\", \"Payment Processing\", \"Staff Management\", \"Analytics\", \"Channel Manager\", \"Revenue Management\", \"Maintenance\", \"WiFi\"]', 1, '2025-05-19 09:55:34', '2025-05-19 09:55:34'),
('9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', 'Enterprise Plan', 'Complete solution for large hotels', 75000.00, 'MONTHLY', '[\"Booking Management\", \"Room Management\", \"Payment Processing\", \"Staff Management\", \"Analytics\", \"Channel Manager\", \"Revenue Management\", \"Maintenance\", \"CCTV\", \"WiFi\", \"QR Menu\", \"POS\"]', 1, '2025-05-19 09:55:34', '2025-05-19 09:55:34');

-- --------------------------------------------------------

--
-- Table structure for table `super_admins`
--

CREATE TABLE `super_admins` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `super_admins`
--

INSERT INTO `super_admins` (`id`, `userId`, `createdAt`, `updatedAt`) VALUES
('7c2e8f5d-34ed-11f0-9f7f-5fe7685262f6', '06c0d08e-34ed-11f0-9f7f-5fe7685262f6', '2025-05-20 11:00:00', '2025-05-20 11:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `task_comments`
--

CREATE TABLE `task_comments` (
  `commentId` int(11) NOT NULL,
  `taskId` varchar(50) NOT NULL,
  `staffId` varchar(50) NOT NULL,
  `comment_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_settings`
--

CREATE TABLE `theme_settings` (
  `id` varchar(36) NOT NULL,
  `colorPalette` text DEFAULT NULL,
  `typography` text DEFAULT NULL,
  `buttons` text DEFAULT NULL,
  `layout` text DEFAULT NULL,
  `customCSS` text DEFAULT NULL,
  `logoUrl` varchar(255) DEFAULT NULL,
  `faviconUrl` varchar(255) DEFAULT NULL,
  `loginBannerUrl` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `emailVerified` datetime DEFAULT NULL,
  `lastLoginAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `firstName`, `lastName`, `email`, `password`, `role`, `isActive`, `emailVerified`, `lastLoginAt`, `createdAt`, `updatedAt`) VALUES
('06c0d08e-34ed-11f0-9f7f-5fe7685262f6', 'Admin User', 'Admin', 'User', 'admin@qarashotels.com.ng', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'SUPER_ADMIN', 1, '2025-05-20 12:00:00', '2026-01-27 10:00:00', '2025-05-20 11:00:00', '2025-05-20 11:00:00'),
('1a5c4d20-34ed-11f0-9f7f-5fe7685262f6', 'Vendor User', 'Vendor', 'User', 'vendor@qarashotels.com.ng', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'VENDOR', 1, '2025-05-20 12:00:00', '2026-01-28 09:21:28', '2025-05-20 11:30:00', '2026-01-28 09:21:28'),
('3b7f9e4c-34ed-11f0-9f7f-5fe7685262f6', 'Customer User', 'Customer', 'User', 'customer@example.com', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'CUSTOMER', 1, '2025-05-21 12:00:00', '2026-01-25 09:15:00', '2025-05-21 11:00:00', '2025-05-21 11:00:00'),
('5fe7159f-3df1-4508-90df-d45fbeb1efad', 'Fortune Precious', 'Fortune', 'Precious', 'fortuneprecious@gmail.com', '$2b$10$6iX7PzvddzvVRcQLogHJee.rGWH1Xqg8PJDs4GwZZC8qFUpbJE14C', 'STAFF', 1, NULL, '2026-01-28 08:33:54', '2026-01-27 22:39:42', '2026-01-28 08:33:54'),
('6efa9852-db59-11f0-9764-10653019422e', 'Frequent Guest', 'Guest', 'One', 'guest1@example.com', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'CUSTOMER', 1, '2025-12-17 16:02:00', '2026-01-15 11:30:00', '2025-12-17 16:02:40', '2025-12-17 16:02:40'),
('8253b6dc-34ed-11f0-9f7f-5fe7685262f6', 'Staff User', 'Staff', 'User', 'staff@qarashotels.com.ng', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'STAFF', 1, '2025-05-21 12:00:00', '2026-01-26 13:45:00', '2025-05-21 11:00:00', '2025-05-21 11:00:00'),
('92d4deb3-aa00-4b4b-9568-bf9f319ce67c', 'Fortune Precious', 'Fortune', 'Precious', 'fortune@example.com', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'CUSTOMER', 1, '2026-01-08 14:03:00', '2026-01-23 07:48:00', '2026-01-08 14:03:34', '2026-01-23 07:48:32'),
('bf160a57-da52-11f0-a35e-10653019422e', 'Guest Three', 'Guest', 'Three', 'guest3@example.com', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'CUSTOMER', 1, '2025-12-16 08:42:00', '2025-12-20 10:15:00', '2025-12-16 08:42:17', '2025-12-16 08:42:17'),
('c6c181b0-db39-11f0-9c7c-f0b61e9d0e9e', 'Guest Two', 'Guest', 'Two', 'guest2@example.com', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'CUSTOMER', 1, '2025-12-17 12:15:00', '2026-01-20 15:22:00', '2025-12-17 12:15:50', '2026-01-07 17:04:45'),
('de5cf460-e2a7-465d-825a-02212854c180', 'John Maxwell', NULL, NULL, 'john.maxwell@gmail.com', '$2b$12$NAOVYsWIgdVRRD2JRa13we8gblWlSpYcslXkvoxl6Y1k1BF5w7RgO', 'STAFF', 1, NULL, NULL, '2026-01-28 09:28:15', '2026-01-28 09:28:15'),
('e3580441-db39-11f0-9c7c-f0b61e9d0e9e', 'Supervisor Staff', 'Super', 'Visor', 'supervisor@qarashotels.com.ng', '$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.', 'STAFF', 1, '2025-12-17 08:00:00', '2026-01-27 16:49:30', '2025-12-17 08:15:20', '2026-01-27 16:49:30');

-- --------------------------------------------------------

--
-- Table structure for table `vapid_keys`
--

CREATE TABLE `vapid_keys` (
  `id` varchar(36) NOT NULL,
  `publicKey` varchar(255) NOT NULL,
  `privateKey` varchar(255) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `companyName` varchar(255) DEFAULT NULL,
  `businessAddress` text DEFAULT NULL,
  `businessPhone` varchar(50) DEFAULT NULL,
  `taxId` varchar(50) DEFAULT NULL,
  `subscriptionPlanId` varchar(36) DEFAULT NULL,
  `subscriptionStatus` varchar(20) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `userId`, `companyName`, `businessAddress`, `businessPhone`, `taxId`, `subscriptionPlanId`, `subscriptionStatus`, `createdAt`, `updatedAt`) VALUES
('327781f0-3558-11f0-808a-f39922e0fe56', '1a5c4d20-34ed-11f0-9f7f-5fe7685262f6', 'Qaras Hotels Group', '5 Business Plaza, Port Harcourt', '+2348012345678', 'TAX-12345-6789', '5d8f4c1b-359f-11f0-b65f-9f7e9986d28a', 'ACTIVE', '2025-05-19 09:55:34', '2025-12-18 10:30:00'),
('3a7e9b2f-3558-11f0-808a-f39922e0fe56', '3b7f9e4c-34ed-11f0-9f7f-5fe7685262f6', 'Qaras Hotels', 'Port Harcourt', '+2348012345679', 'TAX-12345-6790', '9c9b8d5a-359f-11f0-b65f-9f7e9986d28a', 'ACTIVE', '2025-05-19 09:55:34', '2025-12-18 10:35:00');

-- --------------------------------------------------------

--
-- Table structure for table `wifi_credentials`
--

CREATE TABLE `wifi_credentials` (
  `id` varchar(36) NOT NULL,
  `networkId` varchar(36) DEFAULT NULL,
  `hotelId` varchar(36) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `validFrom` datetime NOT NULL,
  `validUntil` datetime DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wifi_networks`
--

CREATE TABLE `wifi_networks` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `networkName` varchar(255) NOT NULL,
  `securityType` varchar(50) NOT NULL DEFAULT 'WPA2',
  `isPublic` tinyint(1) DEFAULT 0,
  `isEnabled` tinyint(1) DEFAULT 1,
  `bandwidthLimit` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `locationArea` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `amenities`
--
ALTER TABLE `amenities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `analytics_settings`
--
ALTER TABLE `analytics_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`),
  ADD KEY `key_2` (`key`),
  ADD KEY `group` (`group`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotelId` (`hotelId`),
  ADD KEY `roomId` (`roomUnitId`),
  ADD KEY `customerId` (`customerId`);

--
-- Indexes for table `booking_documents`
--
ALTER TABLE `booking_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_documents_booking_idx` (`bookingId`);

--
-- Indexes for table `cookie_settings`
--
ALTER TABLE `cookie_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`),
  ADD KEY `idx_customers_hotelId` (`hotelId`);

--
-- Indexes for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendorId` (`vendorId`),
  ADD KEY `template_key` (`template_key`);

--
-- Indexes for table `facility_tasks`
--
ALTER TABLE `facility_tasks`
  ADD PRIMARY KEY (`taskId`),
  ADD KEY `fk_hotel_1` (`hotelId`),
  ADD KEY `fk_staff_1` (`staffId`),
  ADD KEY `fk_room_unit_1` (`roomUnitId`),
  ADD KEY `fk_vendor_1` (`vendorId`);

--
-- Indexes for table `flutterwave_settings`
--
ALTER TABLE `flutterwave_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hotels`
--
ALTER TABLE `hotels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hotels_vendorId` (`vendorId`);

--
-- Indexes for table `hotel_amenities`
--
ALTER TABLE `hotel_amenities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotelId` (`hotelId`),
  ADD KEY `amenityId` (`amenityId`);

--
-- Indexes for table `legal_documents`
--
ALTER TABLE `legal_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `type` (`type`);

--
-- Indexes for table `menu_access_logs`
--
ALTER TABLE `menu_access_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotelId` (`hotelId`);

--
-- Indexes for table `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotelId` (`hotelId`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `menu_settings`
--
ALTER TABLE `menu_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hotelId` (`hotelId`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `senderId` (`senderId`);

--
-- Indexes for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`);

--
-- Indexes for table `payment_settings`
--
ALTER TABLE `payment_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `paystack_configurations`
--
ALTER TABLE `paystack_configurations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `paystack_settings`
--
ALTER TABLE `paystack_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `plan_features`
--
ALTER TABLE `plan_features`
  ADD PRIMARY KEY (`id`),
  ADD KEY `planId` (`planId`),
  ADD KEY `moduleId` (`moduleId`);

--
-- Indexes for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `endpoint` (`endpoint`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotelId` (`hotelId`);

--
-- Indexes for table `room_amenities`
--
ALTER TABLE `room_amenities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `roomId` (`roomId`),
  ADD KEY `amenityId` (`amenityId`);

--
-- Indexes for table `room_units`
--
ALTER TABLE `room_units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `roomId` (`roomId`),
  ADD KEY `currentBookingId` (`currentBookingId`);

--
-- Indexes for table `security_settings`
--
ALTER TABLE `security_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seo_settings`
--
ALTER TABLE `seo_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `smtp_settings`
--
ALTER TABLE `smtp_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendorId` (`vendorId`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`),
  ADD KEY `vendorId` (`vendorId`),
  ADD KEY `hotelId` (`hotelId`);

--
-- Indexes for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subscription_payments_vendor` (`vendorId`),
  ADD KEY `idx_subscription_payments_plan` (`subscriptionPlanId`),
  ADD KEY `idx_subscription_payments_date` (`paymentDate`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `super_admins`
--
ALTER TABLE `super_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`);

--
-- Indexes for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD PRIMARY KEY (`commentId`),
  ADD KEY `taskId` (`taskId`),
  ADD KEY `staffId` (`staffId`);

--
-- Indexes for table `theme_settings`
--
ALTER TABLE `theme_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vapid_keys`
--
ALTER TABLE `vapid_keys`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`);

--
-- Indexes for table `wifi_credentials`
--
ALTER TABLE `wifi_credentials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotelId` (`hotelId`),
  ADD KEY `networkId` (`networkId`);

--
-- Indexes for table `wifi_networks`
--
ALTER TABLE `wifi_networks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotelId` (`hotelId`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`roomUnitId`) REFERENCES `room_units` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_documents`
--
ALTER TABLE `booking_documents`
  ADD CONSTRAINT `booking_documents_booking_fk` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_customers_hotels` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD CONSTRAINT `email_templates_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `facility_tasks`
--
ALTER TABLE `facility_tasks`
  ADD CONSTRAINT `fk_hotel_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`),
  ADD CONSTRAINT `fk_room_unit_1` FOREIGN KEY (`roomUnitId`) REFERENCES `room_units` (`id`),
  ADD CONSTRAINT `fk_staff_1` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `fk_vendor_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`);

--
-- Constraints for table `hotels`
--
ALTER TABLE `hotels`
  ADD CONSTRAINT `hotels_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hotel_amenities`
--
ALTER TABLE `hotel_amenities`
  ADD CONSTRAINT `hotel_amenities_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hotel_amenities_ibfk_2` FOREIGN KEY (`amenityId`) REFERENCES `amenities` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_access_logs`
--
ALTER TABLE `menu_access_logs`
  ADD CONSTRAINT `menu_access_logs_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD CONSTRAINT `menu_categories_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `menu_categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_settings`
--
ALTER TABLE `menu_settings`
  ADD CONSTRAINT `menu_settings_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `plan_features`
--
ALTER TABLE `plan_features`
  ADD CONSTRAINT `plan_features_ibfk_1` FOREIGN KEY (`planId`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plan_features_ibfk_2` FOREIGN KEY (`moduleId`) REFERENCES `modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_amenities`
--
ALTER TABLE `room_amenities`
  ADD CONSTRAINT `room_amenities_ibfk_1` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_amenities_ibfk_2` FOREIGN KEY (`amenityId`) REFERENCES `amenities` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_units`
--
ALTER TABLE `room_units`
  ADD CONSTRAINT `room_units_ibfk_1` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_units_ibfk_2` FOREIGN KEY (`currentBookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `smtp_settings`
--
ALTER TABLE `smtp_settings`
  ADD CONSTRAINT `smtp_settings_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_ibfk_2` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `staff_ibfk_3` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD CONSTRAINT `subscription_payments_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payments_ibfk_2` FOREIGN KEY (`subscriptionPlanId`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `super_admins`
--
ALTER TABLE `super_admins`
  ADD CONSTRAINT `super_admins_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD CONSTRAINT `fk_comment_task` FOREIGN KEY (`taskId`) REFERENCES `facility_tasks` (`taskId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vendors`
--
ALTER TABLE `vendors`
  ADD CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wifi_credentials`
--
ALTER TABLE `wifi_credentials`
  ADD CONSTRAINT `wifi_credentials_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wifi_credentials_ibfk_2` FOREIGN KEY (`networkId`) REFERENCES `wifi_networks` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `wifi_networks`
--
ALTER TABLE `wifi_networks`
  ADD CONSTRAINT `wifi_networks_ibfk_1` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
