import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Save, X, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StudentNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onNotesUpdated?: () => void;
}

interface StudentNote {
  id: string;
  note_text: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const AVAILABLE_TAGS = [
  { value: 'needs_help', label: '🆘 צריך עזרה', color: 'bg-destructive' },
  { value: 'excellent', label: '⭐ מצטיין', color: 'bg-success' },
  { value: 'follow_up', label: '📌 למעקב', color: 'bg-warning' },
  { value: 'improved', label: '📈 השתפר', color: 'bg-primary' },
  { value: 'struggling', label: '💪 מתקשה', color: 'bg-orange-500' },
  { value: 'motivated', label: '🔥 מוטיבציה גבוהה', color: 'bg-green-500' },
];

export default function StudentNotesDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  onNotesUpdated
}: StudentNotesDialogProps) {
  const [note, setNote] = useState<StudentNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadNote();
    }
  }, [open, studentId]);

  const loadNote = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setNote(data);
        setNoteText(data.note_text || '');
        setSelectedTags(data.tags || []);
      } else {
        setNote(null);
        setNoteText('');
        setSelectedTags([]);
      }
    } catch (error) {
      console.error('Error loading note:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת ההערות',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const noteData = {
        student_id: studentId,
        note_text: noteText.trim() || null,
        tags: selectedTags,
      };

      if (note) {
        // Update existing note
        const { error } = await supabase
          .from('student_notes')
          .update(noteData)
          .eq('id', note.id);

        if (error) throw error;
      } else {
        // Insert new note
        const { error } = await supabase
          .from('student_notes')
          .insert(noteData);

        if (error) throw error;
      }

      toast({
        title: 'הצלחה',
        description: 'ההערה נשמרה בהצלחה',
      });

      onNotesUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בשמירת ההערה',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagValue: string) => {
    setSelectedTags(prev =>
      prev.includes(tagValue)
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const handleDelete = async () => {
    if (!note) return;

    if (!confirm('האם אתה בטוח שברצונך למחוק את ההערה?')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'ההערה נמחקה בהצלחה',
      });

      onNotesUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת ההערה',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            📝 הערות למורה - {studentName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            הוסף הערות פרטיות ותייג את התלמיד למעקב
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p>טוען...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tags Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium">תגיות</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <Badge
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${
                      selectedTags.includes(tag.value) ? tag.color : ''
                    }`}
                    onClick={() => toggleTag(tag.value)}
                  >
                    {selectedTags.includes(tag.value) ? (
                      <X className="w-3 h-3 mr-1" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1" />
                    )}
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium">הערות</label>
              <Textarea
                placeholder="הוסף הערות פרטיות על התלמיד..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                ההערות נשמרות באופן פרטי ורק מורים יכולים לראות אותן
              </p>
            </div>

            {/* Last Updated */}
            {note && (
              <div className="text-xs text-muted-foreground">
                עודכן לאחרונה: {new Date(note.updated_at).toLocaleString('he-IL')}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {note && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="mr-auto"
            >
              מחק הערה
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
