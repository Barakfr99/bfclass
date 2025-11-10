// ================== קונפיגורציה מרכזית של כללי הדקדוק ==================
// קובץ זה מהווה מקור אמת יחיד לכל כללי הדקדוק במערכת
// כל שינוי כאן ישפיע אוטומטית על כל התרגילים

export const GRAMMAR_CONFIG = {
  // ============ שורש ============
  shoresh: {
    displayName: 'שורש',
    examples: ['כתב', 'כ-ת-ב', 'כ.ת.ב', 'כת"ב'],
    helpText: 'ניתן להשתמש באות רגילה או סופית (למשל: כ או ך)',
    maxLength: 15
  },

  // ============ בניין ============
  binyan: {
    displayName: 'בניין',
    options: [
      { value: 'פעל', label: 'פעל / קל', variants: ['פעל', 'קל', 'פעלקל', 'קלפעל'] },
      { value: 'נפעל', label: 'נפעל', variants: ['נפעל', 'ניפעל'] },
      { value: 'פיעל', label: 'פיעל', variants: ['פיעל'] },
      { value: 'פועל', label: 'פועל', variants: ['פועל'] },
      { value: 'הפעיל', label: 'הפעיל', variants: ['הפעיל', 'היפעיל'] },
      { value: 'הופעל', label: 'הופעל', variants: ['הופעל'] },
      { value: 'התפעל', label: 'התפעל', variants: ['התפעל', 'היתפעל'] }
    ],
    helpText: '7 בניינים בעברית. כל פועל שייך לבניין אחד.',
    maxLength: 15
  },

  // ============ זמן ============
  zman: {
    displayName: 'זמן',
    options: [
      { value: 'עבר', label: 'עבר', variants: ['עבר'], example: 'כתב, כתבה, כתבו' },
      { value: 'הווה', label: 'הווה / בינוני', variants: ['הווה', 'בינוני'], example: 'כותב, כותבת, כותבים' },
      { value: 'עתיד', label: 'עתיד', variants: ['עתיד'], example: 'יכתוב, תכתוב, יכתבו' },
      { value: 'ציווי', label: 'ציווי', variants: ['ציווי'], example: 'כתוב, כתבי, כתבו' },
      { value: 'שם פועל', label: 'שם פועל', variants: ['שםפועל', 'שם פועל'], example: 'לכתוב' }
    ],
    helpText: 'יש 5 זמנים בעברית',
    maxLength: 15
  },

  // ============ גוף ============
  guf: {
    displayName: 'גוף',
    groups: [
      {
        name: 'גוף ראשון (מדבר)',
        options: [
          { value: 'מדבר', label: 'אני → מדבר', variants: ['מדבר'], pronoun: 'אני', gender: 'זכר' },
          { value: 'מדברת', label: 'אני → מדברת', variants: ['מדברת'], pronoun: 'אני', gender: 'נקבה' },
          { value: 'מדברים', label: 'אנחנו → מדברים', variants: ['מדברים'], pronoun: 'אנחנו', gender: 'זכר/רבים' },
          { value: 'מדברות', label: 'אנחנו → מדברות', variants: ['מדברות'], pronoun: 'אנחנו', gender: 'נקבה/רבות' }
        ]
      },
      {
        name: 'גוף שני (נוכח)',
        options: [
          { value: 'נוכח', label: 'אתה → נוכח', variants: ['נוכח'], pronoun: 'אתה', gender: 'זכר' },
          { value: 'נוכחת', label: 'את → נוכחת', variants: ['נוכחת'], pronoun: 'את', gender: 'נקבה' },
          { value: 'נוכחים', label: 'אתם → נוכחים', variants: ['נוכחים'], pronoun: 'אתם', gender: 'זכר/רבים' },
          { value: 'נוכחות', label: 'אתן → נוכחות', variants: ['נוכחות'], pronoun: 'אתן', gender: 'נקבה/רבות' }
        ]
      },
      {
        name: 'גוף שלישי (נסתר)',
        options: [
          { value: 'נסתר', label: 'הוא → נסתר', variants: ['נסתר'], pronoun: 'הוא', gender: 'זכר' },
          { value: 'נסתרת', label: 'היא → נסתרת', variants: ['נסתרת'], pronoun: 'היא', gender: 'נקבה' },
          { value: 'נסתרים', label: 'הם → נסתרים', variants: ['נסתרים'], pronoun: 'הם', gender: 'זכר/רבים' },
          { value: 'נסתרות', label: 'הן → נסתרות', variants: ['נסתרות'], pronoun: 'הן', gender: 'נקבה/רבות' }
        ]
      }
    ],
    helpText: '3 גופים: מדבר, נוכח, נסתר. לכל גוף יש 4 צורות (יחיד/יחידה, רבים/רבות)',
    maxLength: 15
  }
} as const;

// ============ פונקציות עזר ============

// מחזיר את כל האופציות של בניין כמערך שטוח
export function getBinyanOptions() {
  return GRAMMAR_CONFIG.binyan.options;
}

// מחזיר את כל האופציות של זמן כמערך שטוח
export function getZmanOptions() {
  return GRAMMAR_CONFIG.zman.options;
}

// מחזיר את כל האופציות של גוף כמערך שטוח
export function getGufOptions() {
  const allOptions: Array<{
    value: string;
    label: string;
    variants: readonly string[];
    pronoun: string;
    gender: string;
  }> = [];
  
  GRAMMAR_CONFIG.guf.groups.forEach(group => {
    group.options.forEach(opt => {
      allOptions.push(opt as any);
    });
  });
  
  return allOptions;
}

// מחזיר את הווריאנטים המקובלים לבניין מסוים
export function getBinyanVariants(binyan: string): readonly string[] {
  const option = GRAMMAR_CONFIG.binyan.options.find(opt => opt.value === binyan);
  return option?.variants || [binyan];
}

// מחזיר את הווריאנטים המקובלים לזמן מסוים
export function getZmanVariants(zman: string): readonly string[] {
  const option = GRAMMAR_CONFIG.zman.options.find(opt => opt.value === zman);
  return option?.variants || [zman];
}

// מחזיר את הווריאנטים המקובלים לגוף מסוים
export function getGufVariants(guf: string): readonly string[] {
  const allOptions = getGufOptions();
  const option = allOptions.find(opt => opt.value === guf);
  return option?.variants || [guf];
}

// ============ טייפים ============
export type BinyanValue = typeof GRAMMAR_CONFIG.binyan.options[number]['value'];
export type ZmanValue = typeof GRAMMAR_CONFIG.zman.options[number]['value'];
export type GufValue = string;
