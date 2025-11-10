import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStudent } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Eye, RotateCcw, Trash2, TrendingUp, FileText, StickyNote } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ReturnForRevisionDialog from '@/components/ReturnForRevisionDialog';
import ResetAssignmentDialog from '@/components/ResetAssignmentDialog';
import StudentProgressDialog from '@/components/StudentProgressDialog';
import AssignmentPreviewDialog from '@/components/AssignmentPreviewDialog';
import StudentNotesDialog from '@/components/StudentNotesDialog';

interface Student {
  id: string;
  student_id: string;
  student_name: string;
}

interface Submission {
  id: string;
  student_id: string;
  assignment_id: string;
  status: string;
  total_score: number | null;
  submitted_at: string | null;
  teacher_feedback: string | null;
  created_at: string;
}

interface StudentNote {
  id: string;
  student_id: string;
  note_text: string | null;
  tags: string[];
}

interface StudentWithSubmission extends Student {
  submission?: Submission;
  completedSentences?: number;
  notes?: StudentNote;
}

interface Assignment {
  id: string;
  title: string;
  total_sentences: number;
  created_at: string;
  description: string | null;
}

export default function TeacherAssignmentDetails() {
  const { assignmentId } = useParams();
  const { student } = useStudent();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<StudentWithSubmission[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithSubmission | null>(null);

  useEffect(() => {
    if (!student || !student.isTeacher) {
      navigate('/');
      return;
    }
    loadData();
  }, [student, navigate, assignmentId]);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, statusFilter, students]);

  const loadData = async () => {
    try {
      // Load assignment details
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (!assignmentData) {
        toast({ title: 'שגיאה', description: 'המשימה לא נמצאה', variant: 'destructive' });
        navigate('/teacher');
        return;
      }

      setAssignment(assignmentData);

      // Load all students (excluding teachers)
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('is_teacher', false)
        .order('student_name');

      // Load all submissions for this assignment
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId);

      // Load all student notes
      const { data: notesData } = await supabase
        .from('student_notes')
        .select('*');

      // Combine students with their submissions
      const studentsWithSubmissions = await Promise.all(
        (studentsData || []).map(async (student) => {
          const submission = submissionsData?.find(s => s.student_id === student.student_id);
          const notes = notesData?.find(n => n.student_id === student.student_id);
          
          // If in progress, count completed sentences
          let completedSentences = 0;
          if (submission && submission.status === 'in_progress') {
            const { data: answers } = await supabase
              .from('student_answers')
              .select('*')
              .eq('submission_id', submission.id);
            
            completedSentences = answers?.filter(a => 
              a.student_shoresh && 
              a.student_binyan && 
              a.student_zman && 
              a.student_guf
            ).length || 0;
          }
          
          return {
            ...student,
            submission,
            completedSentences,
            notes
          };
        })
      );

      setStudents(studentsWithSubmissions);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'שגיאה', description: 'שגיאה בטעינת הנתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.student_name.includes(searchQuery) || 
        s.student_id.includes(searchQuery)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => {
        const status = s.submission?.status || 'not_started';
        return status === statusFilter;
      });
    }

    setFilteredStudents(filtered);
  };

  const getStatusInfo = (status: string | undefined) => {
    if (!status || status === 'not_started') {
      return { text: 'לא התחיל', icon: '⚪', color: 'bg-muted' };
    }
    if (status === 'in_progress') {
      return { text: 'בתהליך', icon: '🟡', color: 'bg-warning' };
    }
    if (status === 'submitted') {
      return { text: 'הוגש', icon: '🟢', color: 'bg-success' };
    }
    if (status === 'returned_for_revision') {
      return { text: 'הוחזר לתיקון', icon: '🔴', color: 'bg-destructive' };
    }
    return { text: 'לא ידוע', icon: '⚪', color: 'bg-muted' };
  };

  const getStats = () => {
    const submitted = students.filter(s => s.submission?.status === 'submitted').length;
    const inProgress = students.filter(s => s.submission?.status === 'in_progress').length;
    const notStarted = students.filter(s => !s.submission || s.submission.status === 'not_started').length;
    const returned = students.filter(s => s.submission?.status === 'returned_for_revision').length;
    
    const submittedScores = students
      .filter(s => s.submission?.status === 'submitted' && s.submission?.total_score !== null)
      .map(s => s.submission!.total_score!);
    
    const avgScore = submittedScores.length > 0
      ? submittedScores.reduce((sum, score) => sum + score, 0) / submittedScores.length
      : 0;

    return { submitted, inProgress, notStarted, returned, avgScore: Math.round(avgScore * 10) / 10 };
  };

  const handleReturnForRevision = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReturnDialogOpen(true);
  };

  const handleResetAssignment = (student: StudentWithSubmission) => {
    setSelectedStudent(student);
    setResetDialogOpen(true);
  };

  const handleViewProgress = (student: StudentWithSubmission) => {
    setSelectedStudent(student);
    setProgressDialogOpen(true);
  };

  const handleOpenNotes = (student: StudentWithSubmission) => {
    setSelectedStudent(student);
    setNotesDialogOpen(true);
  };

  const handleViewSubmission = (submissionId: string) => {
    // Navigate to results page to view the submission
    navigate(`/assignment/${assignmentId}/results?submissionId=${submissionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/teacher')} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold">📝 {assignment.title}</h1>
            <Button 
              variant="outline" 
              onClick={() => setPreviewDialogOpen(true)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              תצוגה מקדימה
            </Button>
          </div>
          
          <p className="text-muted-foreground">
            נוצר ב: {new Date(assignment.created_at).toLocaleDateString('he-IL')}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">הגישו</p>
              <p className="text-2xl font-bold text-success">{stats.submitted} ({Math.round(stats.submitted / students.length * 100)}%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">בתהליך</p>
              <p className="text-2xl font-bold text-warning">{stats.inProgress} ({Math.round(stats.inProgress / students.length * 100)}%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">לא התחילו</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.notStarted} ({Math.round(stats.notStarted / students.length * 100)}%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">הוחזרו לתיקון</p>
              <p className="text-2xl font-bold text-destructive">{stats.returned}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">ממוצע</p>
                <p className="text-2xl font-bold">{stats.avgScore || '—'}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-primary" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חפש תלמיד..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-md bg-background"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="submitted">הוגש</option>
                <option value="in_progress">בתהליך</option>
                <option value="not_started">לא התחיל</option>
                <option value="returned_for_revision">הוחזר לתיקון</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <div className="space-y-3">
          {filteredStudents.map((student, index) => {
            const status = student.submission?.status || 'not_started';
            const statusInfo = getStatusInfo(status);
            
            return (
              <Card key={student.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold">{index + 1}.</span>
                        <div>
                          <p className="font-semibold">{student.student_name}</p>
                          <p className="text-sm text-muted-foreground">ת.ז: {student.student_id}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.text}
                        </Badge>
                        
                        {status === 'submitted' && student.submission?.total_score !== null && (
                          <Badge variant="outline" className="bg-primary/5">
                            ציון: {student.submission.total_score}
                          </Badge>
                        )}
                        
                        {status === 'returned_for_revision' && student.submission?.total_score !== null && (
                          <Badge variant="outline" className="bg-warning/10">
                            ציון נוכחי: {student.submission.total_score}
                          </Badge>
                        )}
                        
                        {status === 'in_progress' && (
                          <Badge variant="outline">
                            {student.completedSentences}/{assignment.total_sentences} משפטים
                          </Badge>
                        )}
                        
                        {/* Display student tags */}
                        {student.notes?.tags && student.notes.tags.length > 0 && (
                          <>
                            {student.notes.tags.map(tag => {
                              const tagConfig = {
                                'needs_help': { label: '🆘 צריך עזרה', color: 'bg-destructive' },
                                'excellent': { label: '⭐ מצטיין', color: 'bg-success' },
                                'follow_up': { label: '📌 למעקב', color: 'bg-warning' },
                                'improved': { label: '📈 השתפר', color: 'bg-primary' },
                                'struggling': { label: '💪 מתקשה', color: 'bg-orange-500' },
                                'motivated': { label: '🔥 מוטיבציה גבוהה', color: 'bg-green-500' },
                              }[tag];
                              
                              return tagConfig ? (
                                <Badge key={tag} className={tagConfig.color}>
                                  {tagConfig.label}
                                </Badge>
                              ) : null;
                            })}
                          </>
                        )}
                        
                        {student.submission?.submitted_at && (
                          <span className="text-xs text-muted-foreground">
                            הוגש ב: {new Date(student.submission.submitted_at).toLocaleString('he-IL')}
                          </span>
                        )}
                      </div>
                      
                      {student.submission?.teacher_feedback && (
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2">
                          💬 "{student.submission.teacher_feedback}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {/* Notes Button - always available */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenNotes(student)}
                        className="gap-1"
                      >
                        <StickyNote className="w-4 h-4" />
                        הערות
                        {student.notes?.tags && student.notes.tags.length > 0 && (
                          <Badge variant="secondary" className="mr-1 h-5 px-1">
                            {student.notes.tags.length}
                          </Badge>
                        )}
                      </Button>
                      
                      {/* View Submission - only if submitted or returned */}
                      {(status === 'submitted' || status === 'returned_for_revision') && student.submission && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewSubmission(student.submission!.id)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          צפה בהגשה
                        </Button>
                      )}
                      
                      {/* View Progress - only if in progress */}
                      {status === 'in_progress' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewProgress(student)}
                          className="gap-1"
                        >
                          <TrendingUp className="w-4 h-4" />
                          צפה בהתקדמות
                        </Button>
                      )}
                      
                      {/* Return for Revision - only if submitted */}
                      {status === 'submitted' && student.submission && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleReturnForRevision(student.submission!)}
                          className="gap-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          החזר לתיקון
                        </Button>
                      )}
                      
                      {/* Reset Assignment - available for all statuses except not_started */}
                      {status !== 'not_started' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleResetAssignment(student)}
                          className="gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          אפס תרגיל
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredStudents.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">לא נמצאו תלמידים</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AssignmentPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        assignmentId={assignmentId!}
        assignmentTitle={assignment.title}
      />
      
      {selectedStudent && (
        <>
          <StudentNotesDialog
            open={notesDialogOpen}
            onOpenChange={setNotesDialogOpen}
            studentId={selectedStudent.student_id}
            studentName={selectedStudent.student_name}
            onNotesUpdated={loadData}
          />
          
          <ResetAssignmentDialog
            open={resetDialogOpen}
            onOpenChange={setResetDialogOpen}
            student={selectedStudent}
            assignmentId={assignmentId!}
            onSuccess={loadData}
          />
          
          <StudentProgressDialog
            open={progressDialogOpen}
            onOpenChange={setProgressDialogOpen}
            student={selectedStudent}
            assignment={assignment}
          />
        </>
      )}
      
      {selectedSubmission && (
        <ReturnForRevisionDialog
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          submission={selectedSubmission}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
