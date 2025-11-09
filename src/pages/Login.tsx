import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useStudent } from '@/contexts/StudentContext';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';
export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    setStudent
  } = useStudent();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.length !== 9) {
      toast.error('יש להזין תעודת זהות בת 9 ספרות');
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('students').select('*').eq('student_id', studentId).single();
      if (error || !data) {
        toast.error('תעודת הזהות לא נמצאה במערכת');
        return;
      }
      setStudent({
        studentId: data.student_id,
        studentName: data.student_name,
        isTeacher: data.is_teacher
      });
      if (data.is_teacher) {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (error) {
      toast.error('אירעה שגיאה בכניסה למערכת');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">מערכת תרגילי עברית</CardTitle>
          <CardDescription className="text-base">
            הזן את תעודת הזהות שלך כדי להיכנס למערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input type="text" placeholder="תעודת זהות (9 ספרות)" value={studentId} onChange={e => setStudentId(e.target.value.replace(/\D/g, ''))} maxLength={9} className="text-center text-lg tracking-wider" disabled={loading} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
            </Button>
          </form>
          
          
        </CardContent>
      </Card>
    </div>;
}