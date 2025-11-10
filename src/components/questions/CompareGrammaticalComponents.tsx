import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { highlightWord } from '@/utils/textHighlight';

interface CompareGrammaticalComponentsProps {
  questionData: any;
  submissionId: string;
  sentenceId: string;
  onComplete: () => void;
}

const COMPONENTS = ['שורש', 'בניין', 'זמן', 'גוף'];

export default function CompareGrammaticalComponents({ 
  questionData, 
  submissionId, 
  sentenceId,
  onComplete 
}: CompareGrammaticalComponentsProps) {
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
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
      const answerData = data.answer_data as { selected_components?: string[] };
      if (answerData.selected_components && Array.isArray(answerData.selected_components)) {
        setSelectedComponents(answerData.selected_components);
      }
    }
  };

  const toggleComponent = (component: string) => {
    if (selectedComponents.includes(component)) {
      setSelectedComponents(selectedComponents.filter(c => c !== component));
    } else {
      setSelectedComponents([...selectedComponents, component]);
    }
  };

  const handleSave = async () => {
    if (selectedComponents.length === 0) {
      toast.error('יש לבחור לפחות רכיב אחד');
      return;
    }

    setIsLoading(true);

    const answerData = {
      selected_components: selectedComponents,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('student_answers')
      .upsert({
        submission_id: submissionId,
        sentence_id: sentenceId,
        question_type: 'compare_grammatical_components',
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

      <Card>
        <CardContent className="p-4 space-y-3">
          <Label className="text-base font-semibold">
            סמנו באלו חלקים דקדוקיים הפעלים דומים:
          </Label>
          
          {COMPONENTS.map((component) => (
            <div key={component} className="flex items-center gap-3">
              <Checkbox
                checked={selectedComponents.includes(component)}
                onCheckedChange={() => toggleComponent(component)}
                id={`component-${component}`}
              />
              <Label 
                htmlFor={`component-${component}`}
                className="text-lg cursor-pointer"
              >
                {component}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

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
