import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { highlightWord } from '@/utils/textHighlight';

interface CommonBinyanAndRootsProps {
  questionData: any;
  submissionId: string;
  sentenceId: string;
  onComplete: () => void;
}

export default function CommonBinyanAndRoots({ 
  questionData, 
  submissionId, 
  sentenceId,
  onComplete 
}: CommonBinyanAndRootsProps) {
  const [commonBinyan, setCommonBinyan] = useState('');
  const [roots, setRoots] = useState<Record<number, string>>({});
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
        common_binyan?: string;
        roots?: Array<{ sentence: number; shoresh: string }>;
      };
      
      if (answerData.common_binyan) {
        setCommonBinyan(answerData.common_binyan);
      }
      if (answerData.roots && Array.isArray(answerData.roots)) {
        const rootsObj: Record<number, string> = {};
        answerData.roots.forEach((r) => {
          rootsObj[r.sentence] = r.shoresh;
        });
        setRoots(rootsObj);
      }
    }
  };

  const handleSave = async () => {
    if (!commonBinyan.trim()) {
      toast.error('יש למלא את הבניין המשותף');
      return;
    }

    const missingRoots = questionData.sentences.filter((s: any) => !roots[s.sentence_number]?.trim());
    if (missingRoots.length > 0) {
      toast.error('יש למלא את כל השורשים');
      return;
    }

    setIsLoading(true);

    const answerData = {
      common_binyan: commonBinyan,
      roots: questionData.sentences.map((s: any) => ({
        sentence: s.sentence_number,
        shoresh: roots[s.sentence_number] || ''
      }))
    };

    const { error } = await supabase
      .from('student_answers')
      .upsert({
        submission_id: submissionId,
        sentence_id: sentenceId,
        question_type: 'common_binyan_and_roots',
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
      <h3 className="text-lg font-semibold">{questionData.instruction}</h3>

      <div className="space-y-3">
        {questionData.sentences.map((sentence: any) => (
          <Card key={sentence.sentence_number}>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-2">({sentence.sentence_number})</div>
              <p className="text-lg">{highlightWord(sentence.text, sentence.highlighted_word)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {questionData.sub_questions?.part_a && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-semibold">
              {typeof questionData.sub_questions.part_a === 'string' 
                ? questionData.sub_questions.part_a 
                : questionData.sub_questions.part_a.text}
            </Label>
            <Input
              value={commonBinyan}
              onChange={(e) => setCommonBinyan(e.target.value)}
              placeholder="למשל: התפעל"
              className="mt-2"
            />
          </CardContent>
        </Card>
      )}

      {questionData.sub_questions?.part_b && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label className="text-base font-semibold">
              {typeof questionData.sub_questions.part_b === 'string' 
                ? questionData.sub_questions.part_b 
                : questionData.sub_questions.part_b.text}
            </Label>
            
            {questionData.sentences.map((sentence: any, index: number) => (
              <div key={sentence.sentence_number}>
                <Label className="text-sm">שורש של המשפט ה{['ראשון', 'שני', 'שלישי'][index]}</Label>
                <Input
                  value={roots[sentence.sentence_number] || ''}
                  onChange={(e) => setRoots({
                    ...roots,
                    [sentence.sentence_number]: e.target.value
                  })}
                  placeholder="למשל: ז.ק.נ"
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={handleSave}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'שומר...' : 'שמור והמשך'}
      </Button>
    </div>
  );
}
