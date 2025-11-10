import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import AdvancedQuestion from './AdvancedQuestion';
import { toast } from '@/hooks/use-toast';

interface AssignmentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
}

interface Sentence {
  id: string;
  sentence_number: number;
  full_sentence: string;
  analyzed_word: string;
  question_data?: any;
  correct_shoresh: string;
  correct_binyan: string | null;
  correct_zman: string;
  correct_guf: string | null;
}

export default function AssignmentPreviewDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle
}: AssignmentPreviewDialogProps) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadSentences();
    }
  }, [open, assignmentId]);

  const loadSentences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignment_sentences')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('sentence_number');

      if (error) throw error;

      setSentences(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading sentences:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת המשפטים',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentSentence = sentences[currentIndex];
  const hasAdvancedQuestions = sentences.some(s => s.question_data);

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">👁️ תצוגה מקדימה: {assignmentTitle}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            תצוגה זו מציגה איך התלמידים רואים את השאלות (ללא אפשרות למילוי)
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <p>טוען...</p>
          </div>
        ) : !hasAdvancedQuestions ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                תרגיל זה לא כולל שאלות מורכבות.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                תצוגה מקדימה זמינה רק לתרגילים עם שאלות מורכבות.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                שאלה {currentIndex + 1} מתוך {sentences.length}
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                  הקודם
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === sentences.length - 1}
                >
                  הבא
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Question Display */}
            {currentSentence && (
              <Card>
                <CardContent className="pt-6">
                  {currentSentence.question_data ? (
                    <div className="space-y-4">
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          ⚠️ זוהי תצוגה בלבד - הרכיבים לא פעילים
                        </p>
                      </div>
                      
                      {/* Render the actual advanced question component in preview mode */}
                      <div className="pointer-events-none opacity-90">
                        <AdvancedQuestion
                          questionData={currentSentence.question_data}
                          submissionId="preview-mode"
                          sentenceId={currentSentence.id}
                          onComplete={() => {}}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="font-semibold mb-2">משפט {currentSentence.sentence_number}</p>
                      <p className="text-lg mb-4">{currentSentence.full_sentence}</p>
                      <p className="text-sm text-muted-foreground">
                        שאלה רגילה (לא מורכבת) - נתח את המילה: <strong>{currentSentence.analyzed_word}</strong>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>טיפ למורים:</strong> תצוגה זו מאפשרת לכם לראות בדיוק איך התלמידים
                  רואים את השאלות המורכבות ומה נדרש מהם לענות. השתמשו בה כדי להכין את התלמידים
                  לפני שהם פותרים את התרגיל.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
