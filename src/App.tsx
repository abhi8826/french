import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentCourses from '@/pages/student/StudentCourses';
import StudentCourseDetail from '@/pages/student/StudentCourseDetail';
import StudentLesson from '@/pages/student/StudentLesson';
import StudentClasses from '@/pages/student/StudentClasses';
import StudentProfile from '@/pages/student/StudentProfile';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminCourseDetail from '@/pages/admin/AdminCourseDetail';
import AdminModuleManagement from '@/pages/admin/AdminModuleManagement';
import AdminLessonEditor from '@/pages/admin/AdminLessonEditor';
import AdminStudents from '@/pages/admin/AdminStudents';
import AdminStudentDetail from '@/pages/admin/AdminStudentDetail';
import AdminClasses from '@/pages/admin/AdminClasses';

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <LandingPage />;
  return <Navigate to={session.user?.app_metadata?.role === 'teacher' ? '/admin/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Student */}
          <Route path="/student/dashboard" element={<ProtectedRoute requireRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/courses" element={<ProtectedRoute requireRole="student"><StudentCourses /></ProtectedRoute>} />
          <Route path="/student/courses/:courseId" element={<ProtectedRoute requireRole="student"><StudentCourseDetail /></ProtectedRoute>} />
          <Route path="/student/lesson/:lessonId" element={<ProtectedRoute requireRole="student"><StudentLesson /></ProtectedRoute>} />
          <Route path="/student/classes" element={<ProtectedRoute requireRole="student"><StudentClasses /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute requireRole="student"><StudentProfile /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requireRole="teacher"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute requireRole="teacher"><AdminCourses /></ProtectedRoute>} />
          <Route path="/admin/courses/new" element={<ProtectedRoute requireRole="teacher"><AdminCourses /></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId" element={<ProtectedRoute requireRole="teacher"><AdminCourseDetail /></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/modules" element={<ProtectedRoute requireRole="teacher"><AdminModuleManagement /></ProtectedRoute>} />
          <Route path="/admin/lessons/:lessonId" element={<ProtectedRoute requireRole="teacher"><AdminLessonEditor /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute requireRole="teacher"><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId" element={<ProtectedRoute requireRole="teacher"><AdminStudentDetail /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute requireRole="teacher"><AdminClasses /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
