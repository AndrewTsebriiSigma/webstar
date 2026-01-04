-- Add draft and attachment fields to portfolio_items table
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS attachment_url VARCHAR,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Add draft field to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Update existing records to have is_draft = FALSE
UPDATE portfolio_items SET is_draft = FALSE WHERE is_draft IS NULL;
UPDATE projects SET is_draft = FALSE WHERE is_draft IS NULL;

