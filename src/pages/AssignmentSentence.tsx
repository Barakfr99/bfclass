import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import { GRAMMAR_CONFIG, getBinyanOptions, getZmanOptions, getGufOptions } from '@/config/grammarConfig';
import AdvancedQuestion from '@/components/AdvancedQuestion';

interface Sentence {
  id: string;
  sentence_number: number;
  full_sentence: string;
  analyzed_word: string;
  word_position: number;
  correct_guf: string | null;
  correct_binyan: string | null;
  is_practice: boolean;
  question_data?: any;
}

interface Assignment {
  title: string;
}

interface Answer {
  student_shoresh: string;
  student_binyan: string;
  student_zman: string;
  student_guf: string;
}

export default function AssignmentSentence() {
  const { assignmentId, sentenceNum } = useParams<{ assignmentId: string; sentenceNum: string }>();
  const { student } = useStudent();
  const navigate = useNavigate();
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [totalSentences, setTotalSentences] = useState(0);
  const [answer, setAnswer] = useState<Answer>({
    student_shoresh: '',
    student_binyan: '',
    student_zman: '',
    student_guf: ''
  });
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const currentSentenceNum = parseInt(sentenceNum || '1');

  useEffect(() => {
    if (!student || student.isTeacher) {
      navigate('/');
      return;
    }
    loadData();
  }, [assignmentId, sentenceNum, student, navigate]);

  const loadData = async () => {
    // Load sentence
    const { data: sentenceData } = await supabase
      .from('assignment_sentences')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('sentence_number', currentSentenceNum)
      .single();

    if (sentenceData) {
      setSentence({
        ...sentenceData,
        is_practice: (sentenceData as any).is_practice || false
      });
    }

    // Get assignment data
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('title, total_sentences')
      .eq('id', assignmentId)
      .single();

    if (assignmentData) {
      setAssignment({ title: assignmentData.title });
      setTotalSentences(assignmentData.total_sentences || 0);
    }

    // Get or create submission
    let { data: submission } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student?.studentId)
      .eq('assignment_id', assignmentId)
      .single();

    if (!submission) {
      const { data: newSubmission } = await supabase
        .from('submissions')
        .insert({
          student_id: student?.studentId,
          assignment_id: assignmentId,
          status: 'in_progress'
        })
        .select()
        .single();
      submission = newSubmission;
    }

    setSubmissionId(submission?.id || null);

    // Load existing answer if any
    if (submission?.id && sentenceData?.id) {
      const { data: existingAnswer } = await supabase
        .from('student_answers')
        .select('*')
        .eq('submission_id', submission.id)
        .eq('sentence_id', sentenceData.id)
        .single();

      if (existingAnswer) {
        setAnswer({
          student_shoresh: existingAnswer.student_shoresh || '',
          student_binyan: existingAnswer.student_binyan || '',
          student_zman: existingAnswer.student_zman || '',
          student_guf: existingAnswer.student_guf || ''
        });
      } else {
        // אם אין תשובה קיימת, וודא שהשדות ריקים
        setAnswer({
          student_shoresh: '',
          student_binyan: '',
          student_zman: '',
          student_guf: ''
        });
      }
    }
  };

  const saveAnswer = async () => {
    if (!submissionId || !sentence) return;

    await supabase
      .from('student_answers')
      .upsert({
        submission_id: submissionId,
        sentence_id: sentence.id,
        student_shoresh: answer.student_shoresh,
        student_binyan: answer.student_binyan,
        student_zman: answer.student_zman,
        student_guf: answer.student_guf
      }, {
        onConflict: 'submission_id,sentence_id'
      });
  };

  const handleNext = async () => {
    await saveAnswer();
    
    if (currentSentenceNum < totalSentences) {
      navigate(`/assignment/${assignmentId}/sentence/${currentSentenceNum + 1}`);
    } else {
      navigate(`/assignment/${assignmentId}/review`);
    }
  };

  const handlePrevious = async () => {
    await saveAnswer();
    navigate(`/assignment/${assignmentId}/sentence/${currentSentenceNum - 1}`);
  };

  const renderSentenceWithHighlight = () => {
    if (!sentence) return null;
    
    const words = sentence.full_sentence.split(' ');
    return (
      <div className="text-2xl leading-loose text-center my-8">
        {words.map((word, index) => (
          <span
            key={index}
            className={index === sentence.word_position ? 
              'font-bold text-primary text-[26px]' : ''}
          >
            {word}{' '}
          </span>
        ))}
      </div>
    );
  };

  const progress = (currentSentenceNum / totalSentences) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>{assignment?.title || 'תרגיל תורת הצורות'}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {sentence?.is_practice ? 'משפט תרגול' : `משפט ${currentSentenceNum} מתוך ${totalSentences}`}
              </span>
            </div>
            {!sentence?.is_practice && <Progress value={progress} className="h-2" />}
          </CardHeader>
          <CardContent className="space-y-6">
            {renderSentenceWithHighlight()}
            
            {sentence?.question_data ? (
              // שאלה מורכבת - תצוגת רכיב מתקדם
              <AdvancedQuestion
                questionData={sentence.question_data}
                submissionId={submissionId || ''}
                sentenceId={sentence.id}
                onComplete={handleNext}
              />
            ) : (
              // שאלה רגילה - הטופס המקורי
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  נתח את המילה: {sentence?.analyzed_word}
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>שורש:</Label>
                      <Popover>
                        <PopoverTrigger>
                          <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-semibold">📌 {GRAMMAR_CONFIG.shoresh.displayName} - דוגמאות:</h4>
                            <ul className="text-sm space-y-1">
                              {GRAMMAR_CONFIG.shoresh.examples.map(example => (
                                <li key={example}>• {example}</li>
                              ))}
                            </ul>
                            <p className="text-sm text-muted-foreground">
                              💡 {GRAMMAR_CONFIG.shoresh.helpText}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      value={answer.student_shoresh}
                      onChange={(e) => setAnswer({ ...answer, student_shoresh: e.target.value })}
                      placeholder="הקלד את התשובה..."
                      maxLength={GRAMMAR_CONFIG.shoresh.maxLength}
                    />
                  </div>

                  {sentence?.correct_binyan !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>בניין:</Label>
                        <Popover>
                          <PopoverTrigger>
                            <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-semibold">📌 {GRAMMAR_CONFIG.binyan.displayName}:</h4>
                              <ul className="text-sm space-y-1">
                                {getBinyanOptions().map(option => (
                                  <li key={option.value}>• {option.label}</li>
                                ))}
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Input
                        value={answer.student_binyan}
                        onChange={(e) => setAnswer({ ...answer, student_binyan: e.target.value })}
                        placeholder="הקלד את התשובה..."
                        maxLength={GRAMMAR_CONFIG.binyan.maxLength}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>זמן:</Label>
                      <Popover>
                        <PopoverTrigger>
                          <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-semibold">📌 {GRAMMAR_CONFIG.zman.displayName}:</h4>
                            <ul className="text-sm space-y-1">
                              {getZmanOptions().map(option => (
                                <li key={option.value}>• {option.label}</li>
                              ))}
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      value={answer.student_zman}
                      onChange={(e) => setAnswer({ ...answer, student_zman: e.target.value })}
                      placeholder="הקלד את התשובה..."
                      maxLength={GRAMMAR_CONFIG.zman.maxLength}
                    />
                  </div>

                  {sentence?.correct_guf && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>גוף:</Label>
                        <Popover>
                          <PopoverTrigger>
                            <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-3">
                              <h4 className="font-semibold">📌 {GRAMMAR_CONFIG.guf.displayName}:</h4>
                              <div className="text-sm space-y-2">
                                {GRAMMAR_CONFIG.guf.groups.map((group) => (
                                  <div key={group.name}>
                                    <p className="font-medium">{group.name}:</p>
                                {group.options.map((option) => (
                                      <p key={option.value} className="text-muted-foreground">
                                        {option.value} ← {option.pronoun}
                                      </p>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Input
                        value={answer.student_guf}
                        onChange={(e) => setAnswer({ ...answer, student_guf: e.target.value })}
                        placeholder="הקלד את התשובה..."
                        maxLength={GRAMMAR_CONFIG.guf.maxLength}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSentenceNum === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                משפט קודם
              </Button>
              <Button 
                onClick={handleNext}
                className="gap-2"
              >
                {sentence?.is_practice 
                  ? 'המשך למבחן' 
                  : currentSentenceNum === totalSentences 
                    ? 'עבור לסיכום' 
                    : 'שמור והמשך'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
