import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Users, FileCheck, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalSubmissions: number;
  averageScore: number;
  pendingReviews: number;
}

interface Assignment {
  id: string;
  title: string;
  created_at: string;
  total_sentences: number;
  submissions_count: number;
  average_score: number;
}

export default function TeacherDashboard() {
  const { student, logout } = useStudent();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalSubmissions: 0,
    averageScore: 0,
    pendingReviews: 0
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student || !student.isTeacher) {
      navigate('/');
      return;
    }
    loadData();
  }, [student, navigate]);

  const loadData = async () => {
    try {
      // Load students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_teacher', false);

      // Load submissions stats
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*');

      const submittedSubmissions = submissions?.filter(s => s.status === 'submitted') || [];
      const avgScore = submittedSubmissions.length > 0
        ? submittedSubmissions.reduce((sum, s) => sum + (s.total_score || 0), 0) / submittedSubmissions.length
        : 0;

      // Load assignments with stats
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      const assignmentsWithStats = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { data: assignmentSubmissions } = await supabase
            .from('submissions')
            .select('*')
            .eq('assignment_id', assignment.id)
            .eq('status', 'submitted');

          const avgAssignmentScore = assignmentSubmissions && assignmentSubmissions.length > 0
            ? assignmentSubmissions.reduce((sum, s) => sum + (s.total_score || 0), 0) / assignmentSubmissions.length
            : 0;

          return {
            ...assignment,
            submissions_count: assignmentSubmissions?.length || 0,
            average_score: Math.round(avgAssignmentScore * 10) / 10
          };
        })
      );

      setStats({
        totalStudents: studentsCount || 0,
        totalSubmissions: submissions?.length || 0,
        averageScore: Math.round(avgScore * 10) / 10,
        pendingReviews: submittedSubmissions.length
      });

      setAssignments(assignmentsWithStats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">👨‍🏫 ממשק מורה</h1>
            <p className="text-muted-foreground">ניהול משימות והגשות</p>
          </div>
          <Button variant="outline" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">תלמידים</p>
                  <p className="text-3xl font-bold">{stats.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">הגשות</p>
                  <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
                </div>
                <FileCheck className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ממוצע</p>
                  <p className="text-3xl font-bold">{stats.averageScore}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ממתין</p>
                  <p className="text-3xl font-bold">{stats.pendingReviews}</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">רשימת משימות</h2>
            <Button disabled>➕ צור משימה חדשה</Button>
          </div>

          {assignments.map(assignment => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">📝 {assignment.title}</CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>📅 {new Date(assignment.created_at).toLocaleDateString('he-IL')}</span>
                      <span>👥 {stats.totalStudents} תלמידים | ✓ {assignment.submissions_count} הגישו</span>
                      {assignment.average_score > 0 && (
                        <span>📊 ממוצע: {assignment.average_score}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>צפה בפירוט</Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
