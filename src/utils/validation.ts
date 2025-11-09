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

// אימות בניין
export function validateBinyan(userInput: string, correctBinyan: string): boolean {
  const normalized = normalizeHebrew(userInput);
  
  const binyanimMap: Record<string, string[]> = {
    'פעל': ['פעל', 'קל', 'פעלקל', 'קלפעל'],
    'נפעל': ['נפעל', 'ניפעל'],
    'פיעל': ['פיעל'],
    'פועל': ['פועל'],
    'הפעיל': ['הפעיל', 'היפעיל'],
    'הופעל': ['הופעל'],
    'התפעל': ['התפעל', 'היתפעל']
  };
  
  const correctNormalized = normalizeHebrew(correctBinyan);
  const acceptedVariants = binyanimMap[correctBinyan] || [correctBinyan];
  
  return acceptedVariants.some(variant => 
    normalizeHebrew(variant) === normalized
  );
}

// אימות זמן
export function validateZman(userInput: string, correctZman: string): boolean {
  const normalized = normalizeHebrew(userInput);
  
  const zmanMap: Record<string, string[]> = {
    'עבר': ['עבר'],
    'הווה': ['הווה', 'בינוני'],
    'עתיד': ['עתיד'],
    'ציווי': ['ציווי'],
    'שםפועל': ['שםפועל', 'שם פועל']
  };
  
  const correctNormalized = normalizeHebrew(correctZman);
  const acceptedVariants = zmanMap[correctZman] || [correctZman];
  
  return acceptedVariants.some(variant => 
    normalizeHebrew(variant) === normalized
  );
}

// אימות גוף
export function validateGuf(userInput: string, correctGuf: string | null): boolean {
  // אם אין גוף נכון (שם פועל), תמיד נכון
  if (!correctGuf) return true;
  
  const normalized = normalizeHebrew(userInput);
  const correctNormalized = normalizeHebrew(correctGuf);
  
  return normalized === correctNormalized;
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
