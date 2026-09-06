import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  Check,
  Zap,
  School,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const { login, register, demoAccounts, quickSwitchDemoUser } = useAuth();
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("faculty");
  const [department, setDepartment] = useState("Computer Science");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);

  // Handle direct demo autofill
  const handleAutofillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemoRole(account.role);
    setError("");
  };

  // Instant 1-click login with demo account
  const handleOneClickLogin = async (account) => {
    setIsSubmitting(true);
    setError("");
    try {
      await quickSwitchDemoUser(account.role);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to login with demo account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standard form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (isRegisterMode) {
        await register({
          name,
          email,
          password,
          role,
          department,
        });
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[20%] w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand & Demo Accounts One-Click Bar */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25 border border-blue-400/30">
              <School className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Smart Classroom OS
              </h1>
              <p className="text-xs text-blue-400 font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" /> Multi-Role Access Control & Agentic AI
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Enterprise Role-Based Academic Suite
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Select your role or click any demo profile below for instantaneous 1-click login and full system preview.
            </p>
          </div>

          {/* Demo Account Cards for Quick Autofill & 1-Click Login */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Zap className="w-4 h-4 fill-blue-400" /> One-Click Demo Role Accounts
              </span>
              <span className="text-slate-500">Instant Access</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {demoAccounts.map((acc) => {
                const isCurrentAutofilled = selectedDemoRole === acc.role;
                const roleBadgeColor =
                  acc.role === "admin"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : acc.role === "faculty"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

                return (
                  <div
                    key={acc.role}
                    className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isCurrentAutofilled
                        ? "bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 mt-0.5">
                          {acc.role === "admin" && <ShieldCheck className="w-5 h-5 text-amber-400" />}
                          {acc.role === "faculty" && <Sparkles className="w-5 h-5 text-blue-400" />}
                          {acc.role === "student" && <GraduationCap className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors">
                              {acc.name}
                            </span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${roleBadgeColor}`}>
                              {acc.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{acc.email}</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">{acc.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 items-end">
                        <Button
                          size="sm"
                          type="button"
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-2.5 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOneClickLogin(acc);
                          }}
                          disabled={isSubmitting}
                        >
                          Quick Login <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleAutofillDemo(acc)}
                          className="text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors"
                        >
                          Fill Inputs
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-6">
          <Card className="bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">
                  {isRegisterMode ? "Create Academic Account" : "Welcome Back"}
                </CardTitle>
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                  {isRegisterMode ? "New Member" : "Secure Sign-in"}
                </Badge>
              </div>
              <CardDescription className="text-slate-400 text-xs">
                {isRegisterMode
                  ? "Enter your credentials and select your campus role"
                  : "Sign in with your email or use a 1-click demo account on the left"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegisterMode && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Dr. John Nash"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Account Role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-md text-slate-200 px-2.5 h-9 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="faculty">Faculty Member</option>
                          <option value="admin">Administrator</option>
                          <option value="student">Student</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Department</label>
                        <Input
                          type="text"
                          placeholder="Computer Science"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 h-9 text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> University Email
                  </label>
                  <Input
                    type="email"
                    placeholder="name@smartclassroom.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
                    </label>
                    <span className="text-[11px] text-slate-500">Min 6 characters</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all duration-200 mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : isRegisterMode ? (
                    "Register Academic Account"
                  ) : (
                    "Sign In to Campus OS"
                  )}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {isRegisterMode ? "Already have an account?" : "Need a new account?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError("");
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {isRegisterMode ? "Sign in instead" : "Create one now"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
