-- Make correct_binyan nullable to support assignments without binyan field
ALTER TABLE public.assignment_sentences
ALTER COLUMN correct_binyan DROP NOT NULL;