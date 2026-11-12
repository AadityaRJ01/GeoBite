import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Compass } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-50/60 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-900 to-forest-800 flex items-center justify-center shadow-lg border border-teal-500/30 animate-pulse mb-4">
          <Compass className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-forest-900">Verifying authentication session...</p>
        <p className="text-xs text-slate-500 mt-1">Please wait a moment</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
