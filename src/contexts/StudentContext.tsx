import { createContext, useContext, useState, ReactNode } from 'react';

interface Student {
  studentId: string;
  studentName: string;
  isTeacher: boolean;
}

interface StudentContextType {
  student: Student | null;
  setStudent: (student: Student | null) => void;
  logout: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);

  const logout = () => {
    setStudent(null);
    window.location.href = '/';
  };

  return (
    <StudentContext.Provider value={{ student, setStudent, logout }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
