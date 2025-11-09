-- Allow NULL values for correct_guf to support infinitives (שם פועל)
ALTER TABLE assignment_sentences 
ALTER COLUMN correct_guf DROP NOT NULL;