-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  is_teacher BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (we'll refine this later)
CREATE POLICY "Allow all operations on students" ON public.students
  FOR ALL USING (true);

-- Insert initial students
INSERT INTO public.students (student_id, student_name, is_teacher) VALUES
('111111111', 'מורה', true),
('123456789', 'ישראל ישראלי', false),
('234567890', 'שרה כהן', false),
('345678901', 'דוד לוי', false),
('456789012', 'רחל אברהם', false),
('567890123', 'משה זהבי', false),
('678901234', 'תמר גולן', false),
('789012345', 'יוסף ברק', false),
('890123456', 'מיכל רוזן', false),
('901234567', 'אורי כהן', false),
('012345678', 'נועה פרץ', false),
('112345678', 'עומר דהן', false),
('212345678', 'ליאור מזרחי', false),
('312345678', 'שירה לוי', false),
('412345678', 'אביב כץ', false),
('512345678', 'מאיה שלום', false),
('612345678', 'רון אלון', false),
('712345678', 'יעל דגן', false),
('812345678', 'איתי ששון', false);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL,
  instructions_text TEXT NOT NULL,
  total_sentences INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on assignments" ON public.assignments
  FOR ALL USING (true);

-- Create assignment_sentences table
CREATE TABLE public.assignment_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  sentence_number INTEGER NOT NULL,
  full_sentence TEXT NOT NULL,
  analyzed_word TEXT NOT NULL,
  word_position INTEGER NOT NULL,
  correct_shoresh TEXT NOT NULL,
  correct_binyan TEXT NOT NULL,
  correct_zman TEXT NOT NULL,
  correct_guf TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, sentence_number)
);

ALTER TABLE public.assignment_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on assignment_sentences" ON public.assignment_sentences
  FOR ALL USING (true);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES public.students(student_id),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  total_score NUMERIC(5,2),
  submitted_at TIMESTAMP WITH TIME ZONE,
  last_submitted_at TIMESTAMP WITH TIME ZONE,
  submission_count INTEGER DEFAULT 0,
  teacher_feedback TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on submissions" ON public.submissions
  FOR ALL USING (true);

-- Create student_answers table
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  sentence_id UUID REFERENCES public.assignment_sentences(id) ON DELETE CASCADE,
  student_shoresh TEXT,
  student_binyan TEXT,
  student_zman TEXT,
  student_guf TEXT,
  shoresh_correct BOOLEAN,
  binyan_correct BOOLEAN,
  zman_correct BOOLEAN,
  guf_correct BOOLEAN,
  points_earned NUMERIC(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, sentence_id)
);

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on student_answers" ON public.student_answers
  FOR ALL USING (true);

-- Insert the first assignment
INSERT INTO public.assignments (title, assignment_type, instructions_text, total_sentences) VALUES (
  'תרגיל תורת הצורות - בסיס',
  'verb_analysis',
  'במשימה זו תתבקש לנתח 15 פעלים.

בכל משפט תמצא מילה אחת מודגשת ומנוקדת.
עליך לנתח אותה לפי 4 רכיבים:

🔹 שורש - 3 האותיות הבסיסיות של הפועל
   ניתן לכתוב: פעל, פע"ל, פ-ע-ל, פ.ע.ל

🔹 בניין - התבנית של הפועל
   7 בניינים: פעל/קל, נפעל, פיעל, פועל, הפעיל, הופעל, התפעל

🔹 זמן - עבר, הווה, עתיד, ציווי או שם פועל

🔹 גוף - גוף דקדוקי לפי הכינוי

💡 טיפ: לחץ על סימני ⓘ ליד כל שדה כדי לראות את האפשרויות!',
  15
);

-- Insert the 15 sentences for the first assignment
INSERT INTO public.assignment_sentences (assignment_id, sentence_number, full_sentence, analyzed_word, word_position, correct_shoresh, correct_binyan, correct_zman, correct_guf) 
SELECT 
  (SELECT id FROM public.assignments WHERE title = 'תרגיל תורת הצורות - בסיס'),
  sentence_number,
  full_sentence,
  analyzed_word,
  word_position,
  correct_shoresh,
  correct_binyan,
  correct_zman,
  correct_guf
FROM (VALUES
  (1, 'בכל המגזרים מַרְגִּישִׁים את המתחון.', 'מַרְגִּישִׁים', 2, 'רגש', 'הפעיל', 'הווה', 'נסתרים'),
  (2, 'אל תִּתְנַכְּלוּ לילדים אלו.', 'תִּתְנַכְּלוּ', 1, 'נכל', 'התפעל', 'עתיד', 'נוכחים'),
  (3, 'ההורים יְסַדְּרוּ את התשלומים לבית הספר.', 'יְסַדְּרוּ', 1, 'סדר', 'פיעל', 'עתיד', 'נסתרים'),
  (4, 'הגשם עומד לְהַפְסִיק.', 'לְהַפְסִיק', 2, 'פסק', 'הפעיל', 'שם פועל', 'מדבר'),
  (5, 'הפונקציות מֻגְדָּרוֹת.', 'מֻגְדָּרוֹת', 1, 'גדר', 'הופעל', 'הווה', 'נסתרות'),
  (6, 'יש לְהַפְסִיק את בזבוז המים.', 'לְהַפְסִיק', 1, 'פסק', 'הפעיל', 'שם פועל', 'מדבר'),
  (7, 'לא אַסְכִּים לכך.', 'אַסְכִּים', 1, 'סכם', 'הפעיל', 'עתיד', 'מדבר'),
  (8, 'מדוע הִסְתַּרְתֶּן את פניכן?', 'הִסְתַּרְתֶּן', 1, 'סתר', 'התפעל', 'עבר', 'נוכחות'),
  (9, 'היכן ילדיכם גְּדֵלִים?', 'גְּדֵלִים', 2, 'גדל', 'פעל', 'הווה', 'נסתרים'),
  (10, 'האם חומרים אלו יִסָּפְגוּ?', 'יִסָּפְגוּ', 3, 'ספג', 'נפעל', 'עתיד', 'נסתרים'),
  (11, 'הן מְבֻצָּרוֹת בעמדותיהן.', 'מְבֻצָּרוֹת', 1, 'בצר', 'פועל', 'הווה', 'נסתרות'),
  (12, 'אל תדליקו מדורות בלג בעומר.', 'תדליקו', 1, 'דלק', 'הפעיל', 'עתיד', 'נוכחים'),
  (13, 'חִזַּקְנוּ את יתדות האוהל.', 'חִזַּקְנוּ', 0, 'חזק', 'פיעל', 'עבר', 'מדברים'),
  (14, 'האם הן תִּקְלֹטְנָה את דבריו?', 'תִּקְלֹטְנָה', 2, 'קלט', 'פעל', 'עתיד', 'נסתרות'),
  (15, 'סיפוריך מְרַתְּקִים את כולם.', 'מְרַתְּקִים', 1, 'רתק', 'פיעל', 'הווה', 'נסתרים')
) AS sentences(sentence_number, full_sentence, analyzed_word, word_position, correct_shoresh, correct_binyan, correct_zman, correct_guf);