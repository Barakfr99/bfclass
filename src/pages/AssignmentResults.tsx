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
  question_data?: any;
  answer_data?: any;
  question_type?: string;
  is_correct?: boolean;
  partial_scores?: any;
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
  const [studentId, setStudentId] = useState<string>('');
  
  const submissionIdFromQuery = searchParams.get('submissionId');
  const returnToStudent = searchParams.get('returnToStudent'); // New parameter to track return path
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
        
        // Get student name and id
        if (submission) {
          const { data: studentData } = await supabase
            .from('students')
            .select('student_name, student_id')
            .eq('student_id', submission.student_id)
            .single();
          
          if (studentData) {
            setStudentName(studentData.student_name);
            setStudentId(studentData.student_id);
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

      // Get all sentences first
      const { data: sentences } = await supabase
        .from('assignment_sentences')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('sentence_number');

      // Max score is always 100
      setMaxScore(100);

      // Get results for all sentences

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
            points_earned: 0, // Not shown per sentence anymore
            question_data: sentence.question_data,
            answer_data: answer?.answer_data,
            question_type: answer?.question_type,
            is_correct: answer?.is_correct,
            partial_scores: answer?.partial_scores
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
      // Update the specific field
      const { error: updateError } = await supabase
        .from('student_answers')
        .update({
          [`${field}_correct`]: true
        })
        .eq('id', answerId);

      if (updateError) throw updateError;

      // Recalculate total score for entire submission
      const { data: allAnswers } = await supabase
        .from('student_answers')
        .select('*, sentence_id')
        .eq('submission_id', submissionIdFromQuery);

      if (!allAnswers) return;

      // Count total correct fields and total fields
      let totalCorrectFields = 0;
      let totalFields = 0;

      for (const answer of allAnswers) {
        // Get sentence info to know which fields are required
        const { data: sentence } = await supabase
          .from('assignment_sentences')
          .select('correct_binyan, correct_guf')
          .eq('id', answer.sentence_id)
          .single();

        const hasBinyan = sentence?.correct_binyan !== null && sentence?.correct_binyan !== '';
        const hasGuf = sentence?.correct_guf !== null && sentence?.correct_guf !== '';

        // Count fields
        totalFields += 2 + (hasBinyan ? 1 : 0) + (hasGuf ? 1 : 0);

        // Count correct fields
        if (answer.shoresh_correct) totalCorrectFields++;
        if (hasBinyan && answer.binyan_correct) totalCorrectFields++;
        if (answer.zman_correct) totalCorrectFields++;
        if (hasGuf && answer.guf_correct) totalCorrectFields++;
      }

      // Calculate final score out of 100 with standard rounding
      const newTotalScore = Math.round((totalCorrectFields / totalFields) * 100);

      // Update submission total score
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({ total_score: newTotalScore })
        .eq('id', submissionIdFromQuery);

      if (submissionError) throw submissionError;

      toast.success('התשובה אושרה והציון עודכן');
      loadResults();
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
                      📝 {result.question_data ? 'שאלה' : 'משפט'} {result.sentence_number}:
                    </h3>
                    {result.question_data ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-primary">
                          {result.question_data.instruction}
                        </p>
                        {result.is_correct !== undefined && (
                          <Badge className={result.is_correct ? 'bg-success text-white' : 'bg-destructive text-white'}>
                            {result.is_correct ? '✓ נכון' : '✗ שגוי'}
                          </Badge>
                        )}
                        {result.partial_scores && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="font-medium">ניקוד חלקי:</p>
                            {Object.entries(result.partial_scores).map(([key, value]) => (
                              <p key={key} className="text-muted-foreground">
                                {key}: {value as any}/10
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-foreground/80 mb-2">{result.full_sentence}</p>
                        <p className="text-sm text-muted-foreground">
                          מילה לניתוח: <span className="font-bold text-primary">{result.analyzed_word}</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {result.question_data ? (
                      result.is_correct && <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <>
                        {result.shoresh_correct && <CheckCircle2 className="w-4 h-4 text-success" />}
                        {result.correct_binyan !== null && result.correct_binyan !== '' && result.binyan_correct && <CheckCircle2 className="w-4 h-4 text-success" />}
                        {result.zman_correct && <CheckCircle2 className="w-4 h-4 text-success" />}
                        {result.correct_guf !== null && result.correct_guf !== '' && result.guf_correct && <CheckCircle2 className="w-4 h-4 text-success" />}
                      </>
                    )}
                  </div>
                </div>

                {!result.question_data && (
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
                          <span className="text-success">✓ {result.student_shoresh}</span>
                        ) : (
                          <div className="space-y-1">
                            <div>
                              <span className="text-destructive">✗ תשובת התלמיד: {result.student_shoresh}</span>
                              <br />
                              <span className="text-muted-foreground">תשובה נכונה: {result.correct_shoresh}</span>
                            </div>
                            {isTeacherView && (
                              <Button
                                size="sm"
                                variant="default"
                                className="mt-1 h-8 text-xs gap-1 bg-success hover:bg-success/90"
                                onClick={() => approveAnswer(result.answer_id, 'shoresh')}
                              >
                                <Check className="w-3 h-3" />
                                אשר תשובה זו
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {result.correct_binyan !== null && result.correct_binyan !== '' && (
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
                            <span className="text-success">✓ {result.student_binyan}</span>
                          ) : (
                            <div className="space-y-1">
                              <div>
                                <span className="text-destructive">✗ תשובת התלמיד: {result.student_binyan}</span>
                                <br />
                                <span className="text-muted-foreground">תשובה נכונה: {result.correct_binyan}</span>
                              </div>
                              {isTeacherView && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="mt-1 h-8 text-xs gap-1 bg-success hover:bg-success/90"
                                  onClick={() => approveAnswer(result.answer_id, 'binyan')}
                                >
                                  <Check className="w-3 h-3" />
                                  אשר תשובה זו
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                          <span className="text-success">✓ {result.student_zman}</span>
                        ) : (
                          <div className="space-y-1">
                            <div>
                              <span className="text-destructive">✗ תשובת התלמיד: {result.student_zman}</span>
                              <br />
                              <span className="text-muted-foreground">תשובה נכונה: {result.correct_zman}</span>
                            </div>
                            {isTeacherView && (
                              <Button
                                size="sm"
                                variant="default"
                                className="mt-1 h-8 text-xs gap-1 bg-success hover:bg-success/90"
                                onClick={() => approveAnswer(result.answer_id, 'zman')}
                              >
                                <Check className="w-3 h-3" />
                                אשר תשובה זו
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {result.correct_guf !== null && result.correct_guf !== '' && (
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
                          <span className="text-success">✓ {result.student_guf}</span>
                        ) : (
                          <div className="space-y-1">
                            <div>
                              <span className="text-destructive">✗ תשובת התלמיד: {result.student_guf}</span>
                              <br />
                              <span className="text-muted-foreground">תשובה נכונה: {result.correct_guf}</span>
                            </div>
                            {isTeacherView && (
                              <Button
                                size="sm"
                                variant="default"
                                className="mt-1 h-8 text-xs gap-1 bg-success hover:bg-success/90"
                                onClick={() => approveAnswer(result.answer_id, 'guf')}
                              >
                                <Check className="w-3 h-3" />
                                אשר תשובה זו
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                )}

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
            <Button 
              onClick={() => {
                if (returnToStudent && studentId) {
                  navigate(`/teacher?student=${studentId}`);
                } else {
                  navigate(`/teacher/assignment/${assignmentId}`);
                }
              }} 
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {returnToStudent ? 'חזור לתלמיד' : 'חזור לפירוט המשימה'}
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
