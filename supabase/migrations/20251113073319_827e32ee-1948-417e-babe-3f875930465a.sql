-- Add grade_level column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade_level TEXT DEFAULT 'י''א';

-- Update existing students from the data provided (all are י''א 1)
UPDATE students SET grade_level = 'י''א' WHERE grade_level IS NULL;

-- Add grade_level column to assignments table for filtering
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS grade_level TEXT;