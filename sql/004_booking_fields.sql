-- Prenotazioni: nome e cognome separati, hash IP per anti-spam.
-- Idempotente: MySQL 8 non supporta ADD COLUMN IF NOT EXISTS.

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE bookings ADD COLUMN first_name VARCHAR(120) NOT NULL DEFAULT '''' AFTER customer_name',
    'DO 0')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'first_name'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE bookings ADD COLUMN last_name VARCHAR(120) NOT NULL DEFAULT '''' AFTER first_name',
    'DO 0')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'last_name'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE bookings ADD COLUMN ip_hash VARCHAR(64) NULL AFTER source, ADD INDEX idx_bookings_ip_created (ip_hash, created_at)',
    'DO 0')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'ip_hash'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE bookings
SET
  first_name = TRIM(SUBSTRING_INDEX(customer_name, ' ', 1)),
  last_name = TRIM(SUBSTRING(customer_name, LENGTH(SUBSTRING_INDEX(customer_name, ' ', 1)) + 1))
WHERE first_name = '' AND last_name = '' AND customer_name <> '';
