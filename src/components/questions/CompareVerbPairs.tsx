import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [verb1Binyan, setVerb1Binyan] = useState('');
  const [verb2Binyan, setVerb2Binyan] = useState('');
  const [otherPairsBinyan, setOtherPairsBinyan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const answerData = data.answer_data as { 
        selected_pair?: number;
        verb1_binyan?: string;
        verb2_binyan?: string;
        other_pairs_binyan?: string;
      };
      if (answerData.selected_pair) {
        setSelectedPair(answerData.selected_pair);
      }
      if (answerData.verb1_binyan) {
        setVerb1Binyan(answerData.verb1_binyan);
      }
      if (answerData.verb2_binyan) {
        setVerb2Binyan(answerData.verb2_binyan);
      }
      if (answerData.other_pairs_binyan) {
        setOtherPairsBinyan(answerData.other_pairs_binyan);
      }
    }
  };

  const handleSave = async () => {
    if (selectedPair === null) {
      toast.error('יש לבחור זוג');
      return;
    }

    if (!verb1Binyan.trim() || !verb2Binyan.trim()) {
      toast.error('יש למלא את הבניין של שני הפעלים בזוג השונה');
      return;
    }

    if (!otherPairsBinyan.trim()) {
      toast.error('יש למלא את הבניין המשותף לזוגות האחרים');
      return;
    }

    setIsLoading(true);

    const answerData = {
      selected_pair: selectedPair,
      verb1_binyan: verb1Binyan.trim(),
      verb2_binyan: verb2Binyan.trim(),
      other_pairs_binyan: otherPairsBinyan.trim(),
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

  const selectedPairData = questionData.pairs.find((p: any) => p.pair_number === selectedPair);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold whitespace-pre-line">
          {questionData.instruction}
        </h3>
        
        {questionData.sub_questions && (
          <div className="bg-muted/50 p-4 rounded-lg mt-4 space-y-2">
            {questionData.sub_questions.part_a && (
              <p className="text-sm">{questionData.sub_questions.part_a.text}</p>
            )}
            {questionData.sub_questions.part_b && (
              <p className="text-sm">{questionData.sub_questions.part_b.text}</p>
            )}
          </div>
        )}
      </div>

      <RadioGroup value={selectedPair?.toString() || ''} onValueChange={(value) => setSelectedPair(Number(value))}>
        <div className="space-y-4">
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
                <div className="flex items-start gap-3">
                  <RadioGroupItem 
                    value={pair.pair_number.toString()} 
                    id={`pair-${pair.pair_number}`}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={`pair-${pair.pair_number}`}
                    className="cursor-pointer flex-1"
                  >
                    <div className="mb-2 text-sm text-muted-foreground">זוג {pair.pair_number}</div>
                    <div className="space-y-1 text-lg">
                      <div>{pair.sentence1_full || pair.verb1.sentence}</div>
                      <div>{pair.sentence2_full || pair.verb2.sentence}</div>
                    </div>
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {selectedPair !== null && selectedPairData && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-semibold">פרטי הזוג השונה (זוג {selectedPair}):</h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="verb1-binyan" className="mb-2 block">
                בניין של הפועל הראשון: <span className="font-semibold">{selectedPairData.verb1.word}</span>
              </Label>
              <Input
                id="verb1-binyan"
                value={verb1Binyan}
                onChange={(e) => setVerb1Binyan(e.target.value)}
                placeholder=""
              />
            </div>

            <div>
              <Label htmlFor="verb2-binyan" className="mb-2 block">
                בניין של הפועל השני: <span className="font-semibold">{selectedPairData.verb2.word}</span>
              </Label>
              <Input
                id="verb2-binyan"
                value={verb2Binyan}
                onChange={(e) => setVerb2Binyan(e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="other-binyan" className="mb-2 block">
              הבניין המשותף לשאר הזוגות:
            </Label>
            <Input
              id="other-binyan"
              value={otherPairsBinyan}
              onChange={(e) => setOtherPairsBinyan(e.target.value)}
              placeholder=""
            />
          </div>
        </div>
      )}

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
