
-- Add is_hidden column to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Hide assignment 6 (assuming the title contains specific text, adjust as needed)
UPDATE assignments SET is_hidden = true WHERE title LIKE '%תרגיל 6%' OR title = 'תרגיל 6';
