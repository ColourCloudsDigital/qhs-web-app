-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: newschema
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `amenities`
--

DROP TABLE IF EXISTS `amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amenities` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(255) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amenities`
--

LOCK TABLES `amenities` WRITE;
/*!40000 ALTER TABLE `amenities` DISABLE KEYS */;
INSERT INTO `amenities` VALUES ('7f36982e-34f3-11f0-9620-d36ca6faf4d8','WiFi','High-speed wireless internet','wifi','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369b1c-34f3-11f0-9620-d36ca6faf4d8','Swimming Pool','Outdoor swimming pool','pool','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369bb2-34f3-11f0-9620-d36ca6faf4d8','Gym','Fully equipped fitness center','gym','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369c52-34f3-11f0-9620-d36ca6faf4d8','Restaurant','On-site restaurant','restaurant','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369cac-34f3-11f0-9620-d36ca6faf4d8','Conference Room','Meeting and event spaces','meeting-room','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369d06-34f3-11f0-9620-d36ca6faf4d8','Spa','Wellness and spa services','spa','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369d56-34f3-11f0-9620-d36ca6faf4d8','Air Conditioning','Climate control in rooms','ac','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369da6-34f3-11f0-9620-d36ca6faf4d8','TV','Flat-screen television','tv','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369df6-34f3-11f0-9620-d36ca6faf4d8','Mini-bar','In-room refreshments','minibar','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369e5a-34f3-11f0-9620-d36ca6faf4d8','Safe','In-room safe for valuables','safe','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369eaa-34f3-11f0-9620-d36ca6faf4d8','Balcony','Private balcony or terrace','balcony','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369f40-34f3-11f0-9620-d36ca6faf4d8','Bathtub','Bath tub in bathroom','bathtub','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369f86-34f3-11f0-9620-d36ca6faf4d8','Shower','Walk-in shower','shower','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f369fd6-34f3-11f0-9620-d36ca6faf4d8','Room Service','24/7 room service','room-service','ROOM',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f36a026-34f3-11f0-9620-d36ca6faf4d8','Free Parking','Complimentary on-site parking','parking','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46'),('7f36a076-34f3-11f0-9620-d36ca6faf4d8','Breakfast','Complimentary breakfast','breakfast','HOTEL',1,'2025-05-19 21:54:46','2025-05-19 21:54:46');
/*!40000 ALTER TABLE `amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_settings`
--

DROP TABLE IF EXISTS `analytics_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_settings` (
  `id` varchar(36) NOT NULL,
  `googleAnalyticsEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `googleAnalyticsId` varchar(255) DEFAULT NULL,
  `googleTagManagerEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `googleTagManagerId` varchar(255) DEFAULT NULL,
  `facebookPixelEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `facebookPixelId` varchar(255) DEFAULT NULL,
  `hotjarEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `hotjarId` varchar(255) DEFAULT NULL,
  `customScripts` text,
  `dataRetentionPeriod` int DEFAULT '365',
  `anonymizeIp` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_settings`
--

