-- Create student_notes table for teacher comments and tags
CREATE TABLE public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  note_text TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (since we don't have auth system for teachers yet)
CREATE POLICY "Allow all operations on student_notes"
ON public.student_notes
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_student_notes_student_id ON public.student_notes(student_id);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_student_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_notes_timestamp
BEFORE UPDATE ON public.student_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_student_notes_updated_at();