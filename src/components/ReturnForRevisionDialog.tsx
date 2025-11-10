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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

interface Submission {
  id: string;
  student_id: string;
  total_score: number | null;
}

interface ReturnForRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission;
  onSuccess: () => void;
}

export default function ReturnForRevisionDialog({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: ReturnForRevisionDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'returned_for_revision',
          teacher_feedback: feedback.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'המשימה הוחזרה לתיקון בהצלחה',
      });

      setFeedback('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error returning for revision:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהחזרה לתיקון',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔙 החזרה לתיקון
          </DialogTitle>
          <DialogDescription>
            התלמיד יוכל לערוך את תשובותיו ולהגיש מחדש
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {submission.total_score !== null && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <span className="font-semibold">ציון נוכחי:</span> {submission.total_score}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback">
              💬 פידבק למידן <span className="text-muted-foreground text-xs">(אופציונאלי)</span>
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="לדוגמה: שים לב לזיהוי הבניין - יש טעויות חוזרות במשפטים 3, 5, 7"
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              ניתן להחזיר לתיקון עם או בלי הערה
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">שים לב:</p>
              <p className="text-muted-foreground">
                התלמיד יוכל לערוך את תשובותיו ולהגיש מחדש. התשובות הקודמות יישמרו.
              </p>
            </div>
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
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'מחזיר...' : 'אשר והחזר לתיקון'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
