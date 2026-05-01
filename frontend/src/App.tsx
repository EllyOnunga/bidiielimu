import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoader } from './components/PageLoader';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const StudentsPage = lazy(() => import('./pages/StudentsPage').then(m => ({ default: m.StudentsPage })));
const TeachersPage = lazy(() => import('./pages/TeachersPage').then(m => ({ default: m.TeachersPage })));
const ClassesPage = lazy(() => import('./pages/ClassesPage').then(m => ({ default: m.ClassesPage })));
const ClassDetailPage = lazy(() => import('./pages/ClassDetailPage').then(m => ({ default: m.ClassDetailPage })));
const FeesPage = lazy(() => import('./pages/FeesPage').then(m => ({ default: m.FeesPage })));
const ExamsPage = lazy(() => import('./pages/ExamsPage').then(m => ({ default: m.ExamsPage })));
const ExamMarksEntryPage = lazy(() => import('./pages/ExamMarksEntryPage').then(m => ({ default: m.ExamMarksEntryPage })));
const ReportCardPage = lazy(() => import('./pages/ReportCardPage').then(m => ({ default: m.ReportCardPage })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const AttendanceMarkingPage = lazy(() => import('./pages/AttendanceMarkingPage').then(m => ({ default: m.AttendanceMarkingPage })));
const PortalDashboard = lazy(() => import('./pages/PortalDashboard').then(m => ({ default: m.PortalDashboard })));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage').then(m => ({ default: m.SuperAdminPage })));
const TimetablePage = lazy(() => import('./pages/TimetablePage').then(m => ({ default: m.TimetablePage })));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage').then(m => ({ default: m.SolutionsPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const CareersPage = lazy(() => import('./pages/CareersPage').then(m => ({ default: m.CareersPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const CommunicationPage = lazy(() => import('./pages/CommunicationPage').then(m => ({ default: m.CommunicationPage })));
const GradingPage = lazy(() => import('./pages/GradingPage').then(m => ({ default: m.GradingPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then(m => ({ default: m.GuidePage })));

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
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f8fafc',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
          }}
        />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
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
            <Route path="/guide" element={<GuidePage />} />

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
          </Suspense>
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
