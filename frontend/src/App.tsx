import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkillSprintPage } from './pages/SkillSprintPage';
import { PassportPage } from './pages/PassportPage';
import { ProofTasksPage } from './pages/ProofTasksPage';
import { MentorPage } from './pages/MentorPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { JobsPage } from './pages/JobsPage';
import { InterviewPage } from './pages/InterviewPage';
import { ResumeStudioPage } from './pages/ResumeStudioPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { RecruiterPage } from './pages/RecruiterPage';
import { CollegePage } from './pages/CollegePage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { WizardPage } from './pages/WizardPage';
import { AssessmentResultPage } from './pages/AssessmentResultPage';
import { AssessmentHistoryPage } from './pages/AssessmentHistoryPage';
import { SharedAssessmentPage } from './pages/SharedAssessmentPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public marketing & auth */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Public inspection for shared assessments & passports */}
              <Route path="/shared/assessments/:id" element={<SharedAssessmentPage />} />
              <Route path="/passport/view/:token" element={<PassportPage />} />

              {/* Protected Student Workspace */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sprint"
                element={
                  <ProtectedRoute>
                    <SkillSprintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/passport"
                element={
                  <ProtectedRoute>
                    <PassportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <ProofTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor"
                element={
                  <ProtectedRoute>
                    <MentorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <ProtectedRoute>
                    <RoadmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <JobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview"
                element={
                  <ProtectedRoute>
                    <InterviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-studio"
                element={
                  <ProtectedRoute>
                    <ResumeStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wizard"
                element={
                  <ProtectedRoute>
                    <WizardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessments/:id"
                element={
                  <ProtectedRoute>
                    <AssessmentResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <AssessmentHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Recruiter & College Portals */}
              <Route
                path="/recruiter"
                element={
                  <ProtectedRoute>
                    <RecruiterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/college"
                element={
                  <ProtectedRoute>
                    <CollegePage />
                  </ProtectedRoute>
                }
              />

              {/* System Diagnostics & Health */}
              <Route
                path="/diagnostics"
                element={
                  <ProtectedRoute>
                    <DiagnosticsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