LOCK TABLES `analytics_settings` WRITE;
/*!40000 ALTER TABLE `analytics_settings` DISABLE KEYS */;
INSERT INTO `analytics_settings` VALUES ('33f29890-dbe6-11f0-9764-10653019422e',0,NULL,0,NULL,0,NULL,0,NULL,'{\"enabled\":false,\"headScripts\":\"\",\"bodyStartScripts\":\"\",\"bodyEndScripts\":\"\",\"customScriptsRaw\":\"\"}',365,1,'2025-12-18 08:50:20','2025-12-18 09:22:06',1);
/*!40000 ALTER TABLE `analytics_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text,
  `description` text,
  `type` varchar(50) DEFAULT 'string',
  `group` varchar(100) DEFAULT NULL,
  `isPublic` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `key_2` (`key`),
  KEY `group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_settings`
--

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
INSERT INTO `app_settings` VALUES ('9b45c1d6-3569-11f0-808a-f39922e0fe56','defaultTaxRate','5','Default tax rate for the platform','number','payment',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c500-3569-11f0-808a-f39922e0fe56','defaultCommissionRate','10','Default commission rate for the platform','number','payment',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c622-3569-11f0-808a-f39922e0fe56','contactEmail','support@qarashotels.com','Primary contact email','string','contact',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c6cc-3569-11f0-808a-f39922e0fe56','contactPhone','+234 800 123 4567','Primary contact phone','string','contact',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c76c-3569-11f0-808a-f39922e0fe56','supportEmail','help@qarashotels.com','Support email address','string','contact',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c802-3569-11f0-808a-f39922e0fe56','appVersion','1.0.0','Current app version','string','system',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c898-3569-11f0-808a-f39922e0fe56','termsUrl','/terms','Terms of service URL','string','legal',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c942-3569-11f0-808a-f39922e0fe56','privacyUrl','/privacy','Privacy policy URL','string','legal',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45c9d8-3569-11f0-808a-f39922e0fe56','bookingFee','0','Booking fee amount','number','payment',1,'2025-05-20 12:00:14','2025-05-20 12:00:14'),('9b45ca82-3569-11f0-808a-f39922e0fe56','allowGuestBooking','true','Allow booking without an account','boolean','booking',1,'2025-05-20 12:00:14','2025-05-20 12:00:14');
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_documents`
--

DROP TABLE IF EXISTS `booking_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_documents` (
  `id` varchar(36) NOT NULL,
  `bookingId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_documents_booking_idx` (`bookingId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_documents`
--

LOCK TABLES `booking_documents` WRITE;
/*!40000 ALTER TABLE `booking_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `roomId` varchar(36) NOT NULL,
  `customerId` varchar(36) NOT NULL,
  `checkInDate` date NOT NULL,
  `checkOutDate` date NOT NULL,
  `numberOfGuests` int NOT NULL,
  `numberOfRooms` int NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL,
  `paymentStatus` varchar(50) NOT NULL,
  `specialRequests` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hotelId` (`hotelId`),
  KEY `roomId` (`roomId`),
  KEY `customerId` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES ('0228d7b2-6ffe-42bc-ba1d-c0df7e2b5920','06a129c4-348f-11f0-b65f-9f7e9986d28a','f488fd04-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2025-12-28','2025-12-30',3,0,60000.00,'CANCELLED','PENDING','CANCELLATION: Too much noise (by CUSTOMER)','2025-12-23 10:17:22','2026-01-07 08:56:14'),('02e829e3-d8ee-43f8-88ee-91ec88913e42','06a129c4-348f-11f0-b65f-9f7e9986d28a','f487851e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-13','2026-01-14',4,1,25000.00,'CANCELLED','PENDING','CANCELLATION: I don\'t like how the place looks (by CUSTOMER)','2026-01-12 15:25:37','2026-01-12 16:52:13'),('0cd19d02-ce56-4329-8d02-45c3bbc7d693','06a129c4-348f-11f0-b65f-9f7e9986d28a','f488fd04-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-15','2026-01-17',2,1,60000.00,'CONFIRMED','PENDING','','2026-01-15 14:06:33','2026-01-15 14:06:33'),('0e1754b6-ad3a-4025-ba02-2e2bf31647fb','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-02-03','2026-02-10',2,1,140000.00,'CONFIRMED','PENDING','','2026-01-08 10:57:26','2026-01-08 10:57:26'),('1be1c8c7-bf95-4841-874d-3e63757ee4c5','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-08','2026-01-09',5,2,36000.00,'CHECKED_OUT','PENDING','I need to play some games like Snooker during the day. ','2026-01-09 08:49:42','2026-01-13 16:56:16'),('20017311-7ee2-4e3c-add5-afe734e1605f','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-06','2026-01-08',2,0,40000.00,'CANCELLED','PENDING','CANCELLATION: Mistake (by CUSTOMER)','2026-01-06 12:49:02','2026-01-06 15:21:03'),('2aef1280-156d-490c-b5bc-1ab42bc31ee2','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-09',2,0,80000.00,'CANCELLED','PENDING','CANCELLATION: No reason (by CUSTOMER)','2026-01-05 16:55:09','2026-01-07 08:56:14'),('2be6d2de-85ac-49bb-b095-4e3af9082fd8','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-09','2026-01-14',4,0,100000.00,'CANCELLED','PENDING','','2026-01-06 16:16:31','2026-01-07 08:56:14'),('2dcf805f-222f-4f04-ae02-1bee9a839fc7','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-12','2026-01-14',3,1,40000.00,'CANCELLED','PENDING','CANCELLATION: Mistake in the booking (by CUSTOMER)','2026-01-12 15:05:27','2026-01-12 15:07:31'),('3197b9b6-ef5e-4581-bcb8-6fa2db821e23','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,36000.00,'CANCELLED','PENDING','CANCELLATION: It is far (by CUSTOMER)','2026-01-05 15:43:08','2026-01-07 08:56:14'),('3cf4b595-0643-4809-bf7a-ab9cb9b48199','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-06','2026-01-08',2,0,40000.00,'CANCELLED','PENDING','CANCELLATION: Mistake (by CUSTOMER)','2026-01-06 15:57:43','2026-01-06 15:58:53'),('3f6682b1-3d06-4b51-be24-4cd71876a4e1','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,36000.00,'CANCELLED','PENDING','CANCELLATION: Mistake, I wanted to choose another one (by CUSTOMER)','2026-01-05 15:46:17','2026-01-07 08:56:14'),('53a70e62-0fba-416a-952a-511c0a11cec8','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-07','2026-01-09',2,0,36000.00,'CHECKED_OUT','PENDING','','2026-01-07 11:06:15','2026-01-13 16:56:16'),('5896b281-9696-4866-948d-6399a02f959a','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,36000.00,'CANCELLED','PENDING','CANCELLATION: It was a mistake (by CUSTOMER)','2026-01-05 15:38:36','2026-01-07 08:56:14'),('58dbbc6f-8ac5-434a-940e-2d2551e0726e','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,36000.00,'CANCELLED','PENDING','','2026-01-05 14:24:39','2026-01-07 08:56:14'),('59d45235-51fe-49ec-be8d-36eb37d3ff49','06a129c4-348f-11f0-b65f-9f7e9986d28a','f487851e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2025-12-22','2025-12-24',1,0,50000.00,'CANCELLED','PENDING','','2025-12-22 14:25:45','2026-01-07 08:56:14'),('6e171e8b-b073-433b-add7-d2ac08b1084e','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,36000.00,'CANCELLED','PENDING','','2026-01-05 14:25:22','2026-01-07 08:56:14'),('78b2c29a-9292-4cc9-9275-c9d720c1f64b','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-09','2026-01-10',2,2,36000.00,'CANCELLED','PENDING','Indoor Delivery\n\nCANCELLATION: I have a function and won\'t be able to make it (by CUSTOMER)','2026-01-07 15:16:20','2026-01-08 10:06:57'),('79e29e0c-9b17-476d-928d-f6b535afbb1c','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,36000.00,'CANCELLED','PENDING','','2026-01-05 14:21:54','2026-01-07 08:56:14'),('898a4ade-8954-4d29-87df-9ea573f739f2','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-06','2026-01-08',2,0,40000.00,'CANCELLED','PENDING','','2026-01-06 11:08:06','2026-01-07 08:56:14'),('9fe9f20b-ec80-4a0a-8795-5c7725003228','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-20','2026-01-22',2,1,40000.00,'CONFIRMED','PENDING','','2026-01-15 13:47:54','2026-01-15 13:47:54'),('a3af7f3b-c583-48c9-b71b-8b5e3067a468','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-13','2026-01-14',3,3,54000.00,'CHECKED_OUT','PENDING','Special Room Delivery','2026-01-13 16:48:00','2026-01-15 10:36:46'),('a525c547-0277-4ff5-ba01-fcdd36ce0838','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-15','2026-01-16',4,2,36000.00,'CONFIRMED','PENDING','','2026-01-15 13:05:21','2026-01-15 13:05:21'),('a833b033-c7d8-45ee-8ddb-7791b886df91','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2025-12-23','2025-12-26',2,0,60000.00,'CANCELLED','PENDING','CANCELLATION: Wrong booking (by CUSTOMER)','2025-12-22 10:33:43','2026-01-07 08:56:14'),('a883feb9-fbc2-4179-a8f1-32dcbca3784c','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,36000.00,'CANCELLED','PENDING','','2026-01-05 15:02:01','2026-01-07 08:56:14'),('aec02875-8bae-44e1-ab80-cc4bb2e2794c','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-14','2026-01-15',4,1,20000.00,'CONFIRMED','PENDING','','2026-01-14 08:23:51','2026-01-14 08:23:51'),('be8f487c-6f76-4821-b921-7ee8c436e0a5','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2025-12-17','2025-12-24',2,0,126000.00,'CANCELLED','PENDING','CANCELLATION: Too high of a price, I want something cheaper (by CUSTOMER)','2025-12-17 16:10:52','2026-01-07 08:56:14'),('c1545be9-c59e-4a9e-9522-b066be904d47','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,40000.00,'CANCELLED','PENDING','CANCELLATION: Nothing (by CUSTOMER)','2026-01-05 16:21:01','2026-01-07 08:56:14'),('d89cbb4c-e1c5-492d-988f-c50eea279c6b','06a129c4-348f-11f0-b65f-9f7e9986d28a','f487851e-3595-11f0-9207-db0ca828cf96','0c34c864-3e97-4c4b-8680-2c994d8e2999','2025-05-22','2025-05-24',2,0,50000.00,'CHECKED_OUT','PENDING',NULL,'2025-05-22 17:57:34','2026-01-13 16:56:16'),('d8c18723-e012-4a4a-8dda-918552fc0f57','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-15','2026-01-16',1,1,18000.00,'CONFIRMED','PENDING','','2026-01-13 17:05:00','2026-01-13 17:05:00'),('e0d2653f-b922-4595-8c71-8911fac07759','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-05','2026-01-07',2,0,40000.00,'CANCELLED','PENDING','CANCELLATION: Nothing in particular (by CUSTOMER)','2026-01-05 15:57:20','2026-01-07 08:56:14'),('e28ec6f8-b685-4e04-87dd-31d113cb932c','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-06','2026-01-08',2,0,40000.00,'CANCELLED','PENDING','','2026-01-06 12:05:12','2026-01-07 08:56:14'),('ed4dc22d-396a-4017-9765-2d8cb14bdba7','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-10','2026-01-11',3,1,20000.00,'CANCELLED','PENDING','Room delivery service\n\nCANCELLATION: I have an urgent function and won\'t be able to make it on that day (by CUSTOMER)','2026-01-08 14:48:09','2026-01-09 08:51:37'),('f5494a10-1eb4-4f21-b296-b8c0ad7c34a8','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4867610-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2026-01-09','2026-01-11',4,1,40000.00,'CHECKED_OUT','PENDING','','2026-01-09 11:10:06','2026-01-13 16:56:16'),('fbb18a5c-1e92-46a4-a0de-488a7619aa10','06a129c4-348f-11f0-b65f-9f7e9986d28a','f4853f3e-3595-11f0-9207-db0ca828cf96','6efbd341-db59-11f0-9764-10653019422e','2025-12-22','2025-12-24',2,0,36000.00,'CANCELLED','PENDING','','2025-12-22 09:02:59','2026-01-07 08:56:14');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cookie_settings`
--

DROP TABLE IF EXISTS `cookie_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cookie_settings` (
  `id` varchar(36) NOT NULL,
  `cookieBannerEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `cookiePolicyUrl` varchar(255) DEFAULT NULL,
  `necessaryCookiesDesc` text,
  `preferenceCookiesDesc` text,
  `statisticsCookiesDesc` text,
  `marketingCookiesDesc` text,
  `defaultConsent` json DEFAULT NULL,
  `bannerTitle` varchar(255) DEFAULT 'We use cookies',
  `bannerDescription` text,
  `acceptAllButtonText` varchar(255) DEFAULT 'Accept All',
  `rejectAllButtonText` varchar(255) DEFAULT 'Reject All',
  `savePreferencesButtonText` varchar(255) DEFAULT 'Save Preferences',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cookie_settings`
--

LOCK TABLES `cookie_settings` WRITE;
/*!40000 ALTER TABLE `cookie_settings` DISABLE KEYS */;
INSERT INTO `cookie_settings` VALUES ('7f89af10-356f-11f0-a505-2f6c908f19d1',1,'/cookie-policy','Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website.','Preference cookies enable a website to remember information that changes the way the website behaves or looks.','Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.','Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging.',NULL,'We value your privacy','We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.','Accept All','Reject All','Save Preferences','2025-05-20 12:42:24','2025-05-20 12:43:56');
/*!40000 ALTER TABLE `cookie_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `userId` varchar(36) DEFAULT NULL,
  `hotelId` varchar(36) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  KEY `idx_customers_hotelId` (`hotelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('0c34c864-3e97-4c4b-8680-2c994d8e2999','Bluxton','Hill',NULL,'06a129c4-348f-11f0-b65f-9f7e9986d28a','+2347059992238',NULL,'2025-05-22 17:57:34','2025-05-22 17:57:34'),('3c96ee4e-db31-11f0-9764-10653019422e',NULL,NULL,'8253b6dc-34ed-11f0-9f7f-5fe7685262f6',NULL,NULL,NULL,'2025-12-17 11:14:56','2025-12-17 11:14:56'),('6efbd341-db59-11f0-9764-10653019422e',NULL,NULL,'6efa9852-db59-11f0-9764-10653019422e',NULL,'09133846637',NULL,'2025-12-17 16:02:40','2025-12-17 16:02:40'),('bf168d3d-da52-11f0-a35e-10653019422e',NULL,NULL,'bf160a57-da52-11f0-a35e-10653019422e',NULL,'08062180546','No. 9, AP Miller Street, Abuloma, Port Harcourt','2025-12-16 08:42:17','2025-12-16 08:42:17');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_templates` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) DEFAULT NULL,
  `template_key` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `bodyText` text,
  `variables` text COMMENT 'JSON array of available variables',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vendorId` (`vendorId`),
  KEY `template_key` (`template_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
INSERT INTO `email_templates` VALUES ('7891c838-3721-11f0-bd42-362101a43314',NULL,'booking_confirmation','Booking Confirmation','Your Booking Confirmation - {{booking_reference}}','<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Booking Confirmation</title>\r\n  <style>\r\n    body {\r\n      font-family: Arial, sans-serif;\r\n      line-height: 1.6;\r\n      color: #333;\r\n      margin: 0;\r\n      padding: 0;\r\n    }\r\n    .container {\r\n      max-width: 600px;\r\n      margin: 0 auto;\r\n      padding: 20px;\r\n    }\r\n    .header {\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 20px;\r\n      text-align: center;\r\n    }\r\n    .content {\r\n      padding: 20px;\r\n      background-color: #f9f9f9;\r\n    }\r\n    .booking-details {\r\n      background-color: white;\r\n      padding: 15px;\r\n      margin-bottom: 20px;\r\n      border-radius: 5px;\r\n      border: 1px solid #eee;\r\n    }\r\n    .hotel-details {\r\n      background-color: white;\r\n      padding: 15px;\r\n      border-radius: 5px;\r\n      border: 1px solid #eee;\r\n    }\r\n    .footer {\r\n      text-align: center;\r\n      padding: 20px;\r\n      font-size: 12px;\r\n      color: #777;\r\n    }\r\n    h1, h2, h3 {\r\n      color: {{primary_color}};\r\n    }\r\n    .button {\r\n      display: inline-block;\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 10px 20px;\r\n      text-decoration: none;\r\n      border-radius: 5px;\r\n      margin-top: 15px;\r\n    }\r\n    table {\r\n      width: 100%;\r\n      border-collapse: collapse;\r\n    }\r\n    table td {\r\n      padding: 8px;\r\n      border-bottom: 1px solid #eee;\r\n    }\r\n    table td:first-child {\r\n      font-weight: bold;\r\n      width: 40%;\r\n    }\r\n  </style>\r\n</head>\r\n<body>\r\n  <div class=\"container\">\r\n    <div class=\"header\">\r\n      <h1>Booking Confirmation</h1>\r\n    </div>\r\n    \r\n    <div class=\"content\">\r\n      <p>Dear {{guest_name}},</p>\r\n      \r\n      <p>Thank you for choosing to stay at {{hotel_name}}. Your booking has been confirmed.</p>\r\n      \r\n      <div class=\"booking-details\">\r\n        <h2>Your Booking Details</h2>\r\n        <table>\r\n          <tr>\r\n            <td>Booking Reference:</td>\r\n            <td>{{booking_reference}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Check-in Date:</td>\r\n            <td>{{check_in_date}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Check-out Date:</td>\r\n            <td>{{check_out_date}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Room Type:</td>\r\n            <td>{{room_type}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Number of Guests:</td>\r\n            <td>{{guest_count}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Total Amount:</td>\r\n            <td>{{currency_symbol}}{{total_amount}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Payment Status:</td>\r\n            <td>{{payment_status}}</td>\r\n          </tr>\r\n        </table>\r\n        \r\n        <a href=\"{{booking_url}}\" class=\"button\">View Booking</a>\r\n      </div>\r\n      \r\n      <div class=\"hotel-details\">\r\n        <h2>Hotel Information</h2>\r\n        <table>\r\n          <tr>\r\n            <td>Hotel Name:</td>\r\n            <td>{{hotel_name}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Address:</td>\r\n            <td>{{hotel_address}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Phone:</td>\r\n            <td>{{hotel_phone}}</td>\r\n          </tr>\r\n          <tr>\r\n            <td>Email:</td>\r\n            <td>{{hotel_email}}</td>\r\n          </tr>\r\n        </table>\r\n      </div>\r\n      \r\n      <div class=\"policies\">\r\n        <h3>Cancellation Policy</h3>\r\n        <p>{{cancellation_policy}}</p>\r\n      </div>\r\n      \r\n      <p>If you have any questions about your booking, please contact us at {{contact_email}} or call us at {{contact_phone}}.</p>\r\n      \r\n      <p>We look forward to welcoming you to {{hotel_name}}!</p>\r\n      \r\n      <p>Best regards,<br>\r\n      The {{hotel_name}} Team</p>\r\n    </div>\r\n    \r\n    <div class=\"footer\">\r\n      <p>&copy; {{year}} {{hotel_name}}. All rights reserved.</p>\r\n      <p>{{email_footer_text}}</p>\r\n    </div>\r\n  </div>\r\n</body>\r\n</html>','Dear {{guest_name}},\r\n\r\nThank you for choosing to stay at {{hotel_name}}. Your booking has been confirmed.\r\n\r\nYOUR BOOKING DETAILS:\r\n--------------------\r\nBooking Reference: {{booking_reference}}\r\nCheck-in Date: {{check_in_date}}\r\nCheck-out Date: {{check_out_date}}\r\nRoom Type: {{room_type}}\r\nNumber of Guests: {{guest_count}}\r\nTotal Amount: {{currency_symbol}}{{total_amount}}\r\nPayment Status: {{payment_status}}\r\n\r\nTo view your booking online, visit: {{booking_url}}\r\n\r\nHOTEL INFORMATION:\r\n----------------\r\nHotel Name: {{hotel_name}}\r\nAddress: {{hotel_address}}\r\nPhone: {{hotel_phone}}\r\nEmail: {{hotel_email}}\r\n\r\nCANCELLATION POLICY:\r\n------------------\r\n{{cancellation_policy}}\r\n\r\nIf you have any questions about your booking, please contact us at {{contact_email}} or call us at {{contact_phone}}.\r\n\r\nWe look forward to welcoming you to {{hotel_name}}!\r\n\r\nBest regards,\r\nThe {{hotel_name}} Team\r\n\r\n© {{year}} {{hotel_name}}. All rights reserved.\r\n{{email_footer_text}}','[\"guest_name\",\"booking_reference\",\"check_in_date\",\"check_out_date\",\"room_type\",\"guest_count\",\"total_amount\",\"payment_status\",\"booking_url\",\"hotel_name\",\"hotel_address\",\"hotel_phone\",\"hotel_email\",\"cancellation_policy\",\"contact_email\",\"contact_phone\",\"primary_color\",\"currency_symbol\",\"year\",\"email_footer_text\"]',1,'2025-05-22 16:28:54','2025-05-22 16:28:54'),('ef82420a-3731-11f0-b953-fa2ced23e514',NULL,'account_signup','Account Signup Confirmation','Welcome to Qaras Hotels - Please Confirm Your Email','<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Welcome to Qaras Hotels</title>\r\n  <style>\r\n    body {\r\n      font-family: Arial, sans-serif;\r\n      line-height: 1.6;\r\n      color: #333;\r\n      margin: 0;\r\n      padding: 0;\r\n    }\r\n    .container {\r\n      max-width: 600px;\r\n      margin: 0 auto;\r\n      padding: 20px;\r\n    }\r\n    .header {\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 20px;\r\n      text-align: center;\r\n    }\r\n    .content {\r\n      padding: 20px;\r\n      background-color: #f9f9f9;\r\n    }\r\n    .button {\r\n      display: inline-block;\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 10px 20px;\r\n      text-decoration: none;\r\n      border-radius: 5px;\r\n      margin-top: 15px;\r\n    }\r\n    .footer {\r\n      text-align: center;\r\n      padding: 20px;\r\n      font-size: 12px;\r\n      color: #777;\r\n    }\r\n  </style>\r\n</head>\r\n<body>\r\n  <div class=\"container\">\r\n    <div class=\"header\">\r\n      <h1>Welcome to Qaras Hotels!</h1>\r\n    </div>\r\n    \r\n    <div class=\"content\">\r\n      <p>Dear {{first_name}},</p>\r\n      \r\n      <p>Thank you for signing up with Qaras Hotels. We\'re excited to have you on board!</p>\r\n      \r\n      <p>To complete your registration and verify your email address, please click the button below:</p>\r\n      \r\n      <p style=\"text-align: center;\">\r\n        <a href=\"{{verification_link}}\" class=\"button\">Verify Email Address</a>\r\n      </p>\r\n      \r\n      <p>If the button doesn\'t work, you can also copy and paste the following link into your browser:</p>\r\n      \r\n      <p style=\"word-break: break-all;\">{{verification_link}}</p>\r\n      \r\n      <p>This link will expire in 24 hours for security reasons.</p>\r\n      \r\n      <p>If you didn\'t create an account, please ignore this email or contact our support team if you have any concerns.</p>\r\n      \r\n      <p>Best regards,<br>\r\n      The Qaras Hotels Team</p>\r\n    </div>\r\n    \r\n    <div class=\"footer\">\r\n      <p>&copy; {{year}} Qaras Hotels. All rights reserved.</p>\r\n      <p>{{email_footer_text}}</p>\r\n    </div>\r\n  </div>\r\n</body>\r\n</html>','Dear {{first_name}},\r\n\r\nThank you for signing up with Qaras Hotels. We\'re excited to have you on board!\r\n\r\nTo complete your registration and verify your email address, please visit the following link:\r\n\r\n{{verification_link}}\r\n\r\nThis link will expire in 24 hours for security reasons.\r\n\r\nIf you didn\'t create an account, please ignore this email or contact our support team if you have any concerns.\r\n\r\nBest regards,\r\nThe Qaras Hotels Team\r\n\r\n© {{year}} Qaras Hotels. All rights reserved.\r\n{{email_footer_text}}','[\"first_name\",\"last_name\",\"verification_link\",\"primary_color\",\"year\",\"email_footer_text\"]',1,'2025-05-22 18:26:45','2025-05-22 18:26:45'),('ef86373e-3731-11f0-b953-fa2ced23e514',NULL,'password_reset','Password Reset Request','Qaras Hotels - Password Reset Request','<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Password Reset Request</title>\r\n  <style>\r\n    body {\r\n      font-family: Arial, sans-serif;\r\n      line-height: 1.6;\r\n      color: #333;\r\n      margin: 0;\r\n      padding: 0;\r\n    }\r\n    .container {\r\n      max-width: 600px;\r\n      margin: 0 auto;\r\n      padding: 20px;\r\n    }\r\n    .header {\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 20px;\r\n      text-align: center;\r\n    }\r\n    .content {\r\n      padding: 20px;\r\n      background-color: #f9f9f9;\r\n    }\r\n    .button {\r\n      display: inline-block;\r\n      background-color: {{primary_color}};\r\n      color: white;\r\n      padding: 10px 20px;\r\n      text-decoration: none;\r\n      border-radius: 5px;\r\n      margin-top: 15px;\r\n    }\r\n    .footer {\r\n      text-align: center;\r\n      padding: 20px;\r\n      font-size: 12px;\r\n      color: #777;\r\n    }\r\n    .warning {\r\n      background-color: #fff3cd;\r\n      color: #856404;\r\n      padding: 10px;\r\n      border-radius: 5px;\r\n      margin: 15px 0;\r\n    }\r\n  </style>\r\n</head>\r\n<body>\r\n  <div class=\"container\">\r\n    <div class=\"header\">\r\n      <h1>Password Reset Request</h1>\r\n    </div>\r\n    \r\n    <div class=\"content\">\r\n      <p>Hello,</p>\r\n      \r\n      <p>We received a request to reset the password for your Qaras Hotels account. If you didn\'t make this request, you can safely ignore this email.</p>\r\n      \r\n      <p>To reset your password, please click the button below:</p>\r\n      \r\n      <p style=\"text-align: center;\">\r\n        <a href=\"{{reset_link}}\" class=\"button\">Reset Password</a>\r\n      </p>\r\n      \r\n      <p>If the button doesn\'t work, you can also copy and paste the following link into your browser:</p>\r\n      \r\n      <p style=\"word-break: break-all;\">{{reset_link}}</p>\r\n      \r\n      <div class=\"warning\">\r\n        <p><strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>\r\n      </div>\r\n      \r\n      <p>If you continue having trouble, please contact our support team for assistance.</p>\r\n      \r\n      <p>Best regards,<br>\r\n      The Qaras Hotels Team</p>\r\n    </div>\r\n    \r\n    <div class=\"footer\">\r\n      <p>&copy; {{year}} Qaras Hotels. All rights reserved.</p>\r\n      <p>{{email_footer_text}}</p>\r\n    </div>\r\n  </div>\r\n</body>\r\n</html>','Hello,\r\n\r\nWe received a request to reset the password for your Qaras Hotels account. If you didn\'t make this request, you can safely ignore this email.\r\n\r\nTo reset your password, please visit the following link:\r\n\r\n{{reset_link}}\r\n\r\nIMPORTANT: This password reset link will expire in 1 hour for security reasons.\r\n\r\nIf you continue having trouble, please contact our support team for assistance.\r\n\r\nBest regards,\r\nThe Qaras Hotels Team\r\n\r\n© {{year}} Qaras Hotels. All rights reserved.\r\n{{email_footer_text}}','[\"reset_link\",\"primary_color\",\"year\",\"email_footer_text\"]',1,'2025-05-22 18:26:45','2025-05-22 18:26:45');
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facility_tasks`
--

DROP TABLE IF EXISTS `facility_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facility_tasks` (
  `taskId` varchar(50) NOT NULL,
  `hotelId` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT 'General',
  `priority` enum('Low','Medium','High','Urgent') DEFAULT 'Medium',
  `due_date` date NOT NULL,
  `staffId` varchar(50) DEFAULT NULL,
  `vendorId` varchar(50) DEFAULT NULL,
  `roomUnitId` varchar(50) DEFAULT NULL,
  `maintenance_type` enum('Corrective','Preventive','Predictive') DEFAULT 'Corrective',
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `cost_estimate` decimal(15,2) DEFAULT NULL,
  `is_recurring` tinyint(1) DEFAULT '0',
  `status` enum('Pending','In Progress','Completed','Cancelled') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`taskId`),
  KEY `fk_hotel_task` (`hotelId`),
  KEY `fk_staff_task` (`staffId`),
  KEY `fk_room_unit_task` (`roomUnitId`),
  KEY `fk_vendor_task` (`vendorId`),
  CONSTRAINT `fk_hotel_task` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`),
  CONSTRAINT `fk_room_unit_task` FOREIGN KEY (`roomUnitId`) REFERENCES `room_units` (`id`),
  CONSTRAINT `fk_staff_task` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`),
  CONSTRAINT `fk_vendor_task` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facility_tasks`
--

LOCK TABLES `facility_tasks` WRITE;
/*!40000 ALTER TABLE `facility_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `facility_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flutterwave_settings`
--

DROP TABLE IF EXISTS `flutterwave_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flutterwave_settings` (
  `id` varchar(36) NOT NULL,
  `livePublicKey` varchar(255) DEFAULT NULL,
  `liveSecretKey` varchar(255) DEFAULT NULL,
  `testPublicKey` varchar(255) DEFAULT NULL,
  `testSecretKey` varchar(255) DEFAULT NULL,
  `encryptionKey` varchar(255) DEFAULT NULL,
  `isLive` tinyint(1) DEFAULT '0',
  `webhookUrl` varchar(255) DEFAULT NULL,
  `webhookSecret` varchar(255) DEFAULT NULL,
  `isEnabled` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flutterwave_settings`
--

LOCK TABLES `flutterwave_settings` WRITE;
/*!40000 ALTER TABLE `flutterwave_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `flutterwave_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_amenities`
--

DROP TABLE IF EXISTS `hotel_amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_amenities` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `amenityId` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hotelId` (`hotelId`),
  KEY `amenityId` (`amenityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_amenities`
--

LOCK TABLES `hotel_amenities` WRITE;
/*!40000 ALTER TABLE `hotel_amenities` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotel_amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotels`
--

DROP TABLE IF EXISTS `hotels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotels` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `zipCode` varchar(20) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `images` text,
  `rating` float DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `whitelabelConfig` text,
  `wifiConfig` text,
  `cctvConfig` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hotels_vendorId` (`vendorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotels`
--

LOCK TABLES `hotels` WRITE;
/*!40000 ALTER TABLE `hotels` DISABLE KEYS */;
INSERT INTO `hotels` VALUES ('06a129c4-348f-11f0-b65f-9f7e9986d28a','327781f0-3558-11f0-808a-f39922e0fe56','Bluxton Hill','Luxury hotel with stunning views','No 30 Hilltop Drive','Port Harcourt','Rivers State','Nigeria','','+234 123 456 7891','bluxton@qarashotels.com.ng','https://bluxton.qarashotels.com.ng','[\"/uploads/hotels/deb53661-c166-4137-978b-d69d963464d6.jpg\",\"/uploads/hotels/11376356-c3b8-43c6-a160-999e99cecf87.jpg\",\"/uploads/hotels/56af004a-1141-4077-8b4d-754d01c96900.jpg\",\"/uploads/hotels/540a61c8-dd3a-418e-b197-79ad906a42a3.jpg\"]',0,1,'{\"logo\":null,\"primaryColor\":\"#1e3a8a\",\"secondaryColor\":\"#f59e0b\",\"fontFamily\":\"Poppins, sans-serif\"}','{\"networkName\":\"BLUXTON_2ND_FLOOR\",\"isEnabled\":true,\"bandwidthLimit\":10}',NULL,'2025-05-19 09:55:34','2025-05-20 23:12:45'),('06a3a82a-348f-11f0-b65f-9f7e9986d28a','327781f0-3558-11f0-808a-f39922e0fe56','House 3','Modern boutique hotel in the heart of the city','3 Faithful Lane','Port Harcourt','Rivers State','Nigeria','','+234 123 456 7892','house3@qarashotels.com.ng','https://house3.qarashotels.com.ng','[\"/uploads/hotels/a9df34ec-2d70-444c-acb8-58cfa5cd7610.jpg\",\"/uploads/hotels/c5627403-2c6b-4dec-b531-0054c1f0f2ea.jpg\",\"/uploads/hotels/76fdb9d9-5482-467e-8f0f-e21741cfe1c5.jpg\"]',0,1,'{\"logo\":null,\"primaryColor\":\"#1e3a8a\",\"secondaryColor\":\"#f59e0b\",\"fontFamily\":\"Poppins, sans-serif\"}','{\"networkName\":\"Qaras House-3\",\"isEnabled\":true,\"bandwidthLimit\":10}',NULL,'2025-05-19 09:55:34','2025-05-21 12:00:36');
/*!40000 ALTER TABLE `hotels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `legal_documents`
--

DROP TABLE IF EXISTS `legal_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `legal_documents` (
  `id` varchar(36) NOT NULL,
  `type` enum('PRIVACY_POLICY','TERMS_OF_SERVICE','COOKIE_POLICY','REFUND_POLICY','USER_AGREEMENT') NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text,
  `version` varchar(50) NOT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT '0',
  `effectiveDate` datetime NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `type` (`type`),
  KEY `slug_2` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `legal_documents`
--

LOCK TABLES `legal_documents` WRITE;
/*!40000 ALTER TABLE `legal_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `legal_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_access_logs`
--

DROP TABLE IF EXISTS `menu_access_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_access_logs` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `userAgent` varchar(255) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `accessedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hotelId` (`hotelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_access_logs`
--

LOCK TABLES `menu_access_logs` WRITE;
/*!40000 ALTER TABLE `menu_access_logs` DISABLE KEYS */;
INSERT INTO `menu_access_logs` VALUES ('01160b4e-3425-48b2-8843-7bb6238613ee','06a129c4-348f-11f0-b65f-9f7e9986d28a','0.0.0.0','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:09:13'),('2d070e17-e884-4616-8b91-a04434f63120','06a129c4-348f-11f0-b65f-9f7e9986d28a','0.0.0.0','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:15:49'),('3f24afa6-24d2-4df8-b2b4-82eca2560d53','06a129c4-348f-11f0-b65f-9f7e9986d28a','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:15:48'),('8fa11b87-f369-48d3-aca5-f4f427e18200','06a129c4-348f-11f0-b65f-9f7e9986d28a','0.0.0.0','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:15:48'),('afe2746c-c46a-4b45-8db6-b31709b824c7','06a129c4-348f-11f0-b65f-9f7e9986d28a','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:15:47'),('b3d19904-84dd-4b9b-af2e-0815d7bb5506','06a129c4-348f-11f0-b65f-9f7e9986d28a','0.0.0.0','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:09:13'),('bb3a27cc-0c6d-4415-82c6-e0005974b586','06a129c4-348f-11f0-b65f-9f7e9986d28a','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:09:13'),('da72f380-b271-4d97-8224-ad39afa3ab7c','06a129c4-348f-11f0-b65f-9f7e9986d28a','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','http://localhost:3000/menu/06a129c4-348f-11f0-b65f-9f7e9986d28a','2025-05-21 13:09:13');
/*!40000 ALTER TABLE `menu_access_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_categories`
--

DROP TABLE IF EXISTS `menu_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_categories` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hotelId` (`hotelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_categories`
--

LOCK TABLES `menu_categories` WRITE;
/*!40000 ALTER TABLE `menu_categories` DISABLE KEYS */;
INSERT INTO `menu_categories` VALUES ('71e4bd3a-f5c2-11ed-be56-0242ac120002','06a129c4-348f-11f0-b65f-9f7e9986d28a','Breakfast','Start your day with our delicious breakfast options',2,1,'2025-05-21 10:56:47','2025-05-21 13:17:48'),('71e4c082-f5c2-11ed-be56-0242ac120002','06a129c4-348f-11f0-b65f-9f7e9986d28a','Main Course','Savory main dishes prepared by our expert chefs',1,1,'2025-05-21 10:56:47','2025-05-21 13:17:48'),('71e4c18a-f5c2-11ed-be56-0242ac120002','06a129c4-348f-11f0-b65f-9f7e9986d28a','Desserts','Sweet treats to complete your meal',3,1,'2025-05-21 10:56:47','2025-05-21 10:56:47');
/*!40000 ALTER TABLE `menu_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` varchar(36) NOT NULL,
  `categoryId` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `discountedPrice` decimal(10,2) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `ingredients` text,
  `allergens` text,
  `isVegetarian` tinyint(1) DEFAULT '0',
  `isVegan` tinyint(1) DEFAULT '0',
  `isGlutenFree` tinyint(1) DEFAULT '0',
  `isSpicy` tinyint(1) DEFAULT '0',
  `calories` int DEFAULT NULL,
  `preparationTime` int DEFAULT NULL,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isAvailable` tinyint(1) NOT NULL DEFAULT '1',
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES ('81e4c2d8-f5c2-11ed-be56-0242ac120002','71e4bd3a-f5c2-11ed-be56-0242ac120002','Continental Breakfast','Selection of pastries, fruits, and coffee',3500.00,NULL,NULL,'Bread, butter, jam, fruits, coffee',NULL,0,0,0,0,NULL,NULL,1,1,0,'2025-05-21 10:56:47','2025-05-21 10:56:47'),('81e4c3f0-f5c2-11ed-be56-0242ac120002','71e4bd3a-f5c2-11ed-be56-0242ac120002','Full English Breakfast','Eggs, bacon, sausage, beans, and toast',5000.00,NULL,NULL,'Eggs, bacon, sausage, beans, toast',NULL,0,0,0,0,NULL,NULL,2,1,0,'2025-05-21 10:56:47','2025-05-21 10:56:47'),('81e4c4fe-f5c2-11ed-be56-0242ac120002','71e4c082-f5c2-11ed-be56-0242ac120002','Jollof Rice with Chicken','Spicy jollof rice served with grilled chicken',7500.00,NULL,NULL,'Rice, tomatoes, peppers, spices, chicken',NULL,0,0,0,0,NULL,NULL,1,1,0,'2025-05-21 10:56:47','2025-05-21 10:56:47'),('81e4c5ee-f5c2-11ed-be56-0242ac120002','71e4c082-f5c2-11ed-be56-0242ac120002','Grilled Fish with Vegetables','Fresh fish grilled to perfection with seasonal vegetables',8500.00,NULL,NULL,'Fish, vegetables, herbs, lemon',NULL,0,0,0,0,NULL,NULL,2,1,0,'2025-05-21 10:56:47','2025-05-21 10:56:47'),('81e4c6e8-f5c2-11ed-be56-0242ac120002','71e4c18a-f5c2-11ed-be56-0242ac120002','Chocolate Cake','Rich chocolate cake with ganache',3000.00,NULL,NULL,'Flour, sugar, cocoa, eggs, butter',NULL,0,0,0,0,NULL,NULL,1,1,0,'2025-05-21 10:56:47','2025-05-21 10:56:47'),('81e4c7dc-f5c2-11ed-be56-0242ac120002','71e4c18a-f5c2-11ed-be56-0242ac120002','Fruit Salad','Fresh seasonal fruits',2500.00,NULL,NULL,'Assorted fruits, honey, mint',NULL,0,0,0,0,NULL,NULL,2,1,0,'2025-05-21 10:56:47','2025-05-21 10:56:47');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_settings`
--

DROP TABLE IF EXISTS `menu_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `showPrices` tinyint(1) DEFAULT '1',
  `enableOrdering` tinyint(1) DEFAULT '0',
  `qrCodeStyle` varchar(20) DEFAULT 'standard',
  `lastUpdated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hotelId` (`hotelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_settings`
--

LOCK TABLES `menu_settings` WRITE;
/*!40000 ALTER TABLE `menu_settings` DISABLE KEYS */;
INSERT INTO `menu_settings` VALUES ('91e4c8c6-f5c2-11ed-be56-0242ac120002','06a129c4-348f-11f0-b65f-9f7e9986d28a','elegant','#53555a','#34a853','Inter, sans-serif',NULL,NULL,'NGN',1,0,'standard','2025-05-21 13:15:40','2025-05-21 10:56:47');
/*!40000 ALTER TABLE `menu_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `type` varchar(50) NOT NULL,
  `basePrice` decimal(10,2) NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES ('06a8bd42-348f-11f0-b65f-9f7e9986d28a','Booking Management','Manage hotel bookings and reservations','CORE',0.00,1,'2025-05-19 09:55:34','2025-05-19 09:55:34'),('06a8bf72-348f-11f0-b65f-9f7e9986d28a','Room Management','Manage hotel rooms and inventory','CORE',0.00,1,'2025-05-19 09:55:34','2025-05-19 09:55:34'),('06a8c04e-348f-11f0-b65f-9f7e9986d28a','Payment Processing','Process payments and manage transactions','CORE',0.00,1,'2025-05-19 09:55:34','2025-05-19 09:55:34'),('06a8c0b2-348f-11f0-b65f-9f7e9986d28a','Staff Management','Manage hotel staff and permissions','ADDON',10000.00,1,'2025-05-19 09:55:34','2025-05-19 09:55:34'),('06a8c10c-348f-11f0-b65f-9f7e9986d28a','Analytics Dashboard','Advanced analytics and reporting','ADDON',15000.00,1,'2025-05-19 09:55:34','2025-05-19 09:55:34'),('5b8c7eea-34ec-11f0-9f7f-5fe7685262f6','Channel Manager','Connect with online travel agencies','ADDON',25000.00,1,'2025-05-19 21:03:40','2025-05-19 21:03:40'),('5b8d7dd6-34ec-11f0-9f7f-5fe7685262f6','Revenue Management','Optimize pricing and revenue','PREMIUM',30000.00,1,'2025-05-19 21:03:40','2025-05-19 21:03:40'),('5b8e5404-34ec-11f0-9f7f-5fe7685262f6','Maintenance Management','Track and manage maintenance tasks','ADDON',12000.00,1,'2025-05-19 21:03:40','2025-05-19 21:03:40'),('8252297a-34ed-11f0-9f7f-5fe7685262f6','CCTV Management','Monitor and manage security cameras','ADDON',18000.00,1,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('82523e4c-34ed-11f0-9f7f-5fe7685262f6','WiFi Management','Manage hotel WiFi access and bandwidth','ADDON',15000.00,1,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252527e-34ed-11f0-9f7f-5fe7685262f6','QR Menu','Digital menu system with QR code access','ADDON',10000.00,1,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('82526d86-34ed-11f0-9f7f-5fe7685262f6','POS System','Point of sale system for hotel services','PREMIUM',22000.00,1,'2025-05-19 21:11:54','2025-05-19 21:11:54');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `userId` varchar(36) NOT NULL,
  `emailEnabled` tinyint(1) DEFAULT '1',
  `pushEnabled` tinyint(1) DEFAULT '1',
  `inAppEnabled` tinyint(1) DEFAULT '1',
  `subscribedTypes` text,
  `unsubscribedTypes` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
INSERT INTO `notification_preferences` VALUES ('0ac7fbf6-eae2-11f0-9764-10653019422e','test-user-id',1,1,1,'[\"TEST\"]','[]','2026-01-06 10:28:21','2026-01-06 10:28:21'),('32bd1306-34f8-11f0-9620-d36ca6faf4d8','069d1848-348f-11f0-b65f-9f7e9986d28a',0,1,1,'[\"MESSAGE\",\"OTHER\"]','[\"PROMOTION\",\"SYSTEM\",\"ANNOUNCEMENT\",\"BOOKING\",\"PAYMENT\",\"MAINTENANCE\",\"SUBSCRIPTION\"]','2025-05-19 22:28:25','2025-12-18 08:33:09'),('32bd1338-34f8-11f0-9620-d36ca6faf4d8','8253922e-34ed-11f0-9f7f-5fe7685262f6',1,1,1,'[\"SYSTEM\",\"BOOKING\",\"PAYMENT\",\"SUBSCRIPTION\",\"MESSAGE\",\"ANNOUNCEMENT\"]','[]','2025-05-19 22:28:25','2025-05-19 22:28:25'),('32bd1356-34f8-11f0-9620-d36ca6faf4d8','8253b6dc-34ed-11f0-9f7f-5fe7685262f6',1,1,1,'[\"SYSTEM\",\"BOOKING\",\"PAYMENT\",\"SUBSCRIPTION\",\"MESSAGE\",\"ANNOUNCEMENT\"]','[]','2025-05-19 22:28:25','2025-05-19 22:28:25'),('7bbfba6d-eb08-11f0-9764-10653019422e','6efa9852-db59-11f0-9764-10653019422e',1,1,1,'[\"BOOKING\",\"PAYMENT\",\"MAINTENANCE\",\"PROMOTION\",\"SUBSCRIPTION\",\"MESSAGE\",\"ANNOUNCEMENT\",\"OTHER\",\"SYSTEM\"]','[]','2026-01-06 15:03:31','2026-01-09 09:47:58');
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `recipient` varchar(50) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `senderId` varchar(36) DEFAULT NULL,
  `metadata` text,
  `status` varchar(20) NOT NULL DEFAULT 'UNREAD',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `senderId` (`senderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('1fcb627d-f8c0-44b6-b3df-c58aa03976f4','its christmas','happy holidays!','SYSTEM','ALL','d709edde-db3b-11f0-9764-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-18 09:49:38','2025-12-18 09:49:38'),('2bec9eb0-9cc3-490d-b10b-6ea27c0b6101','Booking Confirmed','Your booking at Bluxton Hill for Standard Room has been confirmed. Check-in: 2026-01-15, Check-out: 2026-01-16. Total: ₦18,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"d8c18723-e012-4a4a-8dda-918552fc0f57\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Standard Room\",\"checkInDate\":\"2026-01-15\",\"checkOutDate\":\"2026-01-16\",\"totalAmount\":18000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','READ','2026-01-13 17:05:00','2026-01-14 13:38:10'),('3a7ddf5d-559a-4dc7-bdd2-a7f014cb6b75','Booking Cancelled','Your booking at Bluxton Hill for Executive Room has been cancelled. If you have any questions, please contact customer support.','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"ed4dc22d-396a-4017-9765-2d8cb14bdba7\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Executive Room\",\"checkInDate\":\"2026-01-09T23:00:00.000Z\",\"checkOutDate\":\"2026-01-10T23:00:00.000Z\",\"totalAmount\":\"20000.00\",\"action\":\"booking_cancelled\",\"notificationType\":\"booking\"}','READ','2026-01-09 08:51:37','2026-01-09 09:26:08'),('3ee6777d-72f8-4d11-9397-19893be6a52d','hello','world','ANNOUNCEMENT','ALL','069d1848-348f-11f0-b65f-9f7e9986d28a','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-16 15:56:44','2025-12-18 09:40:18'),('49f76e70-0fff-4dd0-a714-fdc7d0e6cfef','hello everyone','testing some more','SYSTEM','ALL','bf160a57-da52-11f0-a35e-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-18 08:34:06','2025-12-19 12:44:21'),('4b51f1e1-905e-44c3-a2f1-af6ab2a52451','hello everyone','testing some more','SYSTEM','ALL','069d1848-348f-11f0-b65f-9f7e9986d28a','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-18 08:34:06','2025-12-18 10:01:45'),('4c215af6-eef0-4c13-92a3-81de3384e530','hello everyone','testing some more','SYSTEM','ALL','327486a8-3558-11f0-808a-f39922e0fe56','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-18 08:34:06','2025-12-18 08:34:06'),('5db40852-db12-439c-bc82-eaf1fa7c246e','its christmas','happy holidays!','SYSTEM','ALL','327486a8-3558-11f0-808a-f39922e0fe56','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-18 09:49:38','2025-12-18 09:49:38'),('62919e9d-07be-4fa4-8aa3-317a425b92a6','testing','the microphone','ANNOUNCEMENT','ALL','bf160a57-da52-11f0-a35e-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-16 16:00:04','2026-01-12 16:32:54'),('6614104e-a762-404b-ac2a-d28b60a5bd59','testing','the microphone','ANNOUNCEMENT','ALL','8253b6dc-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 16:00:04','2025-12-16 16:00:04'),('6a35a8fa-30e4-4629-a9da-52120634459e','hello','world','ANNOUNCEMENT','ALL','8253922e-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 15:56:44','2025-12-16 15:56:44'),('73c9842f-b45e-4392-911c-718a23539ed0','testing ','for other users to see','ANNOUNCEMENT','ALL','327486a8-3558-11f0-808a-f39922e0fe56','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 16:00:56','2025-12-16 16:00:56'),('7b49f1a6-007b-455f-8cab-427985e9da0f','Booking Confirmed','Your booking at Bluxton Hill for Standard Room has been confirmed. Check-in: 2026-01-13, Check-out: 2026-01-14. Total: ₦54,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"a3af7f3b-c583-48c9-b71b-8b5e3067a468\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Standard Room\",\"checkInDate\":\"2026-01-13\",\"checkOutDate\":\"2026-01-14\",\"totalAmount\":54000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','READ','2026-01-13 16:48:00','2026-01-14 14:14:05'),('7bb5c2c1-84c0-46a7-bbc0-ad0412f54158','Booking Confirmed','Your booking at Bluxton Hill for Executive Room has been confirmed. Check-in: 2026-01-20, Check-out: 2026-01-22. Total: ₦40,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"9fe9f20b-ec80-4a0a-8795-5c7725003228\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Executive Room\",\"checkInDate\":\"2026-01-20\",\"checkOutDate\":\"2026-01-22\",\"totalAmount\":40000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','UNREAD','2026-01-15 13:47:54','2026-01-15 13:47:54'),('7cad86cc-0ea9-4e50-b4db-b766970e5906','hello','world','ANNOUNCEMENT','ALL','bf160a57-da52-11f0-a35e-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-16 15:56:44','2026-01-12 16:33:00'),('7ea812ca-ddd5-4d48-a007-e195dd4279d2','Booking Confirmed','Your booking at Bluxton Hill for Standard Room has been confirmed. Check-in: 2026-01-15, Check-out: 2026-01-16. Total: ₦36,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"a525c547-0277-4ff5-ba01-fcdd36ce0838\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Standard Room\",\"checkInDate\":\"2026-01-15\",\"checkOutDate\":\"2026-01-16\",\"totalAmount\":36000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','UNREAD','2026-01-15 13:05:22','2026-01-15 13:05:22'),('85e89107-920f-4ac6-b2ef-a6f305e4daf2','Booking Confirmed','Your booking at Bluxton Hill for Executive Room has been confirmed. Check-in: 2026-01-09, Check-out: 2026-01-11. Total: ₦40,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"f5494a10-1eb4-4f21-b296-b8c0ad7c34a8\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Executive Room\",\"checkInDate\":\"2026-01-09\",\"checkOutDate\":\"2026-01-11\",\"totalAmount\":40000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','READ','2026-01-09 11:10:06','2026-01-12 08:47:11'),('956434f1-9c20-4d7f-a3cf-631ea5ca7212','testing ','for other users to see','ANNOUNCEMENT','ALL','069d1848-348f-11f0-b65f-9f7e9986d28a','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-16 16:00:56','2025-12-18 10:01:45'),('9f9ae520-8c30-45b8-a5d9-a613c057acbe','testing ','for other users to see','ANNOUNCEMENT','ALL','bf160a57-da52-11f0-a35e-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-16 16:00:56','2026-01-12 16:32:50'),('a5b5ff67-8106-4142-b5c2-40734f780d02','testing','the microphone','ANNOUNCEMENT','ALL','8253922e-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 16:00:04','2025-12-16 16:00:04'),('a7383e10-a8e5-4b3c-9593-ae79f7e26937','Booking Confirmed','Your booking at Bluxton Hill for Standard Room has been confirmed. Check-in: 2026-01-08, Check-out: 2026-01-09. Total: ₦36,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"1be1c8c7-bf95-4841-874d-3e63757ee4c5\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Standard Room\",\"checkInDate\":\"2026-01-08\",\"checkOutDate\":\"2026-01-09\",\"totalAmount\":36000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','READ','2026-01-09 08:49:42','2026-01-09 09:40:24'),('a7cb0a4c-2591-428f-8ae9-597e3048e3b6','Check-out Complete','Thank you for staying at Bluxton Hill! Your check-out has been processed. We hope you enjoyed your stay.','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"a3af7f3b-c583-48c9-b71b-8b5e3067a468\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Standard Room\",\"checkOutDate\":\"2026-01-13T23:00:00.000Z\",\"totalAmount\":\"54000.00\",\"action\":\"booking_checked_out\",\"notificationType\":\"booking\"}','UNREAD','2026-01-15 10:36:46','2026-01-15 10:36:46'),('af483c50-7e3c-46f5-b8ea-548dac1e4d5e','its christmas','happy holidays!','SYSTEM','ALL','6efa9852-db59-11f0-9764-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-18 09:49:38','2025-12-18 11:28:01'),('b14d57f9-0d7b-413c-8d38-7f7a820a7cbb','Booking Cancelled','Your booking at Bluxton Hill for Lounge Room has been cancelled. If you have any questions, please contact customer support.','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"02e829e3-d8ee-43f8-88ee-91ec88913e42\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Lounge Room\",\"checkInDate\":\"2026-01-12T23:00:00.000Z\",\"checkOutDate\":\"2026-01-13T23:00:00.000Z\",\"totalAmount\":\"25000.00\",\"action\":\"booking_cancelled\",\"notificationType\":\"booking\"}','UNREAD','2026-01-12 16:52:13','2026-01-12 16:52:13'),('b6f97cba-dc6a-40e5-b7db-b7e84e94ec16','Check-out Complete','Thank you for staying at Bluxton Hill! Your check-out has been processed. We hope you enjoyed your stay.','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"f5494a10-1eb4-4f21-b296-b8c0ad7c34a8\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Executive Room\",\"checkOutDate\":\"2026-01-10T23:00:00.000Z\",\"totalAmount\":\"40000.00\",\"action\":\"booking_checked_out\",\"notificationType\":\"booking\"}','READ','2026-01-13 16:56:16','2026-01-13 17:05:52'),('ba367780-dc5c-4df7-8831-f457ca44d16e','testing ','for other users to see','ANNOUNCEMENT','ALL','8253b6dc-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 16:00:56','2025-12-16 16:00:56'),('bc0ab860-fc2d-4d8b-9200-f341a89a3bf1','Booking Confirmed','Your booking at Bluxton Hill for Executive Room has been confirmed. Check-in: 2026-01-12, Check-out: 2026-01-14. Total: ₦40,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"2dcf805f-222f-4f04-ae02-1bee9a839fc7\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Executive Room\",\"checkInDate\":\"2026-01-12\",\"checkOutDate\":\"2026-01-14\",\"totalAmount\":40000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','READ','2026-01-12 15:05:27','2026-01-14 14:14:28'),('c28885bc-d8b9-4cb4-b46d-5113e856b686','Booking Cancelled','Your booking at Bluxton Hill for Executive Room has been cancelled. If you have any questions, please contact customer support.','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"2dcf805f-222f-4f04-ae02-1bee9a839fc7\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Executive Room\",\"checkInDate\":\"2026-01-11T23:00:00.000Z\",\"checkOutDate\":\"2026-01-13T23:00:00.000Z\",\"totalAmount\":\"40000.00\",\"action\":\"booking_cancelled\",\"notificationType\":\"booking\"}','READ','2026-01-12 15:07:31','2026-01-14 15:30:55'),('c576ff8b-ae73-417b-b2f9-466b87b87a58','its christmas','happy holidays!','SYSTEM','ALL','8253b6dc-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-18 09:49:38','2025-12-18 09:49:38'),('c80dd90f-0acf-4b49-a210-88e7ca6419dd','hello everyone','testing some more','SYSTEM','ALL','d709edde-db3b-11f0-9764-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-18 08:34:06','2025-12-18 08:34:06'),('cc0d8a48-c8de-4c65-86b2-e6271d3de9ba','its christmas','happy holidays!','SYSTEM','ALL','bf160a57-da52-11f0-a35e-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-18 09:49:38','2025-12-19 10:35:47'),('cf462242-c4d7-4bee-8d17-6b9a4f831151','hello everyone','testing some more','SYSTEM','ALL','8253b6dc-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-18 08:34:06','2025-12-18 08:34:06'),('d31d0250-919d-4d41-bc98-801eb6ec864f','Check-out Complete','Thank you for staying at Bluxton Hill! Your check-out has been processed. We hope you enjoyed your stay.','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"53a70e62-0fba-416a-952a-511c0a11cec8\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Standard Room\",\"checkOutDate\":\"2026-01-08T23:00:00.000Z\",\"totalAmount\":\"36000.00\",\"action\":\"booking_checked_out\",\"notificationType\":\"booking\"}','READ','2026-01-13 16:56:16','2026-01-13 17:05:59'),('d4da511c-ab44-45a9-b278-ce0e54af0a03','hello','world','ANNOUNCEMENT','ALL','8253b6dc-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 15:56:44','2025-12-16 15:56:44'),('ddd9cf88-05df-491e-89c3-09c4cb751089','testing','the microphone','ANNOUNCEMENT','ALL','327486a8-3558-11f0-808a-f39922e0fe56','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 16:00:04','2025-12-16 16:00:04'),('e76b5833-00f5-4f10-8e93-66557f54a29f','Booking Confirmed','Your booking at Bluxton Hill for Lounge Room has been confirmed. Check-in: 2026-01-13, Check-out: 2026-01-14. Total: ₦25,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"02e829e3-d8ee-43f8-88ee-91ec88913e42\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Lounge Room\",\"checkInDate\":\"2026-01-13\",\"checkOutDate\":\"2026-01-14\",\"totalAmount\":25000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','READ','2026-01-12 15:25:37','2026-01-14 08:22:25'),('e8986884-ca7d-46fc-8dde-07325afe5bff','Booking Confirmed','Your booking at Bluxton Hill for Mini Suite has been confirmed. Check-in: 2026-01-15, Check-out: 2026-01-17. Total: ₦60,000','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"0cd19d02-ce56-4329-8d02-45c3bbc7d693\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Mini Suite\",\"checkInDate\":\"2026-01-15\",\"checkOutDate\":\"2026-01-17\",\"totalAmount\":60000,\"action\":\"booking_confirmed\",\"notificationType\":\"booking\"}','UNREAD','2026-01-15 14:06:33','2026-01-15 14:06:33'),('f13e4365-1444-42a2-b278-fdfc899422ff','hello','world','ANNOUNCEMENT','ALL','327486a8-3558-11f0-808a-f39922e0fe56','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 15:56:44','2025-12-16 15:56:44'),('f91af712-ff92-4a93-ae54-fc4020b5506d','hello everyone','testing some more','SYSTEM','ALL','6efa9852-db59-11f0-9764-10653019422e','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'READ','2025-12-18 08:34:06','2025-12-18 11:58:33'),('f9c0d6c7-c7ed-46ec-9d6d-40387c12bd59','Check-out Complete','Thank you for staying at Bluxton Hill! Your check-out has been processed. We hope you enjoyed your stay.','BOOKING','CUSTOMERS','6efa9852-db59-11f0-9764-10653019422e',NULL,'{\"bookingId\":\"1be1c8c7-bf95-4841-874d-3e63757ee4c5\",\"hotelName\":\"Bluxton Hill\",\"roomName\":\"Standard Room\",\"checkOutDate\":\"2026-01-08T23:00:00.000Z\",\"totalAmount\":\"36000.00\",\"action\":\"booking_checked_out\",\"notificationType\":\"booking\"}','READ','2026-01-13 16:56:16','2026-01-14 14:06:46'),('fbc9390f-a821-43fd-8546-e46bb8e849f7','testing ','for other users to see','ANNOUNCEMENT','ALL','8253922e-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a',NULL,'UNREAD','2025-12-16 16:00:56','2025-12-16 16:00:56');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_settings`
--

DROP TABLE IF EXISTS `payment_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_settings` (
  `id` varchar(36) NOT NULL,
  `defaultTaxRate` decimal(5,2) DEFAULT '5.00',
  `defaultCommissionRate` decimal(5,2) DEFAULT '10.00',
  `defaultCurrency` varchar(10) DEFAULT 'NGN',
  `paymentMethods` json DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_settings`
--

LOCK TABLES `payment_settings` WRITE;
/*!40000 ALTER TABLE `payment_settings` DISABLE KEYS */;
INSERT INTO `payment_settings` VALUES ('5fc9babc-356f-11f0-a505-2f6c908f19d1',5.00,10.00,'NGN',NULL,'2025-05-20 12:41:31','2025-12-16 10:49:51');
/*!40000 ALTER TABLE `payment_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `bookingId` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL,
  `paymentMethod` varchar(50) DEFAULT 'card',
  `transactionId` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` varchar(10) DEFAULT 'NGN',
  `transaction_reference` varchar(100) DEFAULT NULL,
  `description` text,
  `subscription_plan_id` varchar(36) DEFAULT NULL,
  `vendor_id` varchar(36) DEFAULT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `booking_id` varchar(36) DEFAULT NULL,
  `payment_method` enum('card','bank_transfer','cash') DEFAULT 'card',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('dc42a95e-3561-11f0-808a-f39922e0fe56',NULL,25000.00,'completed','card',NULL,'2025-05-20 11:04:47','2025-05-20 11:04:47','NGN','TXN123456789','Premium Plan Subscription Payment','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','069f261a-348f-11f0-b65f-9f7e9986d28a',NULL,NULL,'card','2025-05-20 11:04:47','2025-05-20 11:04:47'),('dc42ad78-3561-11f0-808a-f39922e0fe56',NULL,15000.00,'completed','card',NULL,'2025-05-20 11:04:47','2025-05-20 11:04:47','NGN','TXN987654321','Basic Plan Subscription Payment','755e6528-34f5-11f0-9620-d36ca6faf4d8','069f261a-348f-11f0-b65f-9f7e9986d28a',NULL,NULL,'bank_transfer','2025-05-05 11:04:47','2025-05-05 11:04:47'),('dc42ca2e-3561-11f0-808a-f39922e0fe56',NULL,35000.00,'pending','card',NULL,'2025-05-20 11:04:47','2025-05-20 11:04:47','NGN','TXN456789123','Enterprise Plan Subscription Upgrade','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','069f261a-348f-11f0-b65f-9f7e9986d28a',NULL,NULL,'card','2025-05-13 11:04:47','2025-05-13 11:04:47'),('dc42cb28-3561-11f0-808a-f39922e0fe56',NULL,10000.00,'failed','card',NULL,'2025-05-20 11:04:47','2025-05-20 11:04:47','NGN','TXN789123456','Failed Subscription Payment Attempt','755e6528-34f5-11f0-9620-d36ca6faf4d8','069f261a-348f-11f0-b65f-9f7e9986d28a',NULL,NULL,'card','2025-05-17 11:04:47','2025-05-17 11:04:47'),('dc42cbc8-3561-11f0-808a-f39922e0fe56',NULL,27500.00,'completed','card',NULL,'2025-05-20 11:04:47','2025-05-20 11:04:47','NGN','TXN321654987','Premium Plan Renewal','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','069f261a-348f-11f0-b65f-9f7e9986d28a',NULL,NULL,'cash','2025-05-19 11:04:47','2025-05-19 11:04:47'),('dc42cc5e-3561-11f0-808a-f39922e0fe56',NULL,18000.00,'refunded','card',NULL,'2025-05-20 11:04:47','2025-05-20 11:04:47','NGN','TXN654987321','Refunded Subscription Payment','755e6528-34f5-11f0-9620-d36ca6faf4d8','069f261a-348f-11f0-b65f-9f7e9986d28a',NULL,NULL,'card','2025-05-10 11:04:47','2025-05-20 11:04:47'),('2fc50979-4fff-4895-8b3c-3181bb2473b7','59d45235-51fe-49ec-be8d-36eb37d3ff49',50000.00,'PENDING','PAYSTACK','e44c53b9','2025-12-22 14:25:45','2025-12-22 14:25:45','NGN',NULL,NULL,NULL,NULL,NULL,NULL,'card','2025-12-22 14:25:45','2025-12-22 14:25:45'),('75f292ba-dda4-4924-9ac4-5ca028cc92b3','0228d7b2-6ffe-42bc-ba1d-c0df7e2b5920',60000.00,'PENDING','PAYSTACK','968e7d12','2025-12-23 10:17:22','2025-12-23 10:17:22','NGN',NULL,NULL,NULL,NULL,NULL,NULL,'card','2025-12-23 10:17:22','2025-12-23 10:17:22');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paystack_configurations`
--

DROP TABLE IF EXISTS `paystack_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paystack_configurations` (
  `id` varchar(36) NOT NULL,
  `publicKey` varchar(255) NOT NULL,
  `secretKey` varchar(255) NOT NULL,
  `isTest` tinyint(1) NOT NULL DEFAULT '1',
  `isDefault` tinyint(1) NOT NULL DEFAULT '1',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `webhookSecret` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paystack_configurations`
--

LOCK TABLES `paystack_configurations` WRITE;
/*!40000 ALTER TABLE `paystack_configurations` DISABLE KEYS */;
/*!40000 ALTER TABLE `paystack_configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paystack_settings`
--

DROP TABLE IF EXISTS `paystack_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paystack_settings` (
  `id` varchar(36) NOT NULL,
  `livePublicKey` varchar(255) DEFAULT NULL,
  `liveSecretKey` varchar(255) DEFAULT NULL,
  `testPublicKey` varchar(255) DEFAULT NULL,
  `testSecretKey` varchar(255) DEFAULT NULL,
  `isLive` tinyint(1) DEFAULT '0',
  `webhookUrl` varchar(255) DEFAULT NULL,
  `webhookSecret` varchar(255) DEFAULT NULL,
  `isEnabled` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paystack_settings`
--

LOCK TABLES `paystack_settings` WRITE;
/*!40000 ALTER TABLE `paystack_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `paystack_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plan_features`
--

DROP TABLE IF EXISTS `plan_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_features` (
  `id` varchar(36) NOT NULL,
  `planId` varchar(36) NOT NULL,
  `moduleId` varchar(36) NOT NULL,
  `isIncluded` tinyint(1) DEFAULT '0',
  `limits` text COMMENT 'JSON for any limits (e.g. number of rooms, bookings)',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_features`
--

LOCK TABLES `plan_features` WRITE;
/*!40000 ALTER TABLE `plan_features` DISABLE KEYS */;
INSERT INTO `plan_features` VALUES ('756c5fde-34f5-11f0-9620-d36ca6faf4d8','755e6528-34f5-11f0-9620-d36ca6faf4d8','06a8bd42-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": 10}','2025-05-19 22:08:49','2025-05-19 22:08:49'),('756d8be8-34f5-11f0-9620-d36ca6faf4d8','755e6528-34f5-11f0-9620-d36ca6faf4d8','06a8bf72-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": 5}','2025-05-19 22:08:49','2025-05-19 22:08:49'),('756eb608-34f5-11f0-9620-d36ca6faf4d8','755e6528-34f5-11f0-9620-d36ca6faf4d8','06a8c04e-348f-11f0-b65f-9f7e9986d28a',1,'{\"methods\": [\"cash\", \"card\"]}','2025-05-19 22:08:49','2025-05-19 22:08:49'),('756fbf1c-34f5-11f0-9620-d36ca6faf4d8','755e6528-34f5-11f0-9620-d36ca6faf4d8','82523e4c-34ed-11f0-9f7f-5fe7685262f6',1,'{\"devices\": 5, \"bandwidth\": \"basic\"}','2025-05-19 22:08:49','2025-05-19 22:08:49'),('7570c2c2-34f5-11f0-9620-d36ca6faf4d8','755e6528-34f5-11f0-9620-d36ca6faf4d8','8252527e-34ed-11f0-9f7f-5fe7685262f6',1,'{\"items\": 20, \"customization\": \"minimal\"}','2025-05-19 22:08:49','2025-05-19 22:08:49'),('8252edd8-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','06a8bd42-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": 50}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f06c-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','06a8bf72-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": 20}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f166-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','06a8c04e-348f-11f0-b65f-9f7e9986d28a',1,'{\"methods\": [\"cash\", \"card\"]}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f274-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','06a8c0b2-348f-11f0-b65f-9f7e9986d28a',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f346-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','06a8c10c-348f-11f0-b65f-9f7e9986d28a',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f404-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','5b8c7eea-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f4ae-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','5b8d7dd6-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f562-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','5b8e5404-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f616-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','8252297a-34ed-11f0-9f7f-5fe7685262f6',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f6c0-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','82523e4c-34ed-11f0-9f7f-5fe7685262f6',1,'{\"devices\": 10, \"bandwidth\": \"standard\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f774-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','8252527e-34ed-11f0-9f7f-5fe7685262f6',1,'{\"items\": 50, \"customization\": \"basic\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252f81e-34ed-11f0-9f7f-5fe7685262f6','8252c7f4-34ed-11f0-9f7f-5fe7685262f6','82526d86-34ed-11f0-9f7f-5fe7685262f6',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('82530afc-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','06a8bd42-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": 200}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82530d90-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','06a8bf72-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": 50}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82530e9e-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','06a8c04e-348f-11f0-b65f-9f7e9986d28a',1,'{\"methods\": [\"cash\", \"card\", \"bank_transfer\"]}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82530f7a-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','06a8c0b2-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": 15}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82531038-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','06a8c10c-348f-11f0-b65f-9f7e9986d28a',1,'{\"customReports\": true}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('825310f6-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','5b8c7eea-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('825311be-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','5b8d7dd6-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8253127c-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','5b8e5404-34ec-11f0-9f7f-5fe7685262f6',1,'{\"limit\": 50}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82531344-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','8252297a-34ed-11f0-9f7f-5fe7685262f6',1,'{\"cameras\": 10, \"retention\": \"30days\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8253143e-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','82523e4c-34ed-11f0-9f7f-5fe7685262f6',1,'{\"devices\": 30, \"bandwidth\": \"premium\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('825314fc-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','8252527e-34ed-11f0-9f7f-5fe7685262f6',1,'{\"items\": 200, \"customization\": \"advanced\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('825315ba-34ed-11f0-9f7f-5fe7685262f6','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','82526d86-34ed-11f0-9f7f-5fe7685262f6',1,'{\"terminals\": 2, \"features\": [\"inventory\", \"billing\"]}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532820-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','06a8bd42-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": \"unlimited\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532a5a-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','06a8bf72-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": \"unlimited\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532b4a-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','06a8c04e-348f-11f0-b65f-9f7e9986d28a',1,'{\"methods\": [\"cash\", \"card\", \"bank_transfer\", \"crypto\"]}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532c1c-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','06a8c0b2-348f-11f0-b65f-9f7e9986d28a',1,'{\"limit\": \"unlimited\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532cda-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','06a8c10c-348f-11f0-b65f-9f7e9986d28a',1,'{\"customReports\": true, \"advancedAnalytics\": true}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532dca-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','5b8c7eea-34ec-11f0-9f7f-5fe7685262f6',1,'{\"otaConnections\": \"unlimited\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532e92-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','5b8d7dd6-34ec-11f0-9f7f-5fe7685262f6',1,'{\"dynamicPricing\": true}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82532f50-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','5b8e5404-34ec-11f0-9f7f-5fe7685262f6',1,'{\"limit\": \"unlimited\"}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8253300e-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','8252297a-34ed-11f0-9f7f-5fe7685262f6',1,'{\"cameras\": \"unlimited\", \"retention\": \"90days\", \"ai\": true}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('825330cc-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','82523e4c-34ed-11f0-9f7f-5fe7685262f6',1,'{\"devices\": \"unlimited\", \"bandwidth\": \"enterprise\", \"captivePortal\": true}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('8253318a-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','8252527e-34ed-11f0-9f7f-5fe7685262f6',1,'{\"items\": \"unlimited\", \"customization\": \"full\", \"multiLanguage\": true}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('82533252-34ed-11f0-9f7f-5fe7685262f6','8252cace-34ed-11f0-9f7f-5fe7685262f6','82526d86-34ed-11f0-9f7f-5fe7685262f6',1,'{\"terminals\": \"unlimited\", \"features\": [\"inventory\", \"billing\", \"reporting\", \"crm\"]}','2025-05-19 21:11:54','2025-05-19 21:11:54'),('e94bf17e-c3ce-4323-9131-d2aa9166e7e7','b0867686-6a5e-41e9-af0f-796463c88bf8','06a8c10c-348f-11f0-b65f-9f7e9986d28a',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:42:16'),('c8d1cd1e-d3f3-4905-887c-c7a21a223109','b0867686-6a5e-41e9-af0f-796463c88bf8','06a8bd42-348f-11f0-b65f-9f7e9986d28a',1,NULL,'2025-12-17 13:38:45','2025-12-17 13:42:16'),('a6c54f39-40cf-49ee-9cd8-8c7d29c74327','b0867686-6a5e-41e9-af0f-796463c88bf8','8252297a-34ed-11f0-9f7f-5fe7685262f6',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:42:16'),('a07c233a-78be-4c2e-981a-66eeb1f7e423','b0867686-6a5e-41e9-af0f-796463c88bf8','5b8c7eea-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:38:45'),('408ea60f-e53e-46be-9101-4fdce83c702c','b0867686-6a5e-41e9-af0f-796463c88bf8','5b8e5404-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:38:45'),('b813dd51-8f53-4919-ad8c-bac14c4e670c','b0867686-6a5e-41e9-af0f-796463c88bf8','06a8c04e-348f-11f0-b65f-9f7e9986d28a',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:39:33'),('8bdf63d4-f879-4d00-b846-b1fe4703764c','b0867686-6a5e-41e9-af0f-796463c88bf8','82526d86-34ed-11f0-9f7f-5fe7685262f6',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:38:45'),('2f39cdbc-4f1f-4e51-ba6d-b16e5c38c087','b0867686-6a5e-41e9-af0f-796463c88bf8','8252527e-34ed-11f0-9f7f-5fe7685262f6',1,NULL,'2025-12-17 13:38:45','2025-12-17 13:38:45'),('45940a6b-7d40-4d55-8c2d-629723988b2b','b0867686-6a5e-41e9-af0f-796463c88bf8','5b8d7dd6-34ec-11f0-9f7f-5fe7685262f6',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:38:45'),('2c8876cc-1e36-4f55-a896-d32ee4ae8a00','b0867686-6a5e-41e9-af0f-796463c88bf8','06a8bf72-348f-11f0-b65f-9f7e9986d28a',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:42:16'),('5fb7a29f-da83-4be1-a34e-9c5a7dfd1ee5','b0867686-6a5e-41e9-af0f-796463c88bf8','06a8c0b2-348f-11f0-b65f-9f7e9986d28a',0,NULL,'2025-12-17 13:38:45','2025-12-17 13:42:16'),('19497a21-ba0d-424f-94e2-de387579f4da','b0867686-6a5e-41e9-af0f-796463c88bf8','82523e4c-34ed-11f0-9f7f-5fe7685262f6',1,NULL,'2025-12-17 13:38:45','2025-12-17 13:42:16');
/*!40000 ALTER TABLE `plan_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `push_subscriptions`
--

DROP TABLE IF EXISTS `push_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscriptions` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `expirationTime` bigint DEFAULT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `push_subscriptions`
--

LOCK TABLES `push_subscriptions` WRITE;
/*!40000 ALTER TABLE `push_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `push_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_amenities`
--

DROP TABLE IF EXISTS `room_amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_amenities` (
  `id` varchar(36) NOT NULL,
  `roomId` varchar(36) NOT NULL,
  `amenityId` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_amenities`
--

LOCK TABLES `room_amenities` WRITE;
/*!40000 ALTER TABLE `room_amenities` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_units`
--

DROP TABLE IF EXISTS `room_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_units` (
  `id` varchar(36) NOT NULL,
  `roomId` varchar(36) NOT NULL,
  `roomNumber` varchar(20) NOT NULL,
  `status` enum('available','occupied','maintenance','reserved','cleaning') DEFAULT 'available',
  `currentBookingId` varchar(36) DEFAULT NULL,
  `lastCleanedAt` datetime DEFAULT NULL,
  `notes` text,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_units`
--

LOCK TABLES `room_units` WRITE;
/*!40000 ALTER TABLE `room_units` DISABLE KEYS */;
INSERT INTO `room_units` VALUES ('97874240-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','101','reserved','d8c18723-e012-4a4a-8dda-918552fc0f57','2026-01-13 16:56:16',NULL,'2025-05-20 20:32:47','2026-01-13 16:05:00'),('97878d9a-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','102','reserved','a525c547-0277-4ff5-ba01-fcdd36ce0838','2026-01-13 16:56:16',NULL,'2025-05-20 20:32:47','2026-01-15 12:05:21'),('97878f34-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','203','reserved','a525c547-0277-4ff5-ba01-fcdd36ce0838','2026-01-13 16:56:16',NULL,'2025-05-20 20:32:47','2026-01-15 12:05:21'),('9787904c-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','205','available',NULL,'2026-01-15 10:36:46',NULL,'2025-05-20 20:32:47','2026-01-15 09:36:46'),('9787911e-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','207','available',NULL,'2026-01-15 10:36:46',NULL,'2025-05-20 20:32:47','2026-01-15 09:36:46'),('978791dc-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','302','available',NULL,'2026-01-15 10:36:46',NULL,'2025-05-20 20:32:47','2026-01-15 09:36:46'),('9787929a-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','303','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-07 07:56:14'),('9787933a-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','305','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-07 07:56:14'),('978793d0-35b9-11f0-8cf5-f19e416d5e91','f4853f3e-3595-11f0-9207-db0ca828cf96','308','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-07 07:56:14'),('97893b36-35b9-11f0-8cf5-f19e416d5e91','f4867610-3595-11f0-9207-db0ca828cf96','202','reserved','0e1754b6-ad3a-4025-ba02-2e2bf31647fb','2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-08 09:57:26'),('97893e60-35b9-11f0-8cf5-f19e416d5e91','f4867610-3595-11f0-9207-db0ca828cf96','204','reserved','aec02875-8bae-44e1-ab80-cc4bb2e2794c','2026-01-13 16:56:16',NULL,'2025-05-20 20:32:47','2026-01-14 07:23:51'),('97893f3c-35b9-11f0-8cf5-f19e416d5e91','f4867610-3595-11f0-9207-db0ca828cf96','206','reserved','9fe9f20b-ec80-4a0a-8795-5c7725003228','2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-15 12:47:54'),('97893ffa-35b9-11f0-8cf5-f19e416d5e91','f4867610-3595-11f0-9207-db0ca828cf96','303','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-07 07:56:14'),('978940a4-35b9-11f0-8cf5-f19e416d5e91','f4867610-3595-11f0-9207-db0ca828cf96','307','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-07 07:56:14'),('9789413a-35b9-11f0-8cf5-f19e416d5e91','f4867610-3595-11f0-9207-db0ca828cf96','309','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-07 07:56:14'),('978941da-35b9-11f0-8cf5-f19e416d5e91','f4867610-3595-11f0-9207-db0ca828cf96','311','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-07 07:56:14'),('978a27d0-35b9-11f0-8cf5-f19e416d5e91','f487851e-3595-11f0-9207-db0ca828cf96','306','available',NULL,'2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-12 15:52:13'),('978fb42a-35b9-11f0-8cf5-f19e416d5e91','f488fd04-3595-11f0-9207-db0ca828cf96','201','reserved','0cd19d02-ce56-4329-8d02-45c3bbc7d693','2026-01-07 08:56:14',NULL,'2025-05-20 20:32:47','2026-01-15 13:06:33');
/*!40000 ALTER TABLE `room_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` text,
  `capacity` int NOT NULL,
  `pricePerNight` decimal(10,2) NOT NULL,
  `discountedPrice` decimal(10,2) DEFAULT NULL,
  `images` text,
  `status` varchar(50) NOT NULL,
  `roomNumbers` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES ('f4853f3e-3595-11f0-9207-db0ca828cf96','06a129c4-348f-11f0-b65f-9f7e9986d28a','Standard Room','Standard','Comfortable room with city view',2,18000.00,NULL,NULL,'available','[\"101\", \"102\", \"203\", \"205\", \"207\", \"302\", \"308\", \"303\", \"305\"]','2025-05-20 17:17:41','2025-05-20 17:17:41'),('f4867610-3595-11f0-9207-db0ca828cf96','06a129c4-348f-11f0-b65f-9f7e9986d28a','Executive Room','Executive','Spacious executive room with premium amenities',2,20000.00,NULL,NULL,'available','[\"204\", \"206\", \"202\", \"303\", \"307\", \"309\", \"311\"]','2025-05-20 17:17:41','2025-05-20 17:17:41'),('f487851e-3595-11f0-9207-db0ca828cf96','06a129c4-348f-11f0-b65f-9f7e9986d28a','Lounge Room','Lounge Room','Comfortable lounge with seating area and premium services',2,25000.00,25000.00,'[\"/uploads/hotels/06a129c4-348f-11f0-b65f-9f7e9986d28a/rooms/9c9ca9ea-0d64-472c-a5ed-c0409bf7e25e.jpg\",\"/uploads/hotels/06a129c4-348f-11f0-b65f-9f7e9986d28a/rooms/b0163468-f883-4eda-883e-214fc67529df.JPG\"]','available','[\"306\"]','2025-05-20 17:17:41','2025-05-21 14:52:00'),('f488fd04-3595-11f0-9207-db0ca828cf96','06a129c4-348f-11f0-b65f-9f7e9986d28a','Mini Suite','Mini-Suite','Luxury mini-suite with separate living area',3,30000.00,NULL,NULL,'available','[\"201\"]','2025-05-20 17:17:41','2025-05-20 17:17:41');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_settings`
--

DROP TABLE IF EXISTS `security_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_settings` (
  `id` varchar(36) NOT NULL,
  `twoFactorAuthEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `passwordPolicy` json DEFAULT NULL,
  `loginAttempts` int DEFAULT '5',
  `lockoutDuration` int DEFAULT '30',
  `jwtSecret` varchar(255) DEFAULT NULL,
  `jwtExpiry` int DEFAULT '86400',
  `sessionTimeout` int DEFAULT '3600',
  `allowedIPs` text,
  `blockedIPs` text,
  `corsOrigins` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_settings`
--

LOCK TABLES `security_settings` WRITE;
/*!40000 ALTER TABLE `security_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `security_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seo_settings`
--

DROP TABLE IF EXISTS `seo_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seo_settings` (
  `id` varchar(36) NOT NULL,
  `metaTitle` varchar(255) DEFAULT NULL,
  `metaDescription` text,
  `metaKeywords` text,
  `ogTitle` varchar(255) DEFAULT NULL,
  `ogDescription` text,
  `ogImage` varchar(255) DEFAULT NULL,
  `twitterHandle` varchar(255) DEFAULT NULL,
  `canonicalUrl` varchar(255) DEFAULT NULL,
  `robotsTxt` text,
  `structuredData` text,
  `googleAnalyticsId` varchar(255) DEFAULT NULL,
  `googleTagManagerId` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seo_settings`
--

LOCK TABLES `seo_settings` WRITE;
/*!40000 ALTER TABLE `seo_settings` DISABLE KEYS */;
INSERT INTO `seo_settings` VALUES ('7e33a40e-356f-11f0-a505-2f6c908f19d1','Qaras Hotels - Hotel Booking Platform','Find and book hotels across Nigeria with Qaras Hotels, the leading hotel booking platform.',NULL,'Qaras Hotels','Find and book hotels across Nigeria with Qaras Hotels, the leading hotel booking platform.',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-05-20 12:42:22','2025-12-16 10:52:16');
/*!40000 ALTER TABLE `seo_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `id` varchar(36) NOT NULL,
  `siteName` varchar(255) NOT NULL DEFAULT 'Qaras Hotels',
  `siteDescription` text,
  `defaultLanguage` varchar(10) DEFAULT 'en',
  `timezone` varchar(50) DEFAULT 'UTC',
  `defaultCurrency` varchar(10) DEFAULT 'NGN',
  `maintenanceMode` tinyint(1) NOT NULL DEFAULT '0',
  `maintenanceMsg` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES ('6e71de42-3569-11f0-808a-f39922e0fe56','Qaras Hotels','Your ultimate hotel booking platform','en','UTC','NGN',0,NULL,'2025-05-20 11:58:58','2025-12-16 10:47:48');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smtp_settings`
--

DROP TABLE IF EXISTS `smtp_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smtp_settings` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) DEFAULT NULL,
  `host` varchar(255) NOT NULL,
  `port` int NOT NULL DEFAULT '587',
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fromEmail` varchar(255) NOT NULL,
  `fromName` varchar(255) NOT NULL,
  `encryption` enum('none','ssl','tls') DEFAULT 'tls',
  `isDefault` tinyint(1) NOT NULL DEFAULT '1',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smtp_settings`
--

LOCK TABLES `smtp_settings` WRITE;
/*!40000 ALTER TABLE `smtp_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `smtp_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `vendorId` varchar(36) DEFAULT NULL,
  `hotelId` varchar(36) DEFAULT NULL,
  `position` varchar(100) NOT NULL,
  `permissions` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES ('d71ac4e3-db3b-11f0-9764-10653019422e','d709edde-db3b-11f0-9764-10653019422e','327781f0-3558-11f0-808a-f39922e0fe56',NULL,'Cook',NULL,'2025-12-17 12:30:50','2025-12-17 12:30:50');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_payments`
--

DROP TABLE IF EXISTS `subscription_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_payments` (
  `id` varchar(36) NOT NULL,
  `vendorId` varchar(36) NOT NULL,
  `subscriptionPlanId` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentReference` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `paymentDate` datetime DEFAULT NULL,
  `notes` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_payments`
--

LOCK TABLES `subscription_payments` WRITE;
/*!40000 ALTER TABLE `subscription_payments` DISABLE KEYS */;
INSERT INTO `subscription_payments` VALUES ('7cf730c8-35ca-11f0-af01-6038f7310db0','069f261a-348f-11f0-b65f-9f7e9986d28a','8252c9fc-34ed-11f0-9f7f-5fe7685262f6',35000.00,'SAMPLE-7cf73172-35ca-11f0-af01-6038f7310db0','COMPLETED','2025-05-04 23:33:44',NULL,'2025-05-20 23:33:44','2025-05-20 23:33:44');
/*!40000 ALTER TABLE `subscription_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `billingCycle` varchar(20) NOT NULL,
  `features` text COMMENT 'JSON field for features',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES ('755e6528-34f5-11f0-9620-d36ca6faf4d8','Free Plan','Basic features to get you started',0.00,'MONTHLY','{\"bookingLimit\": 10, \"roomLimit\": 5, \"staffLimit\": 2, \"wifiDevices\": 5, \"qrMenuItems\": 20}',1,'2025-05-19 22:08:48','2025-05-19 22:08:48'),('8252c7f4-34ed-11f0-9f7f-5fe7685262f6','Basic Plan','Perfect for small hotels just getting started',15000.00,'MONTHLY','{\"bookingLimit\": 50, \"roomLimit\": 20, \"staffLimit\": 5, \"wifiDevices\": 10, \"qrMenuItems\": 50}',1,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252c9fc-34ed-11f0-9f7f-5fe7685262f6','Professional Plan','Ideal for growing hotels with multiple rooms',35000.00,'MONTHLY','{\"bookingLimit\": 200, \"roomLimit\": 50, \"staffLimit\": 15, \"customReports\": true, \"wifiDevices\": 30, \"qrMenuItems\": 200, \"cctvCameras\": 10, \"posTerminals\": 2}',1,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('8252cace-34ed-11f0-9f7f-5fe7685262f6','Enterprise Plan','Complete solution for large hotels and chains',75000.00,'MONTHLY','{\"bookingLimit\": \"unlimited\", \"roomLimit\": \"unlimited\", \"staffLimit\": \"unlimited\", \"customReports\": true, \"apiAccess\": true, \"prioritySupport\": true, \"wifiDevices\": \"unlimited\", \"qrMenuItems\": \"unlimited\", \"cctvCameras\": \"unlimited\", \"posTerminals\": \"unlimited\"}',1,'2025-05-19 21:11:54','2025-05-19 21:11:54'),('b0867686-6a5e-41e9-af0f-796463c88bf8','Premium','A plan for the super rich',150000.00,'quarterly','{\"06a8c10c-348f-11f0-b65f-9f7e9986d28a\":false,\"06a8bd42-348f-11f0-b65f-9f7e9986d28a\":true,\"8252297a-34ed-11f0-9f7f-5fe7685262f6\":false,\"5b8c7eea-34ec-11f0-9f7f-5fe7685262f6\":false,\"5b8e5404-34ec-11f0-9f7f-5fe7685262f6\":false,\"06a8c04e-348f-11f0-b65f-9f7e9986d28a\":false,\"82526d86-34ed-11f0-9f7f-5fe7685262f6\":false,\"8252527e-34ed-11f0-9f7f-5fe7685262f6\":true,\"5b8d7dd6-34ec-11f0-9f7f-5fe7685262f6\":false,\"06a8bf72-348f-11f0-b65f-9f7e9986d28a\":false,\"06a8c0b2-348f-11f0-b65f-9f7e9986d28a\":false,\"82523e4c-34ed-11f0-9f7f-5fe7685262f6\":true}',1,'2025-12-17 13:38:45','2025-12-17 13:42:16');
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `super_admins`
--

DROP TABLE IF EXISTS `super_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `super_admins` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `super_admins`
--

LOCK TABLES `super_admins` WRITE;
/*!40000 ALTER TABLE `super_admins` DISABLE KEYS */;
INSERT INTO `super_admins` VALUES ('82542c84-34ed-11f0-9f7f-5fe7685262f6','069d1848-348f-11f0-b65f-9f7e9986d28a','2025-05-19 21:11:54','2025-05-19 21:11:54');
/*!40000 ALTER TABLE `super_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theme_settings`
--

DROP TABLE IF EXISTS `theme_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theme_settings` (
  `id` varchar(36) NOT NULL,
  `colorPalette` text,
  `typography` text,
  `buttons` text,
  `layout` text,
  `customCSS` text,
  `logoUrl` varchar(255) DEFAULT NULL,
  `faviconUrl` varchar(255) DEFAULT NULL,
  `loginBannerUrl` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theme_settings`
--

LOCK TABLES `theme_settings` WRITE;
/*!40000 ALTER TABLE `theme_settings` DISABLE KEYS */;
INSERT INTO `theme_settings` VALUES ('06aaad14-348f-11f0-b65f-9f7e9986d28a','{\"primary\":\"#1a73e8\",\"secondary\":\"#34a853\",\"accent\":\"#fbbc05\"}','{\"fontFamily\":\"Inter\",\"headingFont\":\"Poppins\"}','{\"style\":\"rounded\",\"size\":\"medium\"}','{\"sidebar\":\"left\",\"header\":\"fixed\"}',NULL,NULL,NULL,NULL,1,'2025-05-19 09:55:34','2025-12-16 10:56:35');
/*!40000 ALTER TABLE `theme_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `emailVerified` datetime DEFAULT NULL,
  `lastLoginAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('069d1848-348f-11f0-b65f-9f7e9986d28a','Qaras Admin',NULL,NULL,'admin@qarashotels.com.ng','$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.','SUPER_ADMIN',1,NULL,'2026-01-15 11:04:24','2025-05-19 09:55:34','2026-01-15 11:04:23'),('327486a8-3558-11f0-808a-f39922e0fe56','Qaras Hotels',NULL,NULL,'vendor@qarashotels.com.ng','$2b$10$V7GfUL9yyD1WkfH.Ux1mhOmBZMTajSXf6ABQAV.WqCmsbQmAldrS.','VENDOR',1,NULL,'2025-05-23 02:10:08','2025-05-20 09:55:36','2025-05-23 02:10:07'),('8253b6dc-34ed-11f0-9f7f-5fe7685262f6','Hotel Staff',NULL,NULL,'staff@qarashotels.com.ng','$2b$10$wUGlqRiQcIg/SdyoHLAJzu8jPCCko9fimCRfDx6UuP7qUnzEQ9XEe','STAFF',1,NULL,NULL,'2025-05-19 21:11:54','2025-12-17 11:50:35'),('bf160a57-da52-11f0-a35e-10653019422e','Williams Iyango',NULL,NULL,'williamsahupa@gmail.com','$2b$10$APycHl6fzBt7pJeAcX.jEObHfij20eusQKemNDO4AhbtVdNdh4BEK','VENDOR',1,NULL,'2026-01-12 16:32:13','2025-12-16 08:42:17','2026-01-12 16:32:13'),('d709edde-db3b-11f0-9764-10653019422e','John Doe',NULL,NULL,'johndoe@yahoo.com','$2b$10$32Kk.hZVMhGo9cBNqZVhGeLTGsptFZ0HYTUTEkxq8TrwxaWb8hpYm','STAFF',1,NULL,'2025-12-17 15:18:31','2025-12-17 12:30:49','2025-12-17 15:18:30'),('6efa9852-db59-11f0-9764-10653019422e','Jane Doe',NULL,NULL,'janedoe@gmail.com','$2b$10$B7XlQPOHkjR/AoDf9btpGeWnCCG3N/h56xtQ6b7PCDwKDfBzj4c/2','CUSTOMER',1,NULL,'2026-01-15 13:04:34','2025-12-17 16:02:40','2026-01-15 13:04:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vapid_keys`
--

DROP TABLE IF EXISTS `vapid_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vapid_keys` (
  `id` varchar(36) NOT NULL,
  `publicKey` varchar(255) NOT NULL,
  `privateKey` varchar(255) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vapid_keys`
--

LOCK TABLES `vapid_keys` WRITE;
/*!40000 ALTER TABLE `vapid_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `vapid_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `companyName` varchar(255) DEFAULT NULL,
  `businessAddress` text,
  `businessPhone` varchar(50) DEFAULT NULL,
  `taxId` varchar(50) DEFAULT NULL,
  `subscriptionPlanId` varchar(36) DEFAULT NULL,
  `subscriptionStatus` varchar(20) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES ('069f261a-348f-11f0-b65f-9f7e9986d28a','069d1848-348f-11f0-b65f-9f7e9986d28a','Qaras Hotels Group','123 Business Avenue, Lagos, Nigeria','+234 123 456 7890','TAX123456','8252c9fc-34ed-11f0-9f7f-5fe7685262f6','active','2025-05-19 09:55:34','2025-05-19 21:11:54'),('327781f0-3558-11f0-808a-f39922e0fe56','327486a8-3558-11f0-808a-f39922e0fe56','Qaras Hotels','3 Faithful Lane, Eagle Island, Port Harcourt 500102, Rivers','+2347059992238','TX12345','8252cace-34ed-11f0-9f7f-5fe7685262f6','active','2025-05-20 09:55:36','2025-05-20 09:58:09'),('e384d879-da53-11f0-a35e-10653019422e','bf160a57-da52-11f0-a35e-10653019422e','All Star Hotels','Ikaptang New Layout, Ishibori, Ogoja\nUniversity of Benin','09122901671','TX12345','8252cace-34ed-11f0-9f7f-5fe7685262f6','active','2025-12-16 08:50:28','2025-12-19 12:40:41');
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wifi_credentials`
--

DROP TABLE IF EXISTS `wifi_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wifi_credentials` (
  `id` varchar(36) NOT NULL,
  `networkId` varchar(36) DEFAULT NULL,
  `hotelId` varchar(36) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `validFrom` datetime NOT NULL,
  `validUntil` datetime DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wifi_credentials`
--

LOCK TABLES `wifi_credentials` WRITE;
/*!40000 ALTER TABLE `wifi_credentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `wifi_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wifi_networks`
--

DROP TABLE IF EXISTS `wifi_networks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wifi_networks` (
  `id` varchar(36) NOT NULL,
  `hotelId` varchar(36) NOT NULL,
  `networkName` varchar(255) NOT NULL,
  `securityType` varchar(50) NOT NULL DEFAULT 'WPA2',
  `isPublic` tinyint(1) DEFAULT '0',
  `isEnabled` tinyint(1) DEFAULT '1',
  `bandwidthLimit` int DEFAULT NULL,
  `description` text,
  `locationArea` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wifi_networks`
--

LOCK TABLES `wifi_networks` WRITE;
/*!40000 ALTER TABLE `wifi_networks` DISABLE KEYS */;
/*!40000 ALTER TABLE `wifi_networks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-15 14:42:14
