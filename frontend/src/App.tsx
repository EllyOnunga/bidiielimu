import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { TeachersPage } from './pages/TeachersPage';
import { ClassesPage } from './pages/ClassesPage';
import { ClassDetailPage } from './pages/ClassDetailPage';
import { FeesPage } from './pages/FeesPage';
import { ExamsPage } from './pages/ExamsPage';
import { ExamMarksEntryPage } from './pages/ExamMarksEntryPage';
import { ReportCardPage } from './pages/ReportCardPage';
import { AttendancePage } from './pages/AttendancePage';
import { AttendanceMarkingPage } from './pages/AttendanceMarkingPage';
import { PortalDashboard } from './pages/PortalDashboard';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { TimetablePage } from './pages/TimetablePage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { GradingPage } from './pages/GradingPage';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'oklch(0.16 0.03 240 / 0.8)',
              color: 'oklch(0.98 0.01 240)',
              backdropFilter: 'blur(16px)',
              border: '1px solid oklch(1 0 0 / 0.1)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px 0 oklch(0 0 0 / 0.37)',
            },
          }}
        />
        <ErrorBoundary>
          <Routes>
            {/* ── Public / Marketing Routes ── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/students" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><StudentsPage /></ProtectedRoute>
              } />
              <Route path="/students/:id/report" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}><ReportCardPage /></ProtectedRoute>
              } />
              <Route path="/teachers" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><TeachersPage /></ProtectedRoute>
              } />
              <Route path="/classes" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><ClassesPage /></ProtectedRoute>
              } />
              <Route path="/classes/:streamId" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><ClassDetailPage /></ProtectedRoute>
              } />
              <Route path="/fees" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><FeesPage /></ProtectedRoute>
              } />
              <Route path="/exams" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><ExamsPage /></ProtectedRoute>
              } />
              <Route path="/exams/entry" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><ExamMarksEntryPage /></ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><AttendancePage /></ProtectedRoute>
              } />
              <Route path="/attendance/mark" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><AttendanceMarkingPage /></ProtectedRoute>
              } />
              <Route path="/portal" element={<PortalDashboard />} />
              <Route path="/super-admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><SuperAdminPage /></ProtectedRoute>
              } />
              <Route path="/timetable" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}><TimetablePage /></ProtectedRoute>
              } />
              <Route path="/audit-logs" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><AuditLogPage /></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><AnalyticsPage /></ProtectedRoute>
              } />
              <Route path="/communication" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><CommunicationPage /></ProtectedRoute>
              } />
              <Route path="/grading" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><GradingPage /></ProtectedRoute>
              } />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
