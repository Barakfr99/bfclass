import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { LogOut, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  total_sentences: number;
  created_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  total_score: number | null;
  submitted_at: string | null;
  teacher_feedback: string | null;
}

export default function StudentDashboard() {
  const { student, logout } = useStudent();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student || student.isTeacher) {
      navigate('/');
      return;
    }
    loadData();

    // הוספת realtime updates לטבלת submissions
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${student?.studentId}`
        },
        () => {
          loadData(); // רענון הנתונים כשיש שינוי
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student, navigate]);

  const loadData = async () => {
    try {
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('is_published', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', student?.studentId);

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status || status === 'not_started') {
      return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> לא התחיל</Badge>;
    }
    if (status === 'in_progress') {
      return <Badge className="bg-warning gap-1"><Clock className="w-3 h-3" /> בתהליך</Badge>;
    }
    if (status === 'submitted') {
      return <Badge className="bg-success gap-1"><CheckCircle2 className="w-3 h-3" /> הוגש</Badge>;
    }
    if (status === 'returned_for_revision') {
      return <Badge className="bg-destructive gap-1"><AlertCircle className="w-3 h-3" /> הוחזר לתיקון</Badge>;
    }
    return null;
  };

  const handleAssignmentClick = (assignmentId: string) => {
    const submission = getSubmissionStatus(assignmentId);
    if (!submission || submission.status === 'not_started') {
      navigate(`/assignment/${assignmentId}/instructions`);
    } else if (submission.status === 'in_progress' || submission.status === 'returned_for_revision') {
      navigate(`/assignment/${assignmentId}/sentence/1`);
    } else if (submission.status === 'submitted') {
      navigate(`/assignment/${assignmentId}/results`);
    }
  };

  const getButtonText = (assignmentId: string) => {
    const submission = getSubmissionStatus(assignmentId);
    if (!submission || submission.status === 'not_started') {
      return 'התחל משימה';
    }
    if (submission.status === 'in_progress') {
      return 'המשך עבודה';
    }
    if (submission.status === 'returned_for_revision') {
      return 'תקן והגש שוב';
    }
    return 'צפה בתוצאות';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  // Check if there are assignments returned for revision
  const hasReturnedAssignments = submissions.some(s => s.status === 'returned_for_revision');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">שלום, {student?.studentName}! 👋</h1>
            <p className="text-muted-foreground">המשימות שלך ממתינות</p>
          </div>
          <Button variant="outline" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </div>

        {/* Alert for returned assignments */}
        {hasReturnedAssignments && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-destructive text-destructive-foreground rounded-full p-2">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 text-destructive">🔴 יש משימות שהוחזרו לתיקון</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    המורה ביקש ממך לתקן ולשלוח שוב. עיין בהערות המורה למטה ותקן את המשימות.
                  </p>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      const firstReturnedAssignment = assignments.find(a => {
                        const sub = getSubmissionStatus(a.id);
                        return sub?.status === 'returned_for_revision';
                      });
                      if (firstReturnedAssignment) {
                        handleAssignmentClick(firstReturnedAssignment.id);
                      }
                    }}
                  >
                    עבור לתיקון עכשיו →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            המשימות שלי
          </h2>
          
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">אין משימות זמינות כרגע</p>
              </CardContent>
            </Card>
          ) : (
            assignments.map(assignment => {
              const submission = getSubmissionStatus(assignment.id);
              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        <div className="flex gap-2 items-center flex-wrap">
                          {getStatusBadge(submission?.status)}
                          {submission?.status === 'submitted' && submission.total_score !== null && (
                            <Badge variant="outline" className="bg-primary/5">
                              ציון: {submission.total_score}
                            </Badge>
                          )}
                          {submission?.status === 'returned_for_revision' && submission.total_score !== null && (
                            <Badge variant="outline" className="bg-warning/10">
                              ציון נוכחי: {submission.total_score}
                            </Badge>
                          )}
                        </div>
                        {submission?.teacher_feedback && (
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-2">
                            💬 "{submission.teacher_feedback}"
                          </p>
                        )}
                      </div>
                      <Button onClick={() => handleAssignmentClick(assignment.id)}>
                        {getButtonText(assignment.id)}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
