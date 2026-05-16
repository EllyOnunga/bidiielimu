import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ROLES } from "./constants/roles";
import { Toaster } from "react-hot-toast";
import { MainLayout } from "./layouts/MainLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageLoader } from "./components/PageLoader";
import { FloatingContact } from "./components/ui/FloatingContact";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const StudentsPage = lazy(() =>
  import("./pages/StudentsPage").then((m) => ({ default: m.StudentsPage })),
);
const TeachersPage = lazy(() =>
  import("./pages/TeachersPage").then((m) => ({ default: m.TeachersPage })),
);
const ClassesPage = lazy(() =>
  import("./pages/ClassesPage").then((m) => ({ default: m.ClassesPage })),
);
const ClassDetailPage = lazy(() =>
  import("./pages/ClassDetailPage").then((m) => ({
    default: m.ClassDetailPage,
  })),
);
const FeesPage = lazy(() =>
  import("./pages/FeesPage").then((m) => ({ default: m.FeesPage })),
);
const ExamsPage = lazy(() =>
  import("./pages/ExamsPage").then((m) => ({ default: m.ExamsPage })),
);
const ExamMarksEntryPage = lazy(() =>
  import("./pages/ExamMarksEntryPage").then((m) => ({
    default: m.ExamMarksEntryPage,
  })),
);
const ReportCardPage = lazy(() =>
  import("./pages/ReportCardPage").then((m) => ({ default: m.ReportCardPage })),
);
const AttendancePage = lazy(() =>
  import("./pages/AttendancePage").then((m) => ({ default: m.AttendancePage })),
);
const AttendanceMarkingPage = lazy(() =>
  import("./pages/AttendanceMarkingPage").then((m) => ({
    default: m.AttendanceMarkingPage,
  })),
);
const PortalDashboard = lazy(() =>
  import("./pages/PortalDashboard").then((m) => ({
    default: m.PortalDashboard,
  })),
);
const SuperAdminPage = lazy(() =>
  import("./pages/SuperAdminPage").then((m) => ({ default: m.SuperAdminPage })),
);
const TimetablePage = lazy(() =>
  import("./pages/TimetablePage").then((m) => ({ default: m.TimetablePage })),
);
const AuditLogPage = lazy(() =>
  import("./pages/AuditLogPage").then((m) => ({ default: m.AuditLogPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const SolutionsPage = lazy(() =>
  import("./pages/SolutionsPage").then((m) => ({ default: m.SolutionsPage })),
);
const PricingPage = lazy(() =>
  import("./pages/PricingPage").then((m) => ({ default: m.PricingPage })),
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const CareersPage = lazy(() =>
  import("./pages/CareersPage").then((m) => ({ default: m.CareersPage })),
);
const TermsPage = lazy(() =>
  import("./pages/TermsPage").then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })),
);
const CookiePolicyPage = lazy(() =>
  import("./pages/CookiePolicyPage").then((m) => ({
    default: m.CookiePolicyPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const CommunicationPage = lazy(() =>
  import("./pages/CommunicationPage").then((m) => ({
    default: m.CommunicationPage,
  })),
);
const GradingPage = lazy(() =>
  import("./pages/GradingPage").then((m) => ({ default: m.GradingPage })),
);
const GuidePage = lazy(() =>
  import("./pages/GuidePage").then((m) => ({ default: m.GuidePage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordConfirmPage = lazy(() =>
  import("./pages/ResetPasswordConfirmPage").then((m) => ({
    default: m.ResetPasswordConfirmPage,
  })),
);
const EmailVerificationPage = lazy(() =>
  import("./pages/EmailVerificationPage").then((m) => ({
    default: m.EmailVerificationPage,
  })),
);

const DisciplinePage = lazy(() =>
  import("./pages/DisciplinePage").then((m) => ({ default: m.DisciplinePage })),
);
const MarkEntryPage = lazy(() =>
  import("./pages/MarkEntryPage").then((m) => ({ default: m.MarkEntryPage })),
);
const LMSPage = lazy(() =>
  import("./pages/LMSPage").then((m) => ({ default: m.LMSPage })),
);
const SubjectAnalyticsPage = lazy(() =>
  import("./pages/SubjectAnalyticsPage").then((m) => ({
    default: m.SubjectAnalyticsPage,
  })),
);
const FinanceLedgerPage = lazy(() =>
  import("./pages/FinanceLedgerPage").then((m) => ({
    default: m.FinanceLedgerPage,
  })),
);
const MPesaGatewayPage = lazy(() =>
  import("./pages/MPesaGatewayPage").then((m) => ({
    default: m.MPesaGatewayPage,
  })),
);
const StaffDirectoryPage = lazy(() =>
  import("./pages/StaffDirectoryPage").then((m) => ({
    default: m.StaffDirectoryPage,
  })),
);
const PayrollPage = lazy(() =>
  import("./pages/PayrollPage").then((m) => ({ default: m.PayrollPage })),
);
const InventoryPage = lazy(() =>
  import("./pages/InventoryPage").then((m) => ({ default: m.InventoryPage })),
);
const AccessControlPage = lazy(() =>
  import("./pages/AccessControlPage").then((m) => ({
    default: m.AccessControlPage,
  })),
);
const MySchoolsPage = lazy(() =>
  import("./pages/MySchoolsPage").then((m) => ({
    default: m.MySchoolsPage,
  })),
);
const SupportPage = lazy(() =>
  import("./pages/SupportPage").then((m) => ({ default: m.SupportPage })),
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "premium-toast",
            style: {
              background: "rgba(15, 23, 42, 0.9)",
              color: "#fff",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              padding: "12px 24px",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              boxShadow: "var(--shadow-premium)",
            },
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public / Marketing Routes ── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/verify-email/:token"
                element={<EmailVerificationPage />}
              />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/reset-password/:uid/:token"
                element={<ResetPasswordConfirmPage />}
              />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
              <Route path="/guide" element={<GuidePage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                      ROLES.FINANCE,
                      ROLES.LIBRARIAN,
                    ]}
                  >
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <StudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/:id/report"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.TEACHER,
                      ROLES.STUDENT,
                      ROLES.PARENT,
                    ]}
                  >
                    <ReportCardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                    ]}
                  >
                    <TeachersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <ClassesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes/:streamId"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <ClassDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes/grade/:gradeId"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <ClassDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fees"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.FINANCE,
                    ]}
                  >
                    <FeesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exams"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <ExamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exams/entry"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <ExamMarksEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <AttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/mark"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <AttendanceMarkingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/portal" element={<PortalDashboard />} />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <SuperAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timetable"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                      ROLES.STUDENT,
                      ROLES.PARENT,
                    ]}
                  >
                    <TimetablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                    ]}
                  >
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                    ]}
                  >
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communication"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                    ]}
                  >
                    <CommunicationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grading"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                    ]}
                  >
                    <GradingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discipline"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <DisciplinePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<SettingsPage />} />

              {/* New Internal Routes */}
              <Route
                path="/exams/bulk-entry"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <MarkEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exams/subject-analytics"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.TEACHER,
                    ]}
                  >
                    <SubjectAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/ledger"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.FINANCE,
                    ]}
                  >
                    <FinanceLedgerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/mpesa"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.FINANCE,
                    ]}
                  >
                    <MPesaGatewayPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/directory"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                    ]}
                  >
                    <StaffDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/payroll"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.FINANCE,
                    ]}
                  >
                    <PayrollPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.LIBRARIAN,
                    ]}
                  >
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/permissions"
                element={
                  <ProtectedRoute
                    allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}
                  >
                    <AccessControlPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-schools"
                element={
                  <ProtectedRoute>
                    <MySchoolsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <SupportPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy Redirects for Cached Links */}
              <Route
                path="/lms"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.ADMIN,
                      ROLES.TEACHER,
                      ROLES.STUDENT,
                      ROLES.PARENT,
                    ]}
                  >
                    <LMSPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={<Navigate to="/fees" replace />}
              />
              <Route
                path="/hr"
                element={<Navigate to="/hr/directory" replace />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <FloatingContact />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
