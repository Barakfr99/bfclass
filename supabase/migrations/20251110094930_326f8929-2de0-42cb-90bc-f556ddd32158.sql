-- Fix function search path for security
CREATE OR REPLACE FUNCTION public.update_student_notes_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;