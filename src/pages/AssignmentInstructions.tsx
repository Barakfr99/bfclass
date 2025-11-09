import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, BookOpen } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  instructions_text: string;
}

export default function AssignmentInstructions() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { student } = useStudent();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student || student.isTeacher) {
      navigate('/');
      return;
    }
    loadAssignment();
  }, [assignmentId, student, navigate]);

  const loadAssignment = async () => {
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      setAssignment(data);
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    // Create or update submission status
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student?.studentId)
      .eq('assignment_id', assignmentId)
      .single();

    if (!existingSubmission) {
      await supabase
        .from('submissions')
        .insert({
          student_id: student?.studentId,
          assignment_id: assignmentId,
          status: 'in_progress'
        });
    }

    navigate(`/assignment/${assignmentId}/sentence/1`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl">📚 {assignment?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-lg max-w-none text-foreground whitespace-pre-line">
              {assignment?.instructions_text}
            </div>
            
            <div className="flex justify-center pt-6">
              <Button size="lg" onClick={handleStart} className="gap-2 px-8">
                התחל תרגיל
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
