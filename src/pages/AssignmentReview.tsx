import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { 
  validateShoresh, 
  validateBinyan, 
  validateZman, 
  validateGuf
} from '@/utils/validation';

interface SentenceAnswer {
  sentence_id: string;
  sentence_number: number;
  full_sentence: string;
  analyzed_word: string;
  student_shoresh: string | null;
  student_binyan: string | null;
  student_zman: string | null;
  student_guf: string | null;
  correct_shoresh: string;
  correct_binyan: string | null;
  correct_zman: string;
  correct_guf: string | null;
  is_practice: boolean;
}

export default function AssignmentReview() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { student } = useStudent();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<SentenceAnswer[]>([]);
  const [totalSentences, setTotalSentences] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!student || student.isTeacher) {
      navigate('/');
      return;
    }
    loadData();
  }, [assignmentId, student, navigate]);

  const loadData = async () => {
    try {
      // Get assignment details
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('total_sentences')
        .eq('id', assignmentId)
        .single();

      setTotalSentences(assignmentData?.total_sentences || 0);

      // Get submission
      const { data: submission } = await supabase
        .from('submissions')
        .select('id')
        .eq('student_id', student?.studentId)
        .eq('assignment_id', assignmentId)
        .single();

      if (!submission) {
        navigate(`/assignment/${assignmentId}/instructions`);
        return;
      }

      // Get all sentences with answers (excluding practice sentences)
      const { data: sentences } = await supabase
        .from('assignment_sentences')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('sentence_number') as any;

      // Filter out practice sentences
      const gradedSentences = (sentences || []).filter((s: any) => !s.is_practice);

      const sentencesWithAnswers = await Promise.all(
        gradedSentences.map(async (sentence: any) => {
          const { data: answer } = await supabase
            .from('student_answers')
            .select('*')
            .eq('submission_id', submission.id)
            .eq('sentence_id', sentence.id)
            .maybeSingle();

          return {
            sentence_id: sentence.id,
            sentence_number: sentence.sentence_number,
            full_sentence: sentence.full_sentence,
            analyzed_word: sentence.analyzed_word,
            student_shoresh: answer?.student_shoresh || null,
            student_binyan: answer?.student_binyan || null,
            student_zman: answer?.student_zman || null,
            student_guf: answer?.student_guf || null,
            correct_shoresh: sentence.correct_shoresh,
            correct_binyan: sentence.correct_binyan || null,
            correct_zman: sentence.correct_zman,
            correct_guf: sentence.correct_guf,
            is_practice: sentence.is_practice || false
          };
        })
      );

      setAnswers(sentencesWithAnswers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAnswerComplete = (answer: SentenceAnswer) => {
    const requiredFields = [
      answer.student_shoresh?.trim(),
      answer.student_zman?.trim()
    ];
    
    // אם יש בניין, גם הוא נדרש
    if (answer.correct_binyan) {
      requiredFields.push(answer.student_binyan?.trim());
    }
    
    // אם יש גוף, גם הוא נדרש
    if (answer.correct_guf) {
      requiredFields.push(answer.student_guf?.trim());
    }
    
    return requiredFields.every(f => f);
  };

  const isAnswerPartial = (answer: SentenceAnswer) => {
    const fields = [
      answer.student_shoresh,
      answer.student_zman
    ];
    
    if (answer.correct_binyan) {
      fields.push(answer.student_binyan);
    }
    
    if (answer.correct_guf) {
      fields.push(answer.student_guf);
    }
    
    const filledFields = fields.filter(f => f && f.trim()).length;
    const totalFields = (answer.correct_binyan ? 1 : 0) + (answer.correct_guf ? 1 : 0) + 2; // 2 for shoresh and zman
    return filledFields > 0 && filledFields < totalFields;
  };

  const getMissingFields = (answer: SentenceAnswer) => {
    const missing = [];
    if (!answer.student_shoresh?.trim()) missing.push('שורש');
    if (answer.correct_binyan && !answer.student_binyan?.trim()) missing.push('בניין');
    if (!answer.student_zman?.trim()) missing.push('זמן');
    if (answer.correct_guf && !answer.student_guf?.trim()) missing.push('גוף');
    return missing;
  };

  const getTotalFields = (answer: SentenceAnswer) => {
    return 2 + (answer.correct_binyan ? 1 : 0) + (answer.correct_guf ? 1 : 0);
  };

  const getFilledFields = (answer: SentenceAnswer) => {
    const fields = [
      answer.student_shoresh,
      answer.student_zman
    ];
    
    if (answer.correct_binyan) {
      fields.push(answer.student_binyan);
    }
    
    if (answer.correct_guf) {
      fields.push(answer.student_guf);
    }
    
    return fields.filter(f => f && f.trim()).length;
  };

  const completedCount = answers.filter(isAnswerComplete).length;

  const handleEdit = (sentenceNumber: number) => {
    navigate(`/assignment/${assignmentId}/sentence/${sentenceNumber}`);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Get submission
      const { data: submission } = await supabase
        .from('submissions')
        .select('id, submission_count')
        .eq('student_id', student?.studentId)
        .eq('assignment_id', assignmentId)
        .single();

      if (!submission) return;

      // Calculate scores - count all correct fields
      let totalCorrectFields = 0;
      let totalFields = 0;
      const answerUpdates = [];

      for (const answer of answers) {
        const shoreshCorrect = validateShoresh(answer.student_shoresh || '', answer.correct_shoresh);
        const binyanCorrect = answer.correct_binyan 
          ? validateBinyan(answer.student_binyan || '', answer.correct_binyan)
          : true;
        const zmanCorrect = validateZman(answer.student_zman || '', answer.correct_zman);
        const gufCorrect = validateGuf(answer.student_guf || '', answer.correct_guf);
        
        const hasBinyan = answer.correct_binyan !== null;
        const hasGuf = answer.correct_guf !== null;
        
        // Count fields for this sentence
        const fieldsInSentence = 2 + (hasBinyan ? 1 : 0) + (hasGuf ? 1 : 0);
        totalFields += fieldsInSentence;
        
        // Count correct fields
        if (shoreshCorrect) totalCorrectFields++;
        if (hasBinyan && binyanCorrect) totalCorrectFields++;
        if (zmanCorrect) totalCorrectFields++;
        if (hasGuf && gufCorrect) totalCorrectFields++;
        
        // Store validation results for this answer
        answerUpdates.push({
          sentence_id: answer.sentence_id,
          shoresh_correct: shoreshCorrect,
          binyan_correct: hasBinyan ? binyanCorrect : null,
          zman_correct: zmanCorrect,
          guf_correct: hasGuf ? gufCorrect : null
        });

      }

      // Calculate final score out of 100 with standard rounding
      const totalScore = Math.round((totalCorrectFields / totalFields) * 100);

      // Update all answers with validation results
      for (const update of answerUpdates) {
        await supabase
          .from('student_answers')
          .update({
            shoresh_correct: update.shoresh_correct,
            binyan_correct: update.binyan_correct,
            zman_correct: update.zman_correct,
            guf_correct: update.guf_correct,
            updated_at: new Date().toISOString()
          })
          .eq('submission_id', submission.id)
          .eq('sentence_id', update.sentence_id);
      }

      // Update submission status
      await supabase
        .from('submissions')
        .update({
          status: 'submitted',
          total_score: totalScore,
          submitted_at: new Date().toISOString(),
          last_submitted_at: new Date().toISOString(),
          submission_count: (submission.submission_count || 0) + 1,
          teacher_feedback: null // Clear feedback on resubmission
        })
        .eq('id', submission.id);

      toast.success('התרגיל הוגש בהצלחה!');
      navigate(`/assignment/${assignmentId}/results`);
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('אירעה שגיאה בהגשת התרגיל');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">סיכום התרגיל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {answers.map((answer) => (
              <div
                key={answer.sentence_id}
                onClick={() => handleEdit(answer.sentence_number)}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isAnswerComplete(answer) ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : isAnswerPartial(answer) ? (
                      <AlertCircle className="w-5 h-5 text-warning" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-semibold">משפט {answer.sentence_number}</p>
                      {isAnswerComplete(answer) ? (
                        <p className="text-sm text-success">
                          ✓ הושלם ({getFilledFields(answer)}/{getTotalFields(answer)} שדות)
                        </p>
                      ) : isAnswerPartial(answer) ? (
                        <p className="text-sm text-warning">
                          ⚠️ חלקי ({getFilledFields(answer)}/{getTotalFields(answer)}) - חסרים: {getMissingFields(answer).join(', ')}
                        </p>
                      ) : (
                        <p className="text-sm text-destructive">
                          ✗ לא מולא (0/{getTotalFields(answer)} שדות)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t space-y-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">
                  הושלמו {completedCount} מתוך {totalSentences} משפטים
                </p>
                <p className="text-xs text-muted-foreground">
                  לחץ על משפט כדי לערוך אותו
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/assignment/${assignmentId}/sentence/1`)}
                >
                  חזור לעריכה
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? 'שולח...' : 'הגש תרגיל ✓'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
