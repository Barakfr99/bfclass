import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StudentProvider } from "./contexts/StudentContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAssignmentDetails from "./pages/TeacherAssignmentDetails";
import AssignmentInstructions from "./pages/AssignmentInstructions";
import AssignmentSentence from "./pages/AssignmentSentence";
import AssignmentReview from "./pages/AssignmentReview";
import AssignmentResults from "./pages/AssignmentResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StudentProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/assignment/:assignmentId" element={<TeacherAssignmentDetails />} />
            <Route path="/assignment/:assignmentId/instructions" element={<AssignmentInstructions />} />
            <Route path="/assignment/:assignmentId/sentence/:sentenceNum" element={<AssignmentSentence />} />
            <Route path="/assignment/:assignmentId/review" element={<AssignmentReview />} />
            <Route path="/assignment/:assignmentId/results" element={<AssignmentResults />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StudentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
