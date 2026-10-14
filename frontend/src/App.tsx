import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Application Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { SightingSubmitPage } from './pages/SightingSubmitPage';
import { AIMatchingPage } from './pages/AIMatchingPage';
import { MapSearchPage } from './pages/MapSearchPage';
import { VolunteerCoordinationPage } from './pages/VolunteerCoordinationPage';
import { BlockchainEvidencePage } from './pages/BlockchainEvidencePage';
import { AuditLogPage } from './pages/AuditLogPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-navy-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* 1. Primary Entry: Sign In page with MetaMask login first */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          {/* 2. Direct Sign In route */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          {/* 3. Operational Dashboard (comes after MetaMask login) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 4. Missing Person Cases Directory */}
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <CasesPage />
              </ProtectedRoute>
            }
          />

          {/* 5. Case Detail Dossier & Evidence Management */}
          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute>
                <CaseDetailPage />
              </ProtectedRoute>
            }
          />

          {/* 6. Sighting Submission & Review Queue */}
          <Route
            path="/sightings"
            element={
              <ProtectedRoute>
                <SightingSubmitPage />
              </ProtectedRoute>
            }
          />

          {/* 7. AI Matching & Correlation Engine */}
          <Route
            path="/ai-matching"
            element={
              <ProtectedRoute>
                <AIMatchingPage />
              </ProtectedRoute>
            }
          />

          {/* 8. Tactical Interactive Leaflet Map */}
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapSearchPage />
              </ProtectedRoute>
            }
          />

          {/* 9. Volunteer Search Operations */}
          <Route
            path="/volunteers"
            element={
              <ProtectedRoute>
                <VolunteerCoordinationPage />
              </ProtectedRoute>
            }
          />

          {/* 10. Blockchain Evidence Integrity Verification Lab */}
          <Route
            path="/blockchain"
            element={
              <ProtectedRoute>
                <BlockchainEvidencePage />
              </ProtectedRoute>
            }
          />

          {/* 11. Tamper-Evident Audit Trail */}
          <Route
            path="/audit"
            element={
              <ProtectedRoute>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* 12. Personnel & Role Management (Admin / Investigator) */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin', 'investigator']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          {/* 13. System Architecture & Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Public Platform Overview / Architecture */}
          <Route path="/about" element={<LandingPage />} />

          {/* Catch-all redirect to / (Sign In page) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
