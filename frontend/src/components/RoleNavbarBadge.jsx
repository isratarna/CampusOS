import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  LogOut,
  UserCheck,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RoleNavbarBadge() {
  const { user, logout, quickSwitchDemoUser } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Link to="/login">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8">
          Sign In
        </Button>
      </Link>
    );
  }

  const roleStyles = {
    admin: {
      color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
      label: "Admin / Dean",
    },
    faculty: {
      color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-400" />,
      label: "Faculty",
    },
    student: {
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />,
      label: "Student",
    },
  };

  const currentRole = roleStyles[user.role] || roleStyles.faculty;

  return (
    <div className="flex items-center gap-2.5">
      {/* Current User Badge */}
      <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1 shadow-inner">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
          {user.name}
        </span>
        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 gap-1 ${currentRole.color}`}>
          {currentRole.icon}
          <span>{currentRole.label}</span>
        </Badge>
      </div>

      {/* Quick Switch Demo Role Buttons */}
      <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80 text-[11px]">
        <span className="text-slate-500 px-1 text-[10px] font-semibold">Switch:</span>
        <button
          onClick={() => quickSwitchDemoUser("admin")}
          title="Switch to Admin Demo"
          className={`px-1.5 py-0.5 rounded transition-colors ${
            user.role === "admin"
              ? "bg-amber-500/20 text-amber-300 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Admin
        </button>
        <button
          onClick={() => quickSwitchDemoUser("faculty")}
          title="Switch to Faculty Demo"
          className={`px-1.5 py-0.5 rounded transition-colors ${
            user.role === "faculty"
              ? "bg-blue-500/20 text-blue-300 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Faculty
        </button>
        <button
          onClick={() => quickSwitchDemoUser("student")}
          title="Switch to Student Demo"
          className={`px-1.5 py-0.5 rounded transition-colors ${
            user.role === "student"
              ? "bg-emerald-500/20 text-emerald-300 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Student
        </button>
      </div>

      {/* Logout button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          logout();
          navigate("/login");
        }}
        title="Log Out"
        className="h-8 px-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs"
      >
        <LogOut className="w-3.5 h-3.5 mr-1" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
}
