-- Migration: Add profile_setup_completed to users table
-- Run this on your Render PostgreSQL database

-- Check if column exists first (optional, for safety)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='profile_setup_completed'
    ) THEN
        -- Add the column with default value TRUE
        ALTER TABLE users 
        ADD COLUMN profile_setup_completed BOOLEAN DEFAULT TRUE NOT NULL;
        
        RAISE NOTICE 'Column profile_setup_completed added successfully';
    ELSE
        RAISE NOTICE 'Column profile_setup_completed already exists';
    END IF;
END $$;

-- Update existing OAuth users with temp usernames to FALSE
UPDATE users 
SET profile_setup_completed = FALSE 
WHERE oauth_provider = 'google' 
AND username LIKE 'temp_%';

-- Verify the changes
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN profile_setup_completed = TRUE THEN 1 ELSE 0 END) as setup_completed,
    SUM(CASE WHEN profile_setup_completed = FALSE THEN 1 ELSE 0 END) as setup_pending
FROM users;

