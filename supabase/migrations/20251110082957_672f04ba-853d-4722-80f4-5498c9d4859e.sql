-- הוספת שדה question_data ל-assignment_sentences
ALTER TABLE assignment_sentences 
ADD COLUMN IF NOT EXISTS question_data JSONB;

-- הוספת שדות חדשים ל-student_answers לשאלות מורכבות
ALTER TABLE student_answers 
ADD COLUMN IF NOT EXISTS question_type text,
ADD COLUMN IF NOT EXISTS answer_data JSONB,
ADD COLUMN IF NOT EXISTS partial_scores JSONB;

-- אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_assignment_sentences_question_data 
ON assignment_sentences USING gin(question_data);

CREATE INDEX IF NOT EXISTS idx_student_answers_answer_data 
ON student_answers USING gin(answer_data);

COMMENT ON COLUMN assignment_sentences.question_data IS 'JSON structure for advanced question types';
COMMENT ON COLUMN student_answers.question_type IS 'Type of advanced question (compare_verb_pairs, multi_stage_analysis, etc.)';
COMMENT ON COLUMN student_answers.answer_data IS 'Student answers for advanced questions in JSON format';
COMMENT ON COLUMN student_answers.partial_scores IS 'Partial scores for multi-part questions';