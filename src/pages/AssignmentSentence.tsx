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

interface Sentence {
  id: string;
  sentence_number: number;
  full_sentence: string;
  analyzed_word: string;
  word_position: number;
  correct_guf: string | null;
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

    setSentence(sentenceData);

    // Get total sentences
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('total_sentences')
      .eq('id', assignmentId)
      .single();

    setTotalSentences(assignmentData?.total_sentences || 0);

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
              'font-bold text-primary underline decoration-2 text-[26px]' : ''}
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
              <CardTitle>תרגיל תורת הצורות</CardTitle>
              <span className="text-sm text-muted-foreground">
                משפט {currentSentenceNum} מתוך {totalSentences}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {renderSentenceWithHighlight()}
            
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
                          <h4 className="font-semibold">📌 דוגמאות לכתיבת שורש:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• כתב</li>
                            <li>• כ-ת-ב</li>
                            <li>• כ.ת.ב</li>
                            <li>• כת"ב</li>
                          </ul>
                          <p className="text-sm text-muted-foreground">
                            💡 ניתן להשתמש באות רגילה או סופית
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    value={answer.student_shoresh}
                    onChange={(e) => setAnswer({ ...answer, student_shoresh: e.target.value })}
                    placeholder="הקלד את התשובה..."
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>בניין:</Label>
                    <Popover>
                      <PopoverTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">📌 7 בניינים:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• פעל / קל</li>
                            <li>• נפעל</li>
                            <li>• פיעל</li>
                            <li>• פועל</li>
                            <li>• הפעיל</li>
                            <li>• הופעל</li>
                            <li>• התפעל</li>
                          </ul>
                          <p className="text-sm text-muted-foreground">
                            💡 ניתן לכתוב גם "פעל-קל" או "היפעיל"
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    value={answer.student_binyan}
                    onChange={(e) => setAnswer({ ...answer, student_binyan: e.target.value })}
                    placeholder="הקלד את התשובה..."
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>זמן:</Label>
                    <Popover>
                      <PopoverTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">📌 זמנים אפשריים:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• עבר</li>
                            <li>• הווה / בינוני</li>
                            <li>• עתיד</li>
                            <li>• ציווי</li>
                            <li>• שם פועל</li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    value={answer.student_zman}
                    onChange={(e) => setAnswer({ ...answer, student_zman: e.target.value })}
                    placeholder="הקלד את התשובה..."
                    maxLength={15}
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
                          <div className="space-y-2">
                            <h4 className="font-semibold">📌 גופים דקדוקיים:</h4>
                            <ul className="text-sm space-y-1">
                              <li>• מדבר / מדברת / מדברים / מדברות</li>
                              <li>• נוכח / נוכחת / נוכחים / נוכחות</li>
                              <li>• נסתר / נסתרת / נסתרים / נסתרות</li>
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      value={answer.student_guf}
                      onChange={(e) => setAnswer({ ...answer, student_guf: e.target.value })}
                      placeholder="הקלד את התשובה..."
                      maxLength={15}
                    />
                  </div>
                )}
              </div>
            </div>

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
                {currentSentenceNum === totalSentences ? 'עבור לסיכום' : 'שמור והמשך'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
