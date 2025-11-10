# מערכת תרגילי דקדוק עברי - תיעוד מפורט

## 1. סקירה כללית של המערכת

מערכת לימוד דקדוק עברי המאפשרת למורים ליצור תרגילים ולתלמידים לפתור אותם.

### משתמשים:
- **מורים**: יוצרים תרגילים, עוקבים אחר התקדמות, בודקים הגשות, מחזירים לתיקון
- **תלמידים**: פותרים תרגילים, מקבלים ציונים ומשוב, מתקנים לאחר משוב

### תהליך עבודה:
1. מורה יוצר תרגיל עם משפטים ומילים מודגשות
2. תלמיד נכנס למערכת ומתחיל לפתור
3. התלמיד עובר על כל משפט ומזהה: שורש, בניין, זמן, גוף
4. המערכת בודקת אוטומטית ומציגה ציון
5. מורה רואה את ההגשה, יכול להוסיף משוב ולהחזיר לתיקון
6. תלמיד מקבל התראה ויכול לתקן

### סוגי שאלות:
- **שאלות בסיסיות**: זיהוי שורש, בניין, זמן, גוף למילה מודגשת במשפט
- **שאלות מורכבות** (Exercise 6+):
  - **Compare Grammatical Components**: השוואת מרכיבים דקדוקיים משותפים בין מילים
  - **Common Binyan and Roots**: זיהוי בניין משותף ושורשים שונים
  - **Multi-Stage Analysis**: ניתוח רב-שלבי של פעלים
  - **Compare Verb Pairs**: השוואת זוגות פעלים

---

## 2. סכימת מסד הנתונים

### טבלה: `students`
מידע על תלמידים ומורים.

**עמודות:**
- `id` (uuid, PK): מזהה ייחודי
- `student_id` (text, unique): מספר תעודת זהות/מספר תלמיד
- `student_name` (text): שם התלמיד
- `is_teacher` (boolean): האם המשתמש הוא מורה
- `created_at` (timestamp): תאריך יצירה

### טבלה: `assignments`
תרגילים שנוצרו על ידי מורים.

