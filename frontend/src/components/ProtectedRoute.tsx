import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role) && role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-navy-900 border border-amber-500/30 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-300 mb-4">
            This module requires authorization as{' '}
            <span className="font-semibold text-amber-300 uppercase">
              {allowedRoles.join(' or ')}
            </span>
            . Your current authenticated role is{' '}
            <span className="font-semibold text-cyan-300 uppercase">{role}</span>.
          </p>
          <div className="p-3 bg-navy-950 rounded-lg border border-navy-800 text-xs font-mono text-slate-400 mb-6 text-left">
            <div>User: {user?.full_name || 'Anonymous User'}</div>
            <div>Wallet: {user?.wallet_address}</div>
            <div>Permissions: Public / Volunteer Clearance</div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-navy-800 hover:bg-navy-700 text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <Link
              to="/login"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <LogIn className="w-3.5 h-3.5" /> Switch Role
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
