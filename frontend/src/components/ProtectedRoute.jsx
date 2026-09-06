import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Verifying credentials & academic role...</p>
      </div>
    );
  }

  // Not logged in -> redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role checking
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current role <span className="font-semibold text-rose-400 capitalize">({user.role})</span> does not have authorization to view this module.
            Required role: <span className="font-semibold text-blue-400">{allowedRoles.join(" or ")}</span>.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => window.location.href = "/login"}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs h-9"
            >
              Switch Role or Log In as Authorized User
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
