import CompareVerbPairs from './questions/CompareVerbPairs';
import MultiStageAnalysis from './questions/MultiStageAnalysis';
import CommonBinyanAndRoots from './questions/CommonBinyanAndRoots';
import CompareGrammaticalComponents from './questions/CompareGrammaticalComponents';

interface AdvancedQuestionProps {
  questionData: any;
  submissionId: string;
  sentenceId: string;
  onComplete: () => void;
}

export default function AdvancedQuestion({ 
  questionData, 
  submissionId, 
  sentenceId,
  onComplete 
}: AdvancedQuestionProps) {
  const questionType = questionData.question_type;

  // בחירת הרכיב המתאים לפי סוג השאלה
  switch (questionType) {
    case 'compare_verb_pairs':
      return (
        <CompareVerbPairs
          questionData={questionData}
          submissionId={submissionId}
          sentenceId={sentenceId}
          onComplete={onComplete}
        />
      );
    
    case 'multi_stage_analysis':
      return (
        <MultiStageAnalysis
          questionData={questionData}
          submissionId={submissionId}
          sentenceId={sentenceId}
          onComplete={onComplete}
        />
      );
    
    case 'common_binyan_and_roots':
      return (
        <CommonBinyanAndRoots
          questionData={questionData}
          submissionId={submissionId}
          sentenceId={sentenceId}
          onComplete={onComplete}
        />
      );
    
    case 'compare_grammatical_components':
      return (
        <CompareGrammaticalComponents
          questionData={questionData}
          submissionId={submissionId}
          sentenceId={sentenceId}
          onComplete={onComplete}
        />
      );
    
    default:
      return <div className="text-destructive">סוג שאלה לא נתמך: {questionType}</div>;
  }
}
