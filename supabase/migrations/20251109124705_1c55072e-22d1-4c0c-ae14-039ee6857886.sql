-- Add is_practice column to assignment_sentences table
ALTER TABLE public.assignment_sentences
ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT false;