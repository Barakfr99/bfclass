import React from 'react';

/**
 * פונקציה להדגשת מילה בתוך טקסט
 * @param text - הטקסט המלא
 * @param wordToHighlight - המילה להדגשה
 * @returns מערך של אלמנטים React עם המילה המודגשת
 */
export const highlightWord = (text: string, wordToHighlight: string): React.ReactNode[] => {
  if (!wordToHighlight || !text) {
    return [text];
  }

  // יצירת regex שמחפש את המילה (case insensitive)
  const regex = new RegExp(`(${wordToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    // בדיקה אם החלק תואם למילה המבוקשת
    if (part && regex.test(part)) {
      return (
        <strong key={index} className="text-primary font-bold">
          {part}
        </strong>
      );
    }
    return part || '';
  });
};
