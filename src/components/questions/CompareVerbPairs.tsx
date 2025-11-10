import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompareVerbPairsProps {
  questionData: any;
  submissionId: string;
  sentenceId: string;
  onComplete: () => void;
}

export default function CompareVerbPairs({ 
  questionData, 
  submissionId, 
  sentenceId,
  onComplete 
}: CompareVerbPairsProps) {
  const [selectedPair, setSelectedPair] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // טעינת תשובה קיימת
  useEffect(() => {
    loadExistingAnswer();
  }, []);

  const loadExistingAnswer = async () => {
    const { data } = await supabase
      .from('student_answers')
      .select('answer_data')
      .eq('submission_id', submissionId)
      .eq('sentence_id', sentenceId)
      .maybeSingle();

    if (data?.answer_data && typeof data.answer_data === 'object' && !Array.isArray(data.answer_data)) {
      const answerData = data.answer_data as { selected_pair?: number };
      if (answerData.selected_pair) {
        setSelectedPair(answerData.selected_pair);
      }
    }
  };

  const handleSave = async () => {
    if (selectedPair === null) {
      toast.error('יש לבחור זוג');
      return;
    }

    setIsLoading(true);

    const answerData = {
      selected_pair: selectedPair,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('student_answers')
      .upsert({
        submission_id: submissionId,
        sentence_id: sentenceId,
        question_type: 'compare_verb_pairs',
        answer_data: answerData
      }, {
        onConflict: 'submission_id,sentence_id'
      });

    setIsLoading(false);
    
    if (error) {
      toast.error('שגיאה בשמירת התשובה');
      console.error(error);
      return;
    }

    toast.success('התשובה נשמרה');
    onComplete();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {questionData.instruction}
      </h3>

      <RadioGroup value={selectedPair?.toString() || ''} onValueChange={(value) => setSelectedPair(Number(value))}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionData.pairs.map((pair: any) => (
            <Card 
              key={pair.pair_number}
              className={`cursor-pointer transition-all ${
                selectedPair === pair.pair_number 
                  ? 'ring-2 ring-primary' 
                  : ''
              }`}
              onClick={() => setSelectedPair(pair.pair_number)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem 
                    value={pair.pair_number.toString()} 
                    id={`pair-${pair.pair_number}`}
                  />
                  <Label 
                    htmlFor={`pair-${pair.pair_number}`}
                    className="text-xl cursor-pointer flex-1"
                  >
                    <div className="flex justify-between items-center">
                      <span>{pair.verb1}</span>
                      <span className="text-muted-foreground mx-2">-</span>
                      <span>{pair.verb2}</span>
                    </div>
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <Button 
        onClick={handleSave}
        disabled={isLoading || selectedPair === null}
        className="w-full"
      >
        {isLoading ? 'שומר...' : 'שמור והמשך'}
      </Button>
    </div>
  );
}
