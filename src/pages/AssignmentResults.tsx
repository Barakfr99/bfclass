import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Trophy, Home, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SentenceResult {
  answer_id: string;
  sentence_number: number;
  full_sentence: string;
  analyzed_word: string;
  student_shoresh: string;
  student_binyan: string;
  student_zman: string;
  student_guf: string;
  correct_shoresh: string;
  correct_binyan: string;
  correct_zman: string;
  correct_guf: string;
  shoresh_correct: boolean;
  binyan_correct: boolean;
  zman_correct: boolean;
  guf_correct: boolean;
  points_earned: number;
}

export default function AssignmentResults() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { student } = useStudent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<SentenceResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>('');
  
  const submissionIdFromQuery = searchParams.get('submissionId');
  const isTeacherView = student?.isTeacher && submissionIdFromQuery;

  useEffect(() => {
    if (!student) {
      navigate('/');
      return;
    }
    loadResults();
  }, [assignmentId, student, navigate, submissionIdFromQuery]);

  const loadResults = async () => {
    try {
      let submission;
      
      if (isTeacherView) {
        // Teacher viewing a specific submission
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionIdFromQuery)
          .single();
        
        submission = submissionData;
        
        // Get student name
        if (submission) {
          const { data: studentData } = await supabase
            .from('students')
            .select('student_name')
            .eq('student_id', submission.student_id)
            .single();
          
          if (studentData) {
            setStudentName(studentData.student_name);
          }
        }
      } else {
        // Student viewing their own submission
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', student?.studentId)
          .eq('assignment_id', assignmentId)
          .single();
        
        submission = submissionData;
      }

      if (!submission) {
        if (isTeacherView) {
          navigate(`/teacher/assignment/${assignmentId}`);
        } else {
          navigate(`/assignment/${assignmentId}/instructions`);
        }
        return;
      }
      
      // For students, only show if submitted. For teachers, show any status
      if (!isTeacherView && submission.status !== 'submitted') {
        navigate(`/assignment/${assignmentId}/instructions`);
        return;
      }

      setTotalScore(submission.total_score || 0);

      // Get assignment details
      const { data: assignment } = await supabase
        .from('assignments')
        .select('total_sentences')
        .eq('id', assignmentId)
        .single();

      setMaxScore((assignment?.total_sentences || 0) * 10);

      // Get all sentences with results
      const { data: sentences } = await supabase
        .from('assignment_sentences')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('sentence_number');

      const sentencesWithResults = await Promise.all(
        (sentences || []).map(async (sentence) => {
          const { data: answer } = await supabase
            .from('student_answers')
            .select('*')
            .eq('submission_id', submission.id)
            .eq('sentence_id', sentence.id)
            .single();

          return {
            answer_id: answer?.id || '',
            sentence_number: sentence.sentence_number,
            full_sentence: sentence.full_sentence,
            analyzed_word: sentence.analyzed_word,
            student_shoresh: answer?.student_shoresh || '',
            student_binyan: answer?.student_binyan || '',
            student_zman: answer?.student_zman || '',
            student_guf: answer?.student_guf || '',
            correct_shoresh: sentence.correct_shoresh,
            correct_binyan: sentence.correct_binyan,
            correct_zman: sentence.correct_zman,
            correct_guf: sentence.correct_guf,
            shoresh_correct: answer?.shoresh_correct || false,
            binyan_correct: answer?.binyan_correct || false,
            zman_correct: answer?.zman_correct || false,
            guf_correct: answer?.guf_correct || false,
            points_earned: answer?.points_earned || 0
          };
        })
      );

      setResults(sentencesWithResults);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-success';
    if (percentage >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadgeColor = (score: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'bg-success/10 text-success border-success/20';
    if (percentage >= 70) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const approveAnswer = async (answerId: string, field: 'shoresh' | 'binyan' | 'zman' | 'guf') => {
    try {
      // Get current answer data
      const { data: currentAnswer } = await supabase
        .from('student_answers')
        .select('*')
        .eq('id', answerId)
        .single();

      if (!currentAnswer) {
        toast.error('לא נמצאה תשובה');
        return;
      }

      // Calculate new points
      const fieldsCorrect = {
        shoresh_correct: currentAnswer.shoresh_correct,
        binyan_correct: currentAnswer.binyan_correct,
        zman_correct: currentAnswer.zman_correct,
        guf_correct: currentAnswer.guf_correct
      };

      // Update the specific field
      fieldsCorrect[`${field}_correct`] = true;

      // Count correct fields
      const correctCount = Object.values(fieldsCorrect).filter(v => v).length;
      const newPoints = correctCount * 2.5;

      // Update the answer
      const { error: updateError } = await supabase
        .from('student_answers')
        .update({
          [`${field}_correct`]: true,
          points_earned: newPoints
        })
        .eq('id', answerId);

      if (updateError) throw updateError;

      // Recalculate total score for submission
      const { data: allAnswers } = await supabase
        .from('student_answers')
        .select('points_earned')
        .eq('submission_id', submissionIdFromQuery);

      const newTotalScore = allAnswers?.reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0;

      // Update submission total score
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({ total_score: newTotalScore })
        .eq('id', submissionIdFromQuery);

      if (submissionError) throw submissionError;

      toast.success('התשובה אושרה והציון עודכן');
      loadResults(); // Reload to show updated data
    } catch (error) {
      console.error('Error approving answer:', error);
      toast.error('שגיאה באישור התשובה');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  const percentage = (totalScore / maxScore) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Score Header */}
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl">
              🏆 תוצאות התרגיל
              {isTeacherView && studentName && (
                <span className="block text-xl text-muted-foreground mt-2">
                  תלמיד: {studentName}
                </span>
              )}
            </CardTitle>
            <div className="space-y-2">
              <p className={`text-5xl font-bold ${getScoreColor(totalScore)}`}>
                {totalScore}
              </p>
              <Progress value={percentage} className="h-3" />
              <p className="text-muted-foreground">מתוך {maxScore} נקודות ({Math.round(percentage)}%)</p>
            </div>
          </CardHeader>
        </Card>

        {/* Results List */}
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.sentence_number}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      📝 משפט {result.sentence_number}:
                    </h3>
                    <p className="text-foreground/80 mb-2">{result.full_sentence}</p>
                    <p className="text-sm text-muted-foreground">
                      מילה לניתוח: <span className="font-bold text-primary">{result.analyzed_word}</span>
                    </p>
                  </div>
                  <Badge className={getScoreBadgeColor(result.points_earned)}>
                    {result.points_earned}/10
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.shoresh_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">שורש:</span>
                    </div>
                    <div className="text-sm pr-6 space-y-1">
                      {result.shoresh_correct ? (
                        <span className="text-success">✓ {result.student_shoresh} (2.5 נק')</span>
                      ) : (
                        <>
                          <div>
                            <span className="text-destructive">✗ שלך: {result.student_shoresh}</span>
                            <br />
                            <span className="text-muted-foreground">נכון: {result.correct_shoresh} (0 נק')</span>
                          </div>
                          {isTeacherView && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs gap-1"
                              onClick={() => approveAnswer(result.answer_id, 'shoresh')}
                            >
                              <Check className="w-3 h-3" />
                              אשר תשובה
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.binyan_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">בניין:</span>
                    </div>
                    <div className="text-sm pr-6 space-y-1">
                      {result.binyan_correct ? (
                        <span className="text-success">✓ {result.student_binyan} (2.5 נק')</span>
                      ) : (
                        <>
                          <div>
                            <span className="text-destructive">✗ שלך: {result.student_binyan}</span>
                            <br />
                            <span className="text-muted-foreground">נכון: {result.correct_binyan} (0 נק')</span>
                          </div>
                          {isTeacherView && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs gap-1"
                              onClick={() => approveAnswer(result.answer_id, 'binyan')}
                            >
                              <Check className="w-3 h-3" />
                              אשר תשובה
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.zman_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">זמן:</span>
                    </div>
                    <div className="text-sm pr-6 space-y-1">
                      {result.zman_correct ? (
                        <span className="text-success">✓ {result.student_zman} (2.5 נק')</span>
                      ) : (
                        <>
                          <div>
                            <span className="text-destructive">✗ שלך: {result.student_zman}</span>
                            <br />
                            <span className="text-muted-foreground">נכון: {result.correct_zman} (0 נק')</span>
                          </div>
                          {isTeacherView && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs gap-1"
                              onClick={() => approveAnswer(result.answer_id, 'zman')}
                            >
                              <Check className="w-3 h-3" />
                              אשר תשובה
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.guf_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">גוף:</span>
                    </div>
                    <div className="text-sm pr-6 space-y-1">
                      {result.guf_correct ? (
                        <span className="text-success">✓ {result.student_guf} (2.5 נק')</span>
                      ) : (
                        <>
                          <div>
                            <span className="text-destructive">✗ שלך: {result.student_guf}</span>
                            <br />
                            <span className="text-muted-foreground">נכון: {result.correct_guf} (0 נק')</span>
                          </div>
                          {isTeacherView && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs gap-1"
                              onClick={() => approveAnswer(result.answer_id, 'guf')}
                            >
                              <Check className="w-3 h-3" />
                              אשר תשובה
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className={`text-sm font-semibold ${result.points_earned === 10 ? 'text-success' : ''}`}>
                    ציון משפט: {result.points_earned}/10 {result.points_earned === 10 ? '✓' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          {isTeacherView ? (
            <Button onClick={() => navigate(`/teacher/assignment/${assignmentId}`)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              חזור לפירוט המשימה
            </Button>
          ) : (
            <Button onClick={() => navigate('/student')} className="gap-2">
              <Home className="w-4 h-4" />
              חזור לדף הבית
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
