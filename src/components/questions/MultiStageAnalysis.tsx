import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MultiStageAnalysisProps {
  questionData: any;
  submissionId: string;
  sentenceId: string;
  onComplete: () => void;
}

export default function MultiStageAnalysis({ 
  questionData, 
  submissionId, 
  sentenceId,
  onComplete 
}: MultiStageAnalysisProps) {
  const [currentTab, setCurrentTab] = useState('part_a');
  const [selectedVerbs, setSelectedVerbs] = useState<Array<{ sentence: number; word: string }>>([]);
  const [selectedInfinitives, setSelectedInfinitives] = useState<Array<{ sentence: number; word: string }>>([]);
  const [analyses, setAnalyses] = useState<Record<string, { shoresh: string; binyan: string; form: string }>>({});
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
        part_a?: { selected_verbs?: Array<{ sentence: number; word: string }> };
        part_b?: { selected_infinitives?: Array<{ sentence: number; word: string }> };
        part_c?: { analyses?: Record<string, { shoresh: string; binyan: string; form: string }> };
      };
      
      if (answerData.part_a?.selected_verbs) {
        setSelectedVerbs(answerData.part_a.selected_verbs);
      }
      if (answerData.part_b?.selected_infinitives) {
        setSelectedInfinitives(answerData.part_b.selected_infinitives);
      }
      if (answerData.part_c?.analyses) {
        setAnalyses(answerData.part_c.analyses);
      }
    }
  };

  const toggleVerb = (sentence: number, word: string) => {
    const exists = selectedVerbs.some(v => v.sentence === sentence && v.word === word);
    if (exists) {
      setSelectedVerbs(selectedVerbs.filter(v => !(v.sentence === sentence && v.word === word)));
    } else {
      if (selectedVerbs.length < 3) {
        setSelectedVerbs([...selectedVerbs, { sentence, word }]);
      } else {
        toast.error('ניתן לבחור עד 3 פעלים');
      }
    }
  };

  const toggleInfinitive = (sentence: number, word: string) => {
    const exists = selectedInfinitives.some(v => v.sentence === sentence && v.word === word);
    if (exists) {
      setSelectedInfinitives(selectedInfinitives.filter(v => !(v.sentence === sentence && v.word === word)));
    } else {
      if (selectedInfinitives.length < 2) {
        setSelectedInfinitives([...selectedInfinitives, { sentence, word }]);
      } else {
        toast.error('ניתן לבחור עד 2 שמות פועל');
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    const answerData = {
      part_a: { selected_verbs: selectedVerbs },
      part_b: { selected_infinitives: selectedInfinitives },
      part_c: { analyses }
    };

    const { error } = await supabase
      .from('student_answers')
      .upsert({
        submission_id: submissionId,
        sentence_id: sentenceId,
        question_type: 'multi_stage_analysis',
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

  const isVerbSelected = (sentence: number, word: string) => {
    return selectedVerbs.some(v => v.sentence === sentence && v.word === word);
  };

  const isInfinitiveSelected = (sentence: number, word: string) => {
    return selectedInfinitives.some(v => v.sentence === sentence && v.word === word);
  };

  const getRemainingVerbs = () => {
    return questionData.sentences.filter((s: any) => 
      !selectedVerbs.some(v => v.sentence === s.sentence_number && v.word === s.highlighted_word) &&
      !selectedInfinitives.some(v => v.sentence === s.sentence_number && v.word === s.highlighted_word)
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{questionData.instruction}</h3>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="part_a">חלק א - בחירת פעלים</TabsTrigger>
          <TabsTrigger value="part_b">חלק ב - שמות פועל</TabsTrigger>
          <TabsTrigger value="part_c">חלק ג - ניתוח</TabsTrigger>
        </TabsList>

        <TabsContent value="part_a" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {typeof questionData.sub_questions?.part_a === 'string' 
              ? questionData.sub_questions.part_a 
              : (questionData.sub_questions?.part_a?.text || 'בחרו 3 פעלים מהמשפטים הבאים')}
            <span className="font-semibold mr-2">({selectedVerbs.length}/3)</span>
          </p>
          
          <div className="space-y-3">
            {questionData.sentences.map((sentence: any) => (
              <Card key={sentence.sentence_number}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isVerbSelected(sentence.sentence_number, sentence.highlighted_word)}
                      onCheckedChange={() => toggleVerb(sentence.sentence_number, sentence.highlighted_word)}
                      disabled={selectedVerbs.length >= 3 && !isVerbSelected(sentence.sentence_number, sentence.highlighted_word)}
                    />
                    <div className="flex-1">
                      <p className="text-lg">{sentence.text}</p>
                      <p className="text-sm text-primary font-semibold mt-1">
                        מילה מודגשת: {sentence.highlighted_word}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="part_b" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {typeof questionData.sub_questions?.part_b === 'string' 
              ? questionData.sub_questions.part_b 
              : (questionData.sub_questions?.part_b?.text || 'בחרו 2 שמות פועל מהמשפטים הבאים')}
            <span className="font-semibold mr-2">({selectedInfinitives.length}/2)</span>
          </p>
          
          <div className="space-y-3">
            {questionData.sentences.map((sentence: any) => (
              <Card key={sentence.sentence_number}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isInfinitiveSelected(sentence.sentence_number, sentence.highlighted_word)}
                      onCheckedChange={() => toggleInfinitive(sentence.sentence_number, sentence.highlighted_word)}
                      disabled={selectedInfinitives.length >= 2 && !isInfinitiveSelected(sentence.sentence_number, sentence.highlighted_word)}
                    />
                    <div className="flex-1">
                      <p className="text-lg">{sentence.text}</p>
                      <p className="text-sm text-primary font-semibold mt-1">
                        מילה מודגשת: {sentence.highlighted_word}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="part_c" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {typeof questionData.sub_questions?.part_c === 'string' 
              ? questionData.sub_questions.part_c 
              : (questionData.sub_questions?.part_c?.text || 'נתחו את הפעלים הנותרים')}
          </p>
          
          <div className="space-y-4">
            {getRemainingVerbs().map((sentence: any) => {
              const key = `${sentence.sentence_number}_${sentence.highlighted_word}`;
              const analysis = analyses[key] || { shoresh: '', binyan: '', form: '' };
              
              return (
                <Card key={key}>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-lg font-semibold">{sentence.highlighted_word}</p>
                    <p className="text-sm text-muted-foreground">{sentence.text}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>שורש</Label>
                        <Input
                          value={analysis.shoresh}
                          onChange={(e) => setAnalyses({
                            ...analyses,
                            [key]: { ...analysis, shoresh: e.target.value }
                          })}
                          placeholder="למשל: כ.ת.ב"
                        />
                      </div>
                      <div>
                        <Label>בניין</Label>
                        <Input
                          value={analysis.binyan}
                          onChange={(e) => setAnalyses({
                            ...analyses,
                            [key]: { ...analysis, binyan: e.target.value }
                          })}
                          placeholder="למשל: פעל"
                        />
                      </div>
                      <div>
                        <Label>צורה</Label>
                        <Input
                          value={analysis.form}
                          onChange={(e) => setAnalyses({
                            ...analyses,
                            [key]: { ...analysis, form: e.target.value }
                          })}
                          placeholder="למשל: בינוני הווה"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

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
