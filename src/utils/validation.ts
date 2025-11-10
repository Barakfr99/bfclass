// פונקציה מרכזית לנרמול טקסט עברי
export function normalizeHebrew(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[\u0591-\u05C7]/g, '')  // הסרת ניקוד
    .replace(/[.\-\s"'״׳]/g, '')      // הסרת סימנים
    .replace(/ך/g, 'כ')               // אותיות סופיות
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ')
    .trim()
    .toLowerCase();
}

// אימות שורש
export function validateShoresh(userInput: string, correctShoresh: string): boolean {
  const normalized = normalizeHebrew(userInput);
  const correctNormalized = normalizeHebrew(correctShoresh);
  
  return normalized === correctNormalized;
}

// אימות בניין - משתמש בקונפיגורציה המרכזית
export function validateBinyan(userInput: string, correctBinyan: string): boolean {
  const normalized = normalizeHebrew(userInput);
  const { getBinyanVariants } = require('@/config/grammarConfig');
  const acceptedVariants = getBinyanVariants(correctBinyan);
  
  return acceptedVariants.some((variant: string) => 
    normalizeHebrew(variant) === normalized
  );
}

// אימות זמן - משתמש בקונפיגורציה המרכזית
export function validateZman(userInput: string, correctZman: string): boolean {
  const normalized = normalizeHebrew(userInput);
  const { getZmanVariants } = require('@/config/grammarConfig');
  const acceptedVariants = getZmanVariants(correctZman);
  
  return acceptedVariants.some((variant: string) => 
    normalizeHebrew(variant) === normalized
  );
}

// אימות גוף - משתמש בקונפיגורציה המרכזית
export function validateGuf(userInput: string, correctGuf: string | null): boolean {
  // אם אין גוף נכון (שם פועל), תמיד נכון
  if (!correctGuf) return true;
  
  const normalized = normalizeHebrew(userInput);
  const { getGufVariants } = require('@/config/grammarConfig');
  const acceptedVariants = getGufVariants(correctGuf);
  
  return acceptedVariants.some((variant: string) => 
    normalizeHebrew(variant) === normalized
  );
}

// חישוב ציון למשפט בודד
export function calculateSentenceScore(
  shoreshCorrect: boolean,
  binyanCorrect: boolean,
  zmanCorrect: boolean,
  gufCorrect: boolean,
  hasGuf: boolean = true
): number {
  let correctCount = 0;
  if (shoreshCorrect) correctCount++;
  if (binyanCorrect) correctCount++;
  if (zmanCorrect) correctCount++;
  if (hasGuf && gufCorrect) correctCount++;
  
  // אם אין גוף - 10 נקודות / 3 שדות = 3.33 לכל שדה
  // אם יש גוף - 10 נקודות / 4 שדות = 2.5 לכל שדה
  const pointsPerField = hasGuf ? 2.5 : (10 / 3);
  return correctCount * pointsPerField;
}

// ==================== פונקציות אימות לתרגיל 6 ====================

// אימות בחירת זוג פעלים (שאלה 1)
export function validateVerbPairSelection(
  selectedPair: number,
  correctPair: number
): { correct: boolean; score: number } {
  const correct = selectedPair === correctPair;
  return {
    correct,
    score: correct ? 10 : 0
  };
}

// אימות בחירת פעלים (שאלה 2 חלק א)
export function validateVerbSelection(
  selectedVerbs: Array<{ sentence: number; word: string }>,
  correctVerbs: Array<{ sentence_number: number; word: string }>
): { correct: boolean; score: number; details: any } {
  const normalizedSelected = selectedVerbs.map(v => ({
    sentence: v.sentence,
    word: normalizeHebrew(v.word)
  }));

  const normalizedCorrect = correctVerbs.map(v => ({
    sentence: v.sentence_number,
    word: normalizeHebrew(v.word)
  }));

  let correctCount = 0;
  normalizedSelected.forEach(selected => {
    if (normalizedCorrect.some(correct => 
      correct.sentence === selected.sentence && 
      correct.word === selected.word
    )) {
      correctCount++;
    }
  });

  return {
    correct: correctCount === correctVerbs.length,
    score: (correctCount / correctVerbs.length) * 10,
    details: {
      total: correctVerbs.length,
      correct: correctCount,
      percentage: (correctCount / correctVerbs.length) * 100
    }
  };
}

// אימות בחירת שמות פועל (שאלה 2 חלק ב)
export function validateInfinitiveSelection(
  selectedInfinitives: Array<{ sentence: number; word: string }>,
  correctInfinitives: Array<{ sentence_number: number; word: string }>
): { correct: boolean; score: number; details: any } {
  return validateVerbSelection(selectedInfinitives as any, correctInfinitives);
}

// אימות ניתוח פעלים (שאלה 2 חלק ג)
export function validateVerbAnalysis(
  userAnalyses: Record<string, { shoresh: string; binyan: string; form: string }>,
  correctAnalyses: Record<string, { shoresh: string; binyan: string; form: string }>
): { correct: boolean; score: number; details: any } {
  const keys = Object.keys(correctAnalyses);
  if (keys.length === 0) return { correct: true, score: 10, details: {} };

  let totalFields = keys.length * 3; // 3 שדות לכל פועל
  let correctFields = 0;

  keys.forEach(key => {
    const userAnalysis = userAnalyses[key] || { shoresh: '', binyan: '', form: '' };
    const correctAnalysis = correctAnalyses[key];

    if (validateShoresh(userAnalysis.shoresh, correctAnalysis.shoresh)) correctFields++;
    if (validateBinyan(userAnalysis.binyan, correctAnalysis.binyan)) correctFields++;
    if (normalizeHebrew(userAnalysis.form) === normalizeHebrew(correctAnalysis.form)) correctFields++;
  });

  return {
    correct: correctFields === totalFields,
    score: (correctFields / totalFields) * 10,
    details: {
      totalFields,
      correctFields,
      percentage: (correctFields / totalFields) * 100
    }
  };
}

// אימות בניין משותף ושורשים (שאלה 3)
export function validateCommonBinyanAndRoots(
  userBinyan: string,
  correctBinyan: string,
  userRoots: Array<{ sentence: number; shoresh: string }>,
  correctRoots: Array<{ sentence_number: number; shoresh: string }>
): { correct: boolean; score: number; partialScores: any } {
  const binyanCorrect = validateBinyan(userBinyan, correctBinyan);
  
  let rootsCorrect = 0;
  correctRoots.forEach(correctRoot => {
    const userRoot = userRoots.find(r => r.sentence === correctRoot.sentence_number);
    if (userRoot && validateShoresh(userRoot.shoresh, correctRoot.shoresh)) {
      rootsCorrect++;
    }
  });

  const binyanScore = binyanCorrect ? 5 : 0;
  const rootsScore = (rootsCorrect / correctRoots.length) * 5;
  const totalScore = binyanScore + rootsScore;

  return {
    correct: binyanCorrect && rootsCorrect === correctRoots.length,
    score: totalScore,
    partialScores: {
      binyan: binyanScore,
      roots: rootsScore
    }
  };
}

// אימות השוואת רכיבים דקדוקיים (שאלה 4)
export function validateComponentComparison(
  selectedComponents: string[],
  correctComponents: string[]
): { correct: boolean; score: number; details: any } {
  const normalizedSelected = selectedComponents.map(c => normalizeHebrew(c));
  const normalizedCorrect = correctComponents.map(c => normalizeHebrew(c));

  let correctCount = 0;
  normalizedCorrect.forEach(correct => {
    if (normalizedSelected.includes(correct)) {
      correctCount++;
    }
  });

  const totalComponents = 4; // שורש, בניין, זמן, גוף
  const score = (correctCount / correctComponents.length) * 10;

  return {
    correct: correctCount === correctComponents.length,
    score,
    details: {
      selected: selectedComponents,
      correct: correctComponents,
      matches: correctCount,
      totalComponents
    }
  };
}

// פונקציה מרכזית לאימות שאלות מורכבות
export function validateAdvancedQuestion(
  questionData: any,
  answerData: any
): { correct: boolean; score: number; partial_scores?: any } {
  const questionType = questionData.question_type;

  switch (questionType) {
    case 'compare_verb_pairs':
      return validateVerbPairSelection(
        answerData.selected_pair,
        questionData.correct_answer
      );

    case 'multi_stage_analysis': {
      const partA = validateVerbSelection(
        answerData.part_a?.selected_verbs || [],
        questionData.correct_answers?.part_a || []
      );
      const partB = validateInfinitiveSelection(
        answerData.part_b?.selected_infinitives || [],
        questionData.correct_answers?.part_b || []
      );
      const partC = validateVerbAnalysis(
        answerData.part_c?.analyses || {},
        questionData.correct_answers?.part_c || {}
      );

      const totalScore = (partA.score + partB.score + partC.score) / 3;

      return {
        correct: partA.correct && partB.correct && partC.correct,
        score: totalScore,
        partial_scores: {
          part_a: partA.score,
          part_b: partB.score,
          part_c: partC.score
        }
      };
    }

    case 'common_binyan_and_roots': {
      return validateCommonBinyanAndRoots(
        answerData.common_binyan,
        questionData.correct_answers?.common_binyan || '',
        answerData.roots || [],
        questionData.correct_answers?.roots || []
      );
    }

    case 'compare_grammatical_components': {
      return validateComponentComparison(
        answerData.selected_components || [],
        questionData.correct_answers?.components || []
      );
    }

    default:
      return { correct: false, score: 0 };
  }
}
