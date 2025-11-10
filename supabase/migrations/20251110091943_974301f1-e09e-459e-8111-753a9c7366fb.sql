-- Add is_correct column to student_answers for advanced questions
ALTER TABLE student_answers 
ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT NULL;