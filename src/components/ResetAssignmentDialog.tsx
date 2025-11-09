import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface Student {
  student_id: string;
  student_name: string;
  submission?: {
    id: string;
    status: string;
  };
  completedSentences?: number;
}

interface ResetAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  assignmentId: string;
  onSuccess: () => void;
}

export default function ResetAssignmentDialog({
  open,
  onOpenChange,
  student,
  assignmentId,
  onSuccess,
}: ResetAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!student.submission) return;

    setLoading(true);
    try {
      // 1. Delete all answers
      const { error: answersError } = await supabase
        .from('student_answers')
        .delete()
        .eq('submission_id', student.submission.id);

      if (answersError) throw answersError;

      // 2. Delete the submission
      const { error: submissionError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', student.submission.id);

      if (submissionError) throw submissionError;

      toast({
        title: 'הצלחה',
        description: 'התרגיל אופס בהצלחה',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error resetting assignment:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה באיפוס התרגיל',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return `בתהליך (${student.completedSentences || 0} משפטים)`;
      case 'submitted':
        return 'הוגש';
      case 'returned_for_revision':
        return 'הוחזר לתיקון';
      default:
        return 'לא ידוע';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            ⚠️ אישור איפוס תרגיל
          </DialogTitle>
          <DialogDescription>
            פעולה זו תמחק את כל העבודה של התלמיד ואינה ניתנת לביטול
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm mb-1">
                <span className="font-semibold">תלמיד:</span> {student.student_name}
              </p>
              <p className="text-sm mb-1">
                <span className="font-semibold">ת.ז:</span> {student.student_id}
              </p>
              {student.submission && (
                <p className="text-sm">
                  <span className="font-semibold">סטטוס נוכחי:</span>{' '}
                  {getStatusText(student.submission.status)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 p-4 bg-destructive/10 rounded-md border border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <p className="font-semibold text-destructive">🚨 פעולה זו תמחק:</p>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground pr-6">
              <li>• את כל התשובות שהתלמיד כתב</li>
              <li>• את ההתקדמות שלו במשימה</li>
              <li>• את הציון (אם קיים)</li>
              <li>• את הפידבק (אם קיים)</li>
            </ul>
            <p className="text-sm font-semibold text-destructive">
              התלמיד יצטרך להתחיל מחדש מאפס!
            </p>
          </div>

          <div className="p-3 bg-muted rounded-md border border-border">
            <p className="text-sm font-semibold mb-1">⚠️ פעולה זו בלתי הפיכה!</p>
            <p className="text-xs text-muted-foreground">
              לאחר המחיקה, לא יהיה ניתן לשחזר את התשובות או ההתקדמות של התלמיד.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? 'מאפס...' : 'אשר ואפס'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
