-- Check out all bookings that have passed their check-out date
-- This will free up room units that are currently occupied by past bookings

-- First, let's see what bookings need to be checked out
SELECT
    COUNT(*) as bookings_to_checkout,
    MIN(b.checkOutDate) as earliest_checkout,
    MAX(b.checkOutDate) as latest_checkout
FROM bookings b
WHERE b.checkOutDate < CURDATE()
  AND b.status = 'CHECKED_IN';

-- Check out all past bookings and free their room units
START TRANSACTION;

-- First, identify bookings that need to be checked out
CREATE TEMPORARY TABLE temp_past_bookings AS
SELECT id
FROM bookings
WHERE checkOutDate < CURDATE()
  AND status = 'CHECKED_IN';

-- Update booking status to CHECKED_OUT
UPDATE bookings
SET status = 'CHECKED_OUT', updatedAt = NOW()
WHERE id IN (SELECT id FROM temp_past_bookings);

-- Free up room units by setting them to available
-- Use the temporary table to avoid Cartesian products
UPDATE room_units ru
SET ru.status = 'available',
    ru.currentBookingId = NULL,
    ru.lastCleanedAt = NOW()
WHERE ru.currentBookingId IN (SELECT id FROM temp_past_bookings);

-- Clean up temporary table
DROP TEMPORARY TABLE temp_past_bookings;

COMMIT;

-- Verify the results
SELECT
    'Bookings checked out:' as status,
    COUNT(*) as count
FROM bookings
WHERE status = 'CHECKED_OUT'
  AND DATE(updatedAt) = CURDATE();

SELECT
    'Room units freed:' as status,
    COUNT(*) as count
FROM room_units
WHERE status = 'available'
  AND currentBookingId IS NULL
  AND DATE(lastCleanedAt) = CURDATE();

-- Show current availability
SELECT
    h.name as hotel_name,
    r.name as room_type,
    COUNT(ru.id) as total_units,
    COUNT(CASE WHEN ru.status = 'available' THEN 1 END) as available_units,
    COUNT(CASE WHEN ru.status = 'occupied' THEN 1 END) as occupied_units,
    COUNT(CASE WHEN ru.status = 'reserved' THEN 1 END) as reserved_units
FROM hotels h
JOIN rooms r ON h.id = r.hotelId
LEFT JOIN room_units ru ON r.id = ru.roomId
WHERE h.isActive = 1
GROUP BY h.id, h.name, r.id, r.name
ORDER BY h.name, r.name;
