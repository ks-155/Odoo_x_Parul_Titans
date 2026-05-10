-- ============================================
-- TRAVELOOP DATABASE UPDATE
-- Run this in phpMyAdmin to add new columns
-- ============================================

-- Add public sharing & cover to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_public TINYINT(1) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_code VARCHAR(32) DEFAULT NULL;

-- Add ordering & dates to stops
ALTER TABLE stops ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE stops ADD COLUMN IF NOT EXISTS arrival_date DATE DEFAULT NULL;

-- Add category & time to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS category ENUM('transport','stay','food','activity') DEFAULT 'activity';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS time_slot VARCHAR(20) DEFAULT NULL;

-- Add category to checklist
ALTER TABLE checklist ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'general';

-- Add stop_id to notes (for per-stop notes)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS stop_id INT DEFAULT NULL;