**עמודות:**
- `id` (uuid, PK): מזהה ייחודי
- `title` (text): כותרת התרגיל
- `description` (text): תיאור
- `assignment_type` (text): סוג התרגיל (exercise_1, exercise_6, וכו')
- `instructions_text` (text): הוראות לתלמיד
- `total_sentences` (integer): מספר משפטים בתרגיל
- `is_published` (boolean): האם התרגיל פורסם
- `due_date` (timestamp): תאריך הגשה
- `created_at` (timestamp): תאריך יצירה

### טבלה: `assignment_sentences`
משפטים בתוך תרגיל, כל אחד עם מילה מודגשת לניתוח.

**עמודות:**
- `id` (uuid, PK): מזהה ייחודי
- `assignment_id` (uuid, FK → assignments): מזהה התרגיל
- `sentence_number` (integer): מספר המשפט בסדר
- `full_sentence` (text): המשפט המלא
- `analyzed_word` (text): המילה המודגשת לניתוח
- `word_position` (integer): מיקום המילה במשפט
- `correct_shoresh` (text): התשובה הנכונה - שורש
- `correct_binyan` (text, nullable): התשובה הנכונה - בניין
- `correct_zman` (text): התשובה הנכונה - זמן
- `correct_guf` (text, nullable): התשובה הנכונה - גוף
- `is_practice` (boolean): האם זהו משפט תרגול
- `question_data` (jsonb, nullable): נתונים נוספים לשאלות מורכבות
- `created_at` (timestamp): תאריך יצירה

**הערה חשובה:** 
- `correct_binyan` ו-`correct_guf` יכולים להיות NULL כאשר הם לא רלוונטיים לשאלה
- `question_data` משמש לשאלות מורכבות וכולל מבנים כמו:
  - `sub_questions` עם `part_a`, `part_b`, `part_c`
  - `sentences` - מערך משפטים למקרים מיוחדים
  - `verb_pairs` - זוגות פעלים להשוואה

### טבלה: `submissions`
הגשות של תלמידים לתרגילים.

**עמודות:**
- `id` (uuid, PK): מזהה ייחודי
- `assignment_id` (uuid, FK → assignments): מזהה התרגיל
- `student_id` (text): מספר תלמיד
- `status` (text): סטטוס ההגשה
  - `not_started`: לא התחיל
  - `in_progress`: בתהליך
  - `submitted`: הוגש
  - `graded`: נבדק
  - `returned_for_revision`: הוחזר לתיקון
- `total_score` (numeric, nullable): ציון כולל
- `submission_count` (integer): מספר פעמים שהוגש
- `created_at` (timestamp): תאריך יצירה
- `submitted_at` (timestamp, nullable): תאריך הגשה
- `last_submitted_at` (timestamp, nullable): תאריך הגשה אחרון
- `reviewed_at` (timestamp, nullable): תאריך בדיקה
- `teacher_feedback` (text, nullable): משוב מהמורה

### טבלה: `student_answers`
תשובות של תלמידים לכל משפט/שאלה.

**עמודות:**
- `id` (uuid, PK): מזהה ייחודי
- `submission_id` (uuid, FK → submissions): מזהה ההגשה
- `sentence_id` (uuid, FK → assignment_sentences): מזהה המשפט
- `question_type` (text, nullable): סוג השאלה
- `student_shoresh` (text, nullable): תשובת התלמיד - שורש
- `student_binyan` (text, nullable): תשובת התלמיד - בניין
- `student_zman` (text, nullable): תשובת התלמיד - זמן
- `student_guf` (text, nullable): תשובת התלמיד - גוף
- `shoresh_correct` (boolean, nullable): האם שורש נכון
- `binyan_correct` (boolean, nullable): האם בניין נכון
- `zman_correct` (boolean, nullable): האם זמן נכון
- `guf_correct` (boolean, nullable): האם גוף נכון
- `is_correct` (boolean, nullable): האם התשובה נכונה
- `points_earned` (numeric, nullable): נקודות שהתלמיד הרוויח
- `answer_data` (jsonb, nullable): נתונים נוספים לשאלות מורכבות
- `partial_scores` (jsonb, nullable): ציונים חלקיים לכל חלק בשאלה
- `created_at` (timestamp): תאריך יצירה
- `updated_at` (timestamp): תאריך עדכון

**הערה חשובה:**
- לשאלות מורכבות, `answer_data` מכיל את התשובות המלאות
- `partial_scores` מכיל פירוט של ציון לכל חלק (part_a, part_b, וכו')

### טבלה: `student_notes`
הערות שמורה יכול להוסיף על תלמיד.

**עמודות:**
- `id` (uuid, PK): מזהה ייחודי
- `student_id` (text): מספר תלמיד
- `note_text` (text, nullable): תוכן ההערה
- `tags` (text[], nullable): תגיות (למשל: "צריך שיפור", "מצוין")
- `created_at` (timestamp): תאריך יצירה
- `updated_at` (timestamp): תאריך עדכון אחרון

---

## 3. תצורת הדקדוק (grammarConfig.ts)

קובץ מרכזי המגדיר את כל כללי הדקדוק העברי במערכת.

### מבנה:
```typescript
GRAMMAR_CONFIG = {
  shoresh: { ... },
  binyan: { 
    displayName: "בניין",
    options: [
      { value: "פעל", label: "פעל", variants: ["פעל", "קל"] },
      { value: "נפעל", label: "נפעל", variants: [...] },
      // ... כל הבניינים
    ]
  },
  zman: {
    displayName: "זמן",
    options: [
      { value: "עבר", label: "עבר", variants: [...] },
      { value: "הווה", label: "הווה", variants: [...] },
      { value: "עתיד", label: "עתיד", variants: [...] },
      { value: "ציווי", label: "ציווי", variants: [...] },
      { value: "שם הפועל", label: "שם הפועל", variants: [...] }
    ]
  },
  guf: {
    displayName: "גוף",
    groups: {
      singular: [
        { value: "אני", label: "אני" },
        { value: "אתה", label: "אתה" },
        // ...
      ],
      plural: [ ... ],
      participles: [ ... ]
    }
  }
}
```

### פונקציות עזר:
- `getBinyanOptions()`: מחזיר רשימת כל הבניינים
- `getZmanOptions()`: מחזיר רשימת כל הזמנים
- `getGufOptions()`: מחזיר רשימת כל הגופים
- `getBinyanVariants(binyan)`: מחזיר וריאנטים מקובלים לבניין
- `getZmanVariants(zman)`: מחזיר וריאנטים מקובלים לזמן
- `getGufVariants(guf)`: מחזיר וריאנטים מקובלים לגוף

### אפשרויות זמינות:

**בניינים:**
- פעל (קל)
- נפעל
- פיעל
- פועל
- התפעל
- הפעיל
- הופעל

**זמנים:**
- עבר
- הווה (בינוני)
- עתיד
- ציווי
- שם הפועל (שם פועל / אינפיניטיב)

**גופים:**
- יחיד: אני, אתה, את, הוא, היא
- רבים: אנחנו, אתם, אתן, הם, הן
- שמות פועל: בינוני יחיד זכר, בינוני יחיד נקבה, בינוני רבים זכר, בינוני רבים נקבה

---

## 4. עמודים מרכזיים

### עמודי מורה:
- `/teacher-dashboard` - דשבורד מורה עם רשימת תרגילים וסטטיסטיקות
- `/teacher/assignment/:id` - צפייה בהגשות של תרגיל מסוים
- `/assignment/:assignmentId/review/:submissionId` - בדיקת הגשה מפורטת

### עמודי תלמיד:
- `/` - עמוד התחברות (Login)
- `/student-dashboard` - דשבורד תלמיד עם רשימת תרגילים
- `/assignment/:assignmentId/instructions` - הוראות לפני התחלת תרגיל
- `/assignment/:assignmentId/sentence/:sentenceNumber` - פתרון משפט בודד
- `/assignment/:assignmentId/results` - תוצאות לאחר הגשה

---

## 5. מבנה העץ של הפרויקט

```
hebrew-grammar-system/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/              # קומפוננטות React
│   │   ├── ui/                 # קומפוננטות UI מ-shadcn/ui
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── use-toast.ts
│   │   │
│   │   ├── questions/          # קומפוננטות לשאלות מורכבות
│   │   │   ├── CompareGrammaticalComponents.tsx  # השוואת מרכיבים דקדוקיים
│   │   │   ├── CompareVerbPairs.tsx             # השוואת זוגות פעלים
│   │   │   ├── CommonBinyanAndRoots.tsx         # בניין משותף ושורשים
│   │   │   └── MultiStageAnalysis.tsx           # ניתוח רב-שלבי
│   │   │
│   │   ├── AdvancedQuestion.tsx              # קומפוננטה כללית לשאלות מורכבות
│   │   ├── AssignmentPreviewDialog.tsx       # דיאלוג תצוגה מקדימה של תרגיל
│   │   ├── NavLink.tsx                       # קישור ניווט מותאם
│   │   ├── ResetAssignmentDialog.tsx         # דיאלוג איפוס תרגיל
│   │   ├── ReturnForRevisionDialog.tsx       # דיאלוג החזרה לתיקון
│   │   ├── StudentNotesDialog.tsx            # דיאלוג הערות על תלמיד
│   │   └── StudentProgressDialog.tsx         # דיאלוג התקדמות תלמיד
│   │
│   ├── config/
│   │   └── grammarConfig.ts    # תצורת כללי דקדוק עברי
│   │
│   ├── contexts/
│   │   └── StudentContext.tsx  # Context לניהול מצב התלמיד/מורה
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx      # Hook לזיהוי מובייל
│   │   └── use-toast.ts        # Hook להודעות Toast
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # קליינט Supabase (נוצר אוטומטית)
│   │       └── types.ts        # טיפוסי TypeScript (נוצר אוטומטית)
│   │
│   ├── lib/
│   │   └── utils.ts            # פונקציות עזר כלליות
│   │
│   ├── pages/                   # עמודים ראשיים
│   │   ├── AssignmentInstructions.tsx    # הוראות תרגיל לתלמיד
│   │   ├── AssignmentResults.tsx         # תוצאות תרגיל
│   │   ├── AssignmentReview.tsx          # בדיקת הגשה (מורה)
│   │   ├── AssignmentSentence.tsx        # פתרון משפט בודד
│   │   ├── Login.tsx                     # עמוד התחברות
│   │   ├── NotFound.tsx                  # עמוד 404
│   │   ├── StudentDashboard.tsx          # דשבורד תלמיד
│   │   ├── TeacherAssignmentDetails.tsx  # פרטי תרגיל (מורה)
│   │   └── TeacherDashboard.tsx          # דשבורד מורה
│   │
│   ├── utils/
│   │   └── validation.ts       # פונקציות וולידציה לתשובות
│   │
│   ├── App.css                 # סגנונות כלליים
│   ├── App.tsx                 # קומפוננטת App ראשית עם Routing
│   ├── index.css               # סגנונות גלובליים ו-Design System
│   ├── main.tsx                # נקודת כניסה ראשית
│   └── vite-env.d.ts          # הגדרות TypeScript ל-Vite
│
├── supabase/
│   ├── config.toml            # תצורת Supabase (נוצר אוטומטית)
│   └── migrations/            # קבצי Migration למסד הנתונים
│
├── .env                       # משתני סביבה (נוצר אוטומטית)
├── .gitignore
├── components.json            # תצורת shadcn/ui
├── eslint.config.js          # תצורת ESLint
├── index.html                # קובץ HTML ראשי
├── package.json              # תלויות NPM
├── package-lock.json
├── postcss.config.js         # תצורת PostCSS
├── PROJECT_OVERVIEW.md       # המסמך הזה
├── README.md                 # הוראות פרויקט בסיסיות
├── tailwind.config.ts        # תצורת Tailwind CSS
├── tsconfig.json             # תצורת TypeScript
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts            # תצורת Vite
```

### הסבר תיקיות מרכזיות:

#### `/src/components/`
- **ui/**: קומפוננטות UI בסיסיות מספריית shadcn/ui - כפתורים, כרטיסים, דיאלוגים וכו'
- **questions/**: קומפוננטות ייעודיות לסוגי שאלות מורכבות (Exercise 6+)
- קומפוננטות כלליות: דיאלוגים לניהול, תצוגה מקדימה, והערות

#### `/src/pages/`
כל העמודים הראשיים של האפליקציה מחולקים לפי תפקיד:
- עמודי תלמיד: Login, StudentDashboard, AssignmentInstructions, AssignmentSentence, AssignmentResults
- עמודי מורה: TeacherDashboard, TeacherAssignmentDetails, AssignmentReview

#### `/src/config/`
קובץ `grammarConfig.ts` - מקור האמת היחיד לכל כללי הדקדוק העברי במערכת

#### `/src/contexts/`
Context API של React לניהול מצב גלובלי (מידע על המשתמש המחובר)

#### `/src/utils/`
פונקציות עזר לוולידציה של תשובות עם תמיכה בוריאנטים דקדוקיים

#### `/src/integrations/supabase/`
קבצים שנוצרים אוטומטית על ידי Supabase:
- `client.ts` - חיבור למסד הנתונים
- `types.ts` - טיפוסי TypeScript מהסכימה

#### `/supabase/migrations/`
קבצי SQL למיגרציות מסד הנתונים (יצירת טבלאות, עדכונים, RLS policies)

---

## 6. טכנולוגיות

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL database, authentication)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Form Validation**: React Hook Form + Zod
- **Notifications**: Sonner (toast notifications)

---

## 7. בעיות שנפתרו לאחרונה

### שלב 1 - תיקון באגים קריטיים:

1. **תרגיל 6 - שאלות מורכבות**
   - תוקן הטיפול ב-`question_data` לשאלות מורכבות
   - הוספו קומפוננטות ייעודיות: `CompareVerbPairs`, `MultiStageAnalysis`, `CommonBinyanAndRoots`, `CompareGrammaticalComponents`

2. **חישוב משפטים שהושלמו**
   - תוקנה לוגיקת חישוב `completedSentences` ב-`TeacherAssignmentDetails.tsx`
   - כעת נלקח בחשבון `answer_data` לשאלות מורכבות
   - נבדקים רק `binyan` ו-`guf` כאשר הם קיימים ולא null

3. **תצוגת תוצאות**
   - תוקנה תצוגת `binyan` ו-`guf` ב-`AssignmentResults.tsx`
   - מרכיבים מוצגים רק אם הם קיימים ולא ריקים
   - חישוב ציון נכון עבור שדות אופציונליים

4. **חוויית תיקון לתלמיד**
   - נוספה התראה בולטת (Card אדום/כתום) ב-`StudentDashboard.tsx`
   - כפתור "תקן עכשיו" לניווט מהיר לתרגיל

5. **תיקון רינדור ב-CompareVerbPairs**
   - תוקן שגיאת React: "Objects are not valid as a React child"
   - שונה מ-`pair.verb1` ל-`pair.verb2.text` כדי להציג טקסט במקום אובייקט

### שלב 2 - תכונות נוספות:

6. **מערכת הערות ותגיות למורה**
   - נוספה טבלת `student_notes` במסד הנתונים
   - קומפוננטה `StudentNotesDialog` לניהול הערות ותגיות
   - אינטגרציה בדשבורד המורה ובעמוד פרטי ההגשה

7. **משוב אופציונלי בהחזרה לתיקון**
   - שדה משוב הפך אופציונלי ב-`ReturnForRevisionDialog`
   - המורה יכול להחזיר לתיקון ללא משוב או עם משוב

---

## 8. נקודות לשיפור והמשך פיתוח

### אבטחה:
- יצירת מדיניות RLS נכונה שתלמידים יוכלו לראות רק את ההגשות שלהם
- מניעת אפשרות למורים לערוך תשובות ישירות
- הגבלת גישה לטבלת `student_notes` רק למורים

### סטטיסטיקות:
- גרפים של התפלגות ציונים
- זיהוי טעויות נפוצות
- דוח מפורט לכל תלמיד עם מגמות התקדמות

### משוב מתקדם:
- אפשרות להוסיף הערה לכל תשובה בודדת
- הצגת הערות ספציפיות לתלמיד בעמוד התוצאות

### ייצוא נתונים:
- Edge Function לייצוא תוצאות לאקסל
- יצירת PDF דוחות
- אפשרות הדפסה

---

## 9. הערות חשובות למפתחים

### עבודה עם שאלות מורכבות:
- לכל סוג שאלה מורכבת יש קומפוננטה ייעודית ב-`src/components/questions/`
- הנתונים נשמרים ב-`answer_data` כ-JSONB
- חישוב ציון נעשה בהתאם למבנה ה-`sub_questions` ב-`question_data`

### וולידציה של תשובות:
- קובץ `src/utils/validation.ts` מכיל לוגיקת השוואה עם תמיכה בוריאנטים
- פונקציות `normalizeAnswer` ו-`isAnswerCorrect` עובדות עם `grammarConfig.ts`

### זרימת נתונים:
1. מורה יוצר תרגיל → `assignments` + `assignment_sentences`
2. תלמיד מתחיל → נוצר `submission` עם status `in_progress`
3. תלמיד עונה → נשמר ב-`student_answers` עם `answer_data`
4. תלמיד מגיש → status משתנה ל-`submitted`, מחושב `total_score`
5. מורה בודק → יכול להוסיף `teacher_feedback`, `student_notes`, או להחזיר לתיקון

---

**גרסה:** 1.0  
**תאריך עדכון אחרון:** ינואר 2025

---

## איך להשתמש במסמך זה עם AI אחר?

העתק את כל תוכן המסמך הזה ושתף אותו עם מודל AI אחר בפורמט הבא:

```
לפניך תיעוד מפורט של מערכת תרגילי דקדוק עברי:

[הדבק כאן את כל התוכן מסעיף 1 עד סעיף 8]

השאלה שלי היא: [כתוב את השאלה או הבקשה שלך]
```

דוגמה:
```
לפניך תיעוד מפורט של מערכת תרגילי דקדוק עברי:

[התיעוד המלא]

השאלה שלי היא: איך אוכל להוסיף ייצוא של תוצאות לקובץ Excel?
```
