import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// 13 Application Pages
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

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-navy-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* 1. Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* 2. MetaMask Wallet Authentication */}
                <Route path="/login" element={<LoginPage />} />

                {/* 3. Operational Dashboard */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* 4. Missing Person Cases Directory */}
                <Route path="/cases" element={<CasesPage />} />

                {/* 5. Case Detail Dossier & Evidence Management */}
                <Route path="/cases/:id" element={<CaseDetailPage />} />

                {/* 6. Sighting Submission & Review Queue */}
                <Route path="/sightings" element={<SightingSubmitPage />} />

                {/* 7. AI Matching & Correlation Engine */}
                <Route path="/ai-matching" element={<AIMatchingPage />} />

                {/* 8. Tactical Interactive Leaflet Map */}
                <Route path="/map" element={<MapSearchPage />} />

                {/* 9. Volunteer Search Operations */}
                <Route path="/volunteers" element={<VolunteerCoordinationPage />} />

                {/* 10. Blockchain Evidence Integrity Verification Lab */}
                <Route path="/blockchain" element={<BlockchainEvidencePage />} />

                {/* 11. Tamper-Evident Audit Trail */}
                <Route path="/audit" element={<AuditLogPage />} />

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
                <Route path="/settings" element={<SettingsPage />} />

                {/* Catch-all redirect to Landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
