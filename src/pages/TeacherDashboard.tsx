import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Users, FileCheck, TrendingUp, Clock, User, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import ReturnForRevisionDialog from '@/components/ReturnForRevisionDialog';
import ResetAssignmentDialog from '@/components/ResetAssignmentDialog';
import AssignmentPreviewDialog from '@/components/AssignmentPreviewDialog';

interface Stats {
  totalStudents: number;
  totalSubmissions: number;
  averageScore: number;
  pendingReviews: number;
  totalAssignments?: number;
  submittedAssignments?: number;
}

interface Assignment {
  id: string;
  title: string;
  created_at: string;
  total_sentences: number;
  submissions_count: number;
  average_score: number;
  is_hidden?: boolean;
  grade_level?: string;
}

interface StudentInfo {
  id: string;
  student_id: string;
  student_name: string;
}

interface StudentAssignment extends Assignment {
  submission_status?: string;
  submission_score?: number;
  submitted_at?: string;
  submission_id?: string;
}

export default function TeacherDashboard() {
  const { student, logout } = useStudent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentIdFromUrl = searchParams.get('student');
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalSubmissions: 0,
    averageScore: 0,
    pendingReviews: 0
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{
    id: string;
    student_id: string;
    total_score: number | null;
  } | null>(null);
  const [selectedStudentForReset, setSelectedStudentForReset] = useState<{
    student_id: string;
    student_name: string;
    submission?: {
      id: string;
      status: string;
    };
  } | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewAssignment, setPreviewAssignment] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!student || !student.isTeacher) {
      navigate('/');
      return;
    }
    loadData();
    
    // If there's a student ID in URL, select that student
    if (studentIdFromUrl) {
      setSelectedStudent(studentIdFromUrl);
    }
  }, [student, navigate, studentIdFromUrl]);

  const loadData = async () => {
    try {
      // Load all students
      let studentsQuery = supabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('is_teacher', false);
      
      if (selectedGradeLevel !== 'all') {
        studentsQuery = studentsQuery.eq('grade_level', selectedGradeLevel);
      }
      
      const { data: studentsData, count: studentsCount } = await studentsQuery
        .order('student_name');
      
      setStudents(studentsData || []);

      // Load submissions stats
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*');

      const submittedSubmissions = submissions?.filter(s => s.status === 'submitted') || [];
      const avgScore = submittedSubmissions.length > 0
        ? submittedSubmissions.reduce((sum, s) => sum + (s.total_score || 0), 0) / submittedSubmissions.length
        : 0;

      // Load assignments with stats (filter by grade level if selected)
      let assignmentsQuery = supabase
        .from('assignments')
        .select('*');
      
      if (selectedGradeLevel !== 'all') {
        assignmentsQuery = assignmentsQuery.eq('grade_level', selectedGradeLevel);
      }
      
      const { data: assignmentsData } = await assignmentsQuery
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

  const loadStudentAssignments = async (studentId: string) => {
    try {
      // Get all assignments (filter by grade level if selected)
      let assignmentsQuery = supabase
        .from('assignments')
        .select('*');
      
      if (selectedGradeLevel !== 'all') {
        assignmentsQuery = assignmentsQuery.eq('grade_level', selectedGradeLevel);
      }
      
      const { data: assignmentsData } = await assignmentsQuery
        .order('created_at', { ascending: false });

      const totalAssignments = assignmentsData?.length || 0;

      // Get all submissions for this student
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id, assignment_id, status, total_score, student_id, submitted_at')
        .eq('student_id', studentId);

      // Calculate stats for this specific student
      const submittedSubmissions = submissionsData?.filter(s => s.status === 'submitted' || s.status === 'returned_for_revision') || [];
      const avgScore = submittedSubmissions.length > 0
        ? submittedSubmissions.reduce((sum, s) => sum + (s.total_score || 0), 0) / submittedSubmissions.length
        : 0;

      setStats({
        totalStudents: 1, // It's a specific student
        totalSubmissions: submissionsData?.length || 0,
        averageScore: Math.round(avgScore * 10) / 10,
        pendingReviews: submittedSubmissions.length,
        totalAssignments: totalAssignments,
        submittedAssignments: submittedSubmissions.length
      });

      // Combine assignments with student's submission data
      const assignmentsWithStatus = (assignmentsData || []).map(assignment => {
        const submission = submissionsData?.find(s => s.assignment_id === assignment.id);
        
        return {
          ...assignment,
          submissions_count: 0,
          average_score: 0,
          submission_status: submission?.status || 'not_started',
          submission_score: submission?.total_score,
          submitted_at: submission?.submitted_at,
          submission_id: submission?.id // Store submission ID for navigation
        };
      });

      setStudentAssignments(assignmentsWithStatus);
    } catch (error) {
      console.error('Error loading student assignments:', error);
    }
  };

  useEffect(() => {
    if (selectedStudent !== 'all') {
      const student = students.find(s => s.student_id === selectedStudent);
      if (student) {
        setSelectedStudentName(student.student_name);
      }
      loadStudentAssignments(selectedStudent);
    } else {
      setSelectedStudentName('');
      // Reload general stats when switching back to "all"
      loadData();
    }
  }, [selectedStudent, students]);

  useEffect(() => {
    loadData();
  }, [selectedGradeLevel]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'not_started':
        return { text: '⚪ לא התחיל', color: 'text-muted-foreground' };
      case 'in_progress':
        return { text: '🟡 בתהליך', color: 'text-warning' };
      case 'submitted':
        return { text: '🟢 הוגש', color: 'text-success' };
      case 'returned_for_revision':
        return { text: '🔴 הוחזר לתיקון', color: 'text-destructive' };
      default:
        return { text: status, color: 'text-muted-foreground' };
    }
  };

  const handleReturnForRevision = (submission: { id: string; student_id: string; total_score: number | null }) => {
    setSelectedSubmission(submission);
    setReturnDialogOpen(true);
  };

  const handleResetAssignment = (assignmentId: string, submissionId: string, status: string) => {
    const student = students.find(s => s.student_id === selectedStudent);
    if (student) {
      setSelectedStudentForReset({
        student_id: student.student_id,
        student_name: student.student_name,
        submission: {
          id: submissionId,
          status: status
        }
      });
      setSelectedAssignmentId(assignmentId);
      setResetDialogOpen(true);
    }
  };

  const handleReturnSuccess = () => {
    setReturnDialogOpen(false);
    if (selectedStudent !== 'all') {
      loadStudentAssignments(selectedStudent);
    } else {
      loadData();
    }
  };

  const handleResetSuccess = () => {
    setResetDialogOpen(false);
    if (selectedStudent !== 'all') {
      loadStudentAssignments(selectedStudent);
    } else {
      loadData();
    }
  };

  const toggleAssignmentVisibility = async (assignmentId: string, currentHiddenState: boolean) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_hidden: !currentHiddenState })
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success(currentHiddenState ? 'המשימה נחשפה לתלמידים' : 'המשימה הוסתרה מהתלמידים');
      loadData();
    } catch (error) {
      console.error('Error toggling assignment visibility:', error);
      toast.error('שגיאה בשינוי מצב המשימה');
    }
  };

  const handlePreviewAssignment = (assignmentId: string, assignmentTitle: string) => {
    setPreviewAssignment({ id: assignmentId, title: assignmentTitle });
    setPreviewDialogOpen(true);
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
                  <p className="text-sm text-muted-foreground">
                    {selectedStudent === 'all' ? 'תלמידים' : 'תלמיד'}
                  </p>
                  <p className="text-3xl font-bold">
                    {selectedStudent === 'all' ? stats.totalStudents : selectedStudentName}
                  </p>
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
                  <p className="text-3xl font-bold">
                    {selectedStudent === 'all' 
                      ? stats.totalSubmissions
                      : `${stats.submittedAssignments}/${stats.totalAssignments}`
                    }
                  </p>
                  {selectedStudent !== 'all' && stats.totalAssignments && stats.totalAssignments > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ({Math.round((stats.submittedAssignments || 0) / stats.totalAssignments * 100)}% הגישו)
                    </p>
                  )}
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
                  <p className="text-sm text-muted-foreground">
                    {selectedStudent === 'all' ? 'ממתין לבדיקה' : 'הוגש'}
                  </p>
                  <p className="text-3xl font-bold">{stats.pendingReviews}</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold">רשימת משימות</h2>
            <div className="flex gap-4 items-center w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                <User className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="בחר תלמיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל התלמידים</SelectItem>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.student_id}>
                        {student.student_name} ({student.student_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedGradeLevel} onValueChange={setSelectedGradeLevel}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="שכבת לימוד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל השכבות</SelectItem>
                    <SelectItem value="י׳">י׳</SelectItem>
                    <SelectItem value="י״א">י״א</SelectItem>
                    <SelectItem value="י״ב">י״ב</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button disabled>➕ צור משימה חדשה</Button>
            </div>
          </div>

          {selectedStudent === 'all' ? (
            // Show all assignments with overall stats
            assignments.map(assignment => (
              <Card key={assignment.id} className={assignment.is_hidden ? 'opacity-60 border-dashed' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">📝 {assignment.title}</CardTitle>
                        {assignment.is_hidden && (
                          <Badge variant="secondary" className="text-xs">מוסתר</Badge>
                        )}
                        {assignment.grade_level && (
                          <Badge variant="outline" className="text-xs">{assignment.grade_level}</Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>📅 {new Date(assignment.created_at).toLocaleDateString('he-IL')}</span>
                        <span>👥 {assignment.submissions_count} מתוך {stats.totalStudents} הגישו</span>
                        {assignment.average_score > 0 && (
                          <span>📊 ממוצע: {assignment.average_score}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePreviewAssignment(assignment.id, assignment.title)}
                      >
                        👁️ תצוגה מקדימה
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/teacher/assignment/${assignment.id}`)}
                      >
                        צפה בפירוט
                      </Button>
                      <Button 
                        variant={assignment.is_hidden ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => toggleAssignmentVisibility(assignment.id, assignment.is_hidden || false)}
                      >
                        {assignment.is_hidden ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            חשוף
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            הסתר
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            // Show assignments filtered by selected student
            studentAssignments.map((assignment, index) => {
              const statusDisplay = getStatusDisplay(assignment.submission_status || 'not_started');
              const status = assignment.submission_status || 'not_started';
              const canViewSubmission = status === 'submitted' || status === 'returned_for_revision';
              const canReturnForRevision = status === 'submitted';
              const canReset = status !== 'not_started';
              
              return (
                <Card key={assignment.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold">{index + 1}.</span>
                          <div>
                            <p className="font-semibold text-lg">📝 {assignment.title}</p>
                            <p className="text-sm text-muted-foreground">
                              נוצר: {new Date(assignment.created_at).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge className={statusDisplay.color}>
                            {statusDisplay.text}
                          </Badge>
                          
                          {status === 'submitted' && assignment.submission_score !== null && assignment.submission_score !== undefined && (
                            <Badge variant="outline" className="bg-primary/5">
                              ציון: {assignment.submission_score}
                            </Badge>
                          )}
                          
                          {status === 'returned_for_revision' && assignment.submission_score !== null && assignment.submission_score !== undefined && (
                            <Badge variant="outline" className="bg-warning/10">
                              ציון נוכחי: {assignment.submission_score}
                            </Badge>
                          )}
                          
                          {assignment.submitted_at && (
                            <span className="text-xs text-muted-foreground">
                              הוגש ב: {new Date(assignment.submitted_at).toLocaleString('he-IL')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {canViewSubmission && assignment.submission_id ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/assignment/${assignment.id}/results?submissionId=${assignment.submission_id}&returnToStudent=true`)}
                          >
                            👁️ צפה בהגשה
                          </Button>
                        ) : status === 'in_progress' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled
                          >
                            ⏳ בתהליך
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled
                          >
                            ⚪ לא התחיל
                          </Button>
                        )}
                        
                        {canReturnForRevision && assignment.submission_id && (
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleReturnForRevision({
                              id: assignment.submission_id!,
                              student_id: selectedStudent,
                              total_score: assignment.submission_score ?? null
                            })}
                          >
                            🔙 החזר לתיקון
                          </Button>
                        )}
                        
                        {canReset && assignment.submission_id && (
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => handleResetAssignment(
                              assignment.id,
                              assignment.submission_id!,
                              assignment.submission_status!
                            )}
                          >
                            <RotateCcw className="w-4 h-4" />
                            איפוס תרגיל
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Dialogs */}
        {returnDialogOpen && selectedSubmission && (
          <ReturnForRevisionDialog
            open={returnDialogOpen}
            onOpenChange={setReturnDialogOpen}
            submission={selectedSubmission}
            onSuccess={handleReturnSuccess}
          />
        )}

        {resetDialogOpen && selectedStudentForReset && (
          <ResetAssignmentDialog
            open={resetDialogOpen}
            onOpenChange={setResetDialogOpen}
            student={{
              student_id: selectedStudentForReset.student_id,
              student_name: selectedStudentForReset.student_name,
              submission: selectedStudentForReset.submission
            }}
            assignmentId={selectedAssignmentId}
            onSuccess={handleResetSuccess}
          />
        )}

        {previewDialogOpen && previewAssignment && (
          <AssignmentPreviewDialog
            open={previewDialogOpen}
            onOpenChange={setPreviewDialogOpen}
            assignmentId={previewAssignment.id}
            assignmentTitle={previewAssignment.title}
          />
        )}
      </div>
    </div>
  );
}
