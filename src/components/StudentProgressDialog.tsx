import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Student {
  student_id: string;
  student_name: string;
  submission?: {
    id: string;
    created_at: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  total_sentences: number;
}

interface SentenceProgress {
  sentenceNumber: number;
  completedFields: number;
  totalFields: number;
}

interface StudentProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  assignment: Assignment;
}

export default function StudentProgressDialog({
  open,
  onOpenChange,
  student,
  assignment,
}: StudentProgressDialogProps) {
  const [progress, setProgress] = useState<SentenceProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && student.submission) {
      loadProgress();
    }
  }, [open, student.submission]);

  const loadProgress = async () => {
    if (!student.submission) return;

    setLoading(true);
    try {
      // Load all sentence IDs for this assignment
      const { data: sentences } = await supabase
        .from('assignment_sentences')
        .select('id, sentence_number')
        .eq('assignment_id', assignment.id)
        .order('sentence_number');

      // Load all answers for this submission
      const { data: answers } = await supabase
        .from('student_answers')
        .select('*')
        .eq('submission_id', student.submission.id);

      // Map progress for each sentence
      const progressData: SentenceProgress[] = [];
      
      for (let i = 1; i <= assignment.total_sentences; i++) {
        const sentence = sentences?.find(s => s.sentence_number === i);
        const answer = sentence ? answers?.find(a => a.sentence_id === sentence.id) : null;
        
        let completedFields = 0;
        if (answer) {
          if (answer.student_shoresh && answer.student_shoresh.trim() !== '') completedFields++;
          if (answer.student_binyan && answer.student_binyan.trim() !== '') completedFields++;
          if (answer.student_zman && answer.student_zman.trim() !== '') completedFields++;
          if (answer.student_guf && answer.student_guf.trim() !== '') completedFields++;
        }
        
        progressData.push({
          sentenceNumber: i,
          completedFields,
          totalFields: 4,
        });
      }

      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (completedFields: number, totalFields: number) => {
    if (completedFields === totalFields) {
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    } else if (completedFields > 0) {
      return <AlertCircle className="w-5 h-5 text-warning" />;
    } else {
      return <XCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (completedFields: number, totalFields: number) => {
    if (completedFields === totalFields) {
      return { text: 'הושלם', color: 'bg-success' };
    } else if (completedFields > 0) {
      return { text: 'חלקי', color: 'bg-warning' };
    } else {
      return { text: 'לא מולא', color: 'bg-muted' };
    }
  };

  const getMissingFields = (completedFields: number) => {
    if (completedFields === 4) return null;
    
    const missing: string[] = [];
    const fields = ['שורש', 'בניין', 'זמן', 'גוף'];
    
    // This is a simplified version - in reality we'd need to check which specific fields are missing
    const missingCount = 4 - completedFields;
    return `חסרים ${missingCount} שדות`;
  };

  const totalCompleted = progress.filter(p => p.completedFields === p.totalFields).length;
  const percentage = Math.round((totalCompleted / assignment.total_sentences) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📊 התקדמות: {student.student_name}
          </DialogTitle>
          <DialogDescription>
            משימה: {assignment.title}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">סה"כ התקדמות:</span>
                <span className="text-2xl font-bold text-primary">
                  {totalCompleted} / {assignment.total_sentences}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {percentage}% הושלמו
              </p>
              {student.submission && (
                <p className="text-xs text-muted-foreground">
                  תאריך התחלה: {new Date(student.submission.created_at).toLocaleString('he-IL')}
                </p>
              )}
            </div>

            {/* Progress List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {progress.map((item) => {
                const status = getStatusText(item.completedFields, item.totalFields);
                const missingFields = getMissingFields(item.completedFields);
                
                return (
                  <div
                    key={item.sentenceNumber}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-border"
                  >
                    {getStatusIcon(item.completedFields, item.totalFields)}
                    <div className="flex-1">
                      <p className="font-medium">משפט {item.sentenceNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={status.color} variant="outline">
                          {status.text} ({item.completedFields}/{item.totalFields} שדות)
                        </Badge>
                        {missingFields && (
                          <span className="text-xs text-muted-foreground">
                            {missingFields}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-center pt-4 border-t">
              <Button onClick={() => onOpenChange(false)}>
                סגור
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
