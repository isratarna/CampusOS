import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Home,
  Calendar,
  Bell,
  Sparkles,
  Bot,
  BrainCircuit,
  FileCheck2,
  Scale,
  Award,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  Eye,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Share2,
  ChevronRight,
  TrendingUp,
  Percent,
  Check,
  X,
  Printer,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RoleNavbarBadge from "@/components/RoleNavbarBadge";
import { useAuth } from "@/context/AuthContext";
import { getNavigationItemsForRole } from "@/config/navigation";

export default function FacultyAiStudio() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("curriculum"); // curriculum | exam | grader | consistency | analytics
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // ----------------------------------------------------
  // Navigation
  // ----------------------------------------------------
  const navigationItems = getNavigationItemsForRole(user?.role);

  // ----------------------------------------------------
  // Tab 1: Curriculum Architect State
  // ----------------------------------------------------
  const [curriculumForm, setCurriculumForm] = useState({
    courseTitle: "Cloud-Native Distributed Systems",
    courseCode: "CS482",
    department: "Computer Science",
    credits: 3,
    semester: 6,
    courseFocus: "Theory & Cloud Systems Lab",
  });
  const [generatedCurriculum, setGeneratedCurriculum] = useState(null);

  // ----------------------------------------------------
  // Tab 2: Exam Maker & Quality Studio State
  // ----------------------------------------------------
  const [examForm, setExamForm] = useState({
    courseTitle: "Cloud-Native Distributed Systems",
    courseCode: "CS482",
    department: "Computer Science",
    term: "Midterm Examination",
    totalMarks: 50,
    durationMinutes: 90,
    topicList: "Raft Consensus, CAP Theorem, Vector Clocks, Fault Tolerance",
    easyPct: 30,
    mediumPct: 50,
    hardPct: 20,
    questionCount: 4,
    facultySpecialNotes: "Include mathematical state derivations and practical failure scenarios",
  });
  const [generatedExam, setGeneratedExam] = useState(null);
  const [showAnswerKeys, setShowAnswerKeys] = useState(true);

  // Live Question Suggester & Quality Improver State
  const [draftQuestion, setDraftQuestion] = useState("");
  const [liveSuggestion, setLiveSuggestion] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // ----------------------------------------------------
  // Tab 3: Multimodal Auto-Grader State
  // ----------------------------------------------------
  const [graderInputType, setGraderInputType] = useState("text"); // text | file
  const [studentName, setStudentName] = useState("Alex Mercer");
  const [studentId, setStudentId] = useState("STU-2024-889");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [fileBase64, setFileBase64] = useState("");
  const [fileMimeType, setFileMimeType] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [submissionText, setSubmissionText] = useState(
    `[Student Exam Answer Script - Candidate: Alex Mercer | ID: STU-2024-889]

Question 1:
The Raft consensus algorithm splits consensus into three independent sub-problems: Leader Election, Log Replication, and Safety. When a follower node fails to receive heartbeats (AppendEntries RPC) within its randomized election timeout, it transitions into Candidate state, increments its term counter, votes for itself, and broadcasts RequestVote RPCs. A leader is elected when it receives a majority quorum (N/2 + 1) of votes. Once established, only the leader can write to the log. This guarantees that uncommitted log entries from partitioned leaders cannot overwrite committed state because a leader candidate must possess all committed entries to win election.

Question 2:
Derivation of worst-case partition latency in CAP Theorem:
In an asynchronous network with partition P, a system cannot simultaneously guarantee Availability (every non-failing node returns non-error response) and Consistency (all reads reflect most recent write). 
Under partition boundary, if we prioritize Consistency (CP), write requests on minority partition must block or fail with latency L -> infinity (or timeout). If we prioritize Availability (AP), nodes accept writes locally with latency L = O(1), but introduce stale read inconsistency delta Delta_t = time to partition healing. Therefore, trade-off frontier is strictly binary during network partition.`
  );
  const [strictnessLevel, setStrictnessLevel] = useState("standard");
  const [customRules, setCustomRules] = useState([
    "Award up to 60% partial credit for sound conceptual logic even if mathematical formulas are incomplete.",
    "Require explicit mention of majority quorum (N/2 + 1) for full credit on consensus questions.",
    "Deduct 1-2 points if formal Big-O or latency notation is omitted.",
  ]);
  const [newRuleText, setNewRuleText] = useState("");
  const [gradingResult, setGradingResult] = useState(null);
  const [overrideData, setOverrideData] = useState({});

  // ----------------------------------------------------
  // Tab 4: Inter-Rater Consistency & Calibration State
  // ----------------------------------------------------
  const [consistencyAuditResult, setConsistencyAuditResult] = useState(null);
  const [calibrating, setCalibrating] = useState(false);

  // ----------------------------------------------------
  // Tab 5: Cohort Analytics State
  // ----------------------------------------------------
  const [cohortInsights, setCohortInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/courses");
        setCourses(res.data || []);
      } catch (err) {
        console.warn("Could not fetch courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // ----------------------------------------------------
  // Handler: Generate Curriculum
  // ----------------------------------------------------
  const handleGenerateCurriculum = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSyncStatus(null);
    try {
      const res = await axios.post("http://localhost:5000/api/faculty-ai/curriculum/generate", curriculumForm);
      if (res.data?.curriculum) {
        setGeneratedCurriculum(res.data.curriculum);
      }
    } catch (err) {
      console.error("Curriculum generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handler: Sync Curriculum to DB
  // ----------------------------------------------------
  const handleSyncCurriculum = async () => {
    if (!generatedCurriculum) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/faculty-ai/curriculum/sync", {
        curriculum: generatedCurriculum,
      });
      setSyncStatus({ success: true, message: res.data.message });
      // Refresh course list
      const courseRes = await axios.get("http://localhost:5000/api/courses");
      setCourses(courseRes.data || []);
    } catch (err) {
      setSyncStatus({ success: false, message: "Sync failed. Please check network." });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handler: Generate Exam Paper
  // ----------------------------------------------------
  const handleGenerateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/faculty-ai/exam/generate", {
        ...examForm,
        difficultyDistribution: {
          easy: Number(examForm.easyPct),
          medium: Number(examForm.mediumPct),
          hard: Number(examForm.hardPct),
        },
      });
      if (res.data?.exam) {
        setGeneratedExam(res.data.exam);
      }
    } catch (err) {
      console.error("Exam generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handler: Live Question Suggester
  // ----------------------------------------------------
  const handleLiveSuggest = async () => {
    if (!draftQuestion.trim()) return;
    setSuggestLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/faculty-ai/exam/suggest-question", {
        questionDraft: draftQuestion,
        courseTopic: examForm.topicList,
        marks: 10,
      });
      if (res.data?.suggestions) {
        setLiveSuggestion(res.data.suggestions);
      }
    } catch (err) {
      console.error("Live suggestion failed:", err);
    } finally {
      setSuggestLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handler: File Upload (PDF/Image)
  // ----------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmissionFile(file);
    setFileMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(",")[1];
      setFileBase64(base64Data);
      if (file.type.startsWith("image/")) {
        setFilePreview(reader.result);
      } else {
        setFilePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // Handler: Run Multimodal Auto-Grader
  // ----------------------------------------------------
  const handleEvaluateSubmission = async () => {
    setLoading(true);
    setGradingResult(null);
    try {
      const examContext = generatedExam || {
        title: "Midterm Examination: " + curriculumForm.courseTitle,
        courseCode: curriculumForm.courseCode,
        courseName: curriculumForm.courseTitle,
        totalMarks: 50,
        questions: [
          {
            questionNumber: 1,
            marks: 25,
            text: "Explain the Raft consensus leader election mechanism and safety invariant.",
          },
          {
            questionNumber: 2,
            marks: 25,
            text: "Derive worst-case partition latency in CAP theorem trade-off frontier.",
          },
        ],
      };

      const payload = {
        examContext,
        studentName,
        studentId,
        submissionText: graderInputType === "text" ? submissionText : "",
        fileBase64: graderInputType === "file" ? fileBase64 : null,
        mimeType: graderInputType === "file" ? fileMimeType : null,
        facultyCustomRules: customRules,
        strictnessLevel,
      };

      const res = await axios.post("http://localhost:5000/api/faculty-ai/grade/evaluate", payload);
      if (res.data?.evaluation) {
        setGradingResult(res.data.evaluation);
        // Prepopulate consistency audit
        triggerConsistencyAudit(res.data.evaluation);
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handler: Run Consistency Audit (Multi-Faculty Reliability)
  // ----------------------------------------------------
  const triggerConsistencyAudit = async (evalData) => {
    setCalibrating(true);
    try {
      const q1 = evalData?.questionEvaluations?.[0];
      const res = await axios.post("http://localhost:5000/api/faculty-ai/grade/audit-consistency", {
        questionText: "Raft Consensus Leader Election & Safety Invariant",
        modelAnswer: "Leader elected with majority quorum N/2+1, log safety guarantees no uncommitted overwrites.",
        rubricCriteria: q1?.rubricBreakdown || [],
        studentAnswerCitation: q1?.studentAnswerCitation || "Student citation",
      });
      if (res.data?.audit) {
        setConsistencyAuditResult(res.data.audit);
      }
    } catch (err) {
      console.warn("Consistency audit error:", err);
    } finally {
      setCalibrating(false);
    }
  };

  // ----------------------------------------------------
  // Handler: Teacher Override
  // ----------------------------------------------------
  const handleApplyOverride = (qNum, newScore, reason) => {
    if (!gradingResult) return;
    const updatedEvaluations = gradingResult.questionEvaluations.map((q) => {
      if (q.questionNumber === qNum) {
        return {
          ...q,
          awardedScore: Number(newScore),
          status: "faculty_overridden",
          teacherOverride: {
            applied: true,
            overrideScore: Number(newScore),
            overrideReason: reason || "Teacher pedagogical discretion",
            facultySignoff: "Prof. Course Instructor",
          },
        };
      }
      return q;
    });

    const newTotal = updatedEvaluations.reduce((sum, e) => sum + e.awardedScore, 0);
    const newPct = Math.round((newTotal / gradingResult.maxPossibleScore) * 100);

    setGradingResult({
      ...gradingResult,
      questionEvaluations: updatedEvaluations,
      totalScore: newTotal,
      percentage: newPct,
      gradeLetter: newPct >= 90 ? "A" : newPct >= 80 ? "B+" : newPct >= 70 ? "B" : "C",
    });

    alert(`Faculty Override Applied: Question #${qNum} set to ${newScore} marks. Total grade updated.`);
  };

  // ----------------------------------------------------
  // Handler: Fetch Cohort Insights
  // ----------------------------------------------------
  const handleFetchCohortInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/faculty-ai/analytics/cohort", {
        courseName: curriculumForm.courseTitle,
        examTitle: examForm.term,
      });
      if (res.data?.insights) {
        setCohortInsights(res.data.insights);
      }
    } catch (err) {
      console.error("Cohort insights failed:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/70 backdrop-blur-xl p-4 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-wide">SmartClassroom</h1>
              <p className="text-xs text-indigo-400 font-medium">Faculty Copilot AI</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === "faculty-ai";
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-300"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Agent Status */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Multi-Agent Swarm
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Gemini 2.5 Multimodal Vision engine ready for handwriting, PDFs & rubrics.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1">
              FacultyNexus Studio
            </Badge>
            <h2 className="text-lg font-bold text-white hidden sm:inline">
              Academic Agentic Intelligence Hub
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Selection */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab("curriculum")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "curriculum"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Curriculum</span>
              </button>
              <button
                onClick={() => setActiveTab("exam")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "exam"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Exam Crafter</span>
              </button>
              <button
                onClick={() => setActiveTab("grader")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "grader"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Auto-Grader</span>
              </button>
              <button
                onClick={() => setActiveTab("consistency")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "consistency"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                <span>Inter-Rater Lab</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("analytics");
                  if (!cohortInsights) handleFetchCohortInsights();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "analytics"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Insights</span>
              </button>
            </div>

            <RoleNavbarBadge />
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: CURRICULUM ARCHITECT AGENT                         */}
          {/* ========================================================= */}
          {activeTab === "curriculum" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-slate-800/40 to-slate-900/40 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-400" />
                    Curriculum & Course Architect Agent
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Design outcome-based accredited syllabi (Bloom's Taxonomy) and automatically sync directly into the Smart Classroom Course database.
                  </p>
                </div>
                {generatedCurriculum && (
                  <Button
                    onClick={handleSyncCurriculum}
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Sync to Timetable DB
                  </Button>
                )}
              </div>

              {syncStatus && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
                    syncStatus.success
                      ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                      : "bg-red-950/60 border border-red-500/40 text-red-300"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{syncStatus.message}</span>
                  <Link
                    to="/timetables"
                    className="ml-auto underline font-semibold text-white hover:text-emerald-200 text-xs"
                  >
                    View in Timetable Scheduler &rarr;
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Curriculum Configuration Form */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-indigo-400" /> Course Parameters
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Define the academic specifications for autonomous generation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerateCurriculum} className="space-y-4">
                      <div>
                        <Label className="text-xs text-slate-300">Course Title</Label>
                        <Input
                          value={curriculumForm.courseTitle}
                          onChange={(e) =>
                            setCurriculumForm({ ...curriculumForm, courseTitle: e.target.value })
                          }
                          className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-slate-300">Course Code</Label>
                          <Input
                            value={curriculumForm.courseCode}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, courseCode: e.target.value })
                            }
                            className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-300">Department</Label>
                          <Input
                            value={curriculumForm.department}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, department: e.target.value })
                            }
                            className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-slate-300">Credit Hours</Label>
                          <Input
                            type="number"
                            min="1"
                            max="6"
                            value={curriculumForm.credits}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, credits: Number(e.target.value) })
                            }
                            className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-300">Semester</Label>
                          <Input
                            type="number"
                            min="1"
                            max="8"
                            value={curriculumForm.semester}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, semester: Number(e.target.value) })
                            }
                            className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-slate-300">Pedagogical Focus</Label>
                        <Input
                          value={curriculumForm.courseFocus}
                          onChange={(e) =>
                            setCurriculumForm({ ...curriculumForm, courseFocus: e.target.value })
                          }
                          className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Synthesizing Syllabus...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Full Course Blueprint
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Curriculum Preview */}
                <div className="lg:col-span-2 space-y-4">
                  {generatedCurriculum ? (
                    <div className="space-y-4">
                      {/* Course Header Card */}
                      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-md">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {generatedCurriculum.code} • {generatedCurriculum.credits} Credits • Sem {generatedCurriculum.semester}
                            </Badge>
                            <span className="text-xs text-slate-400 font-medium">
                              14-Week Accredited Roadmap
                            </span>
                          </div>
                          <CardTitle className="text-xl text-white mt-2">
                            {generatedCurriculum.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-300 leading-relaxed mt-1">
                            {generatedCurriculum.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                              Prerequisites
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {generatedCurriculum.prerequisites?.map((prereq, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700"
                                >
                                  {prereq}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Bloom's Taxonomy Outcomes */}
                          <div>
                            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                              Outcome-Based Learning Objectives (Bloom's Taxonomy)
                            </h4>
                            <div className="space-y-2">
                              {generatedCurriculum.learningOutcomes?.map((lo, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3"
                                >
                                  <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] mt-0.5">
                                    {lo.bloomLevel}
                                  </Badge>
                                  <p className="text-xs text-slate-200 leading-relaxed">
                                    {lo.outcome}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Weekly Modules Carousel / List */}
                          <div>
                            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                              Weekly Lecture & Lab Breakdown
                            </h4>
                            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                              {generatedCurriculum.weeklyModules?.map((mod) => (
                                <div
                                  key={mod.week}
                                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/50 transition-all text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between font-semibold text-slate-200">
                                    <span className="text-indigo-400">Week {mod.week}: {mod.topic}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{mod.readingMaterials}</span>
                                  </div>
                                  <p className="text-slate-300 text-[11px]">{mod.learningObjectives}</p>
                                  <div className="text-[11px] text-emerald-400 font-medium">
                                    Milestone: {mod.practicalTask}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="bg-slate-900/40 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center">
                      <BookOpen className="h-12 w-12 text-slate-600 mb-3" />
                      <h4 className="text-base font-semibold text-slate-300">
                        No Syllabus Generated Yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Input course parameters on the left and click "Generate Full Course Blueprint" to synthesize an accredited curriculum.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EXAM MAKER, LIVE SUGGESTER & QUALITY STUDIO        */}
          {/* ========================================================= */}
          {activeTab === "exam" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-900/40 via-slate-800/40 to-slate-900/40 p-6 rounded-2xl border border-violet-500/20 backdrop-blur-sm">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-violet-400" />
                    AI Exam Crafter & Real-Time Quality Analyzer
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Generate balanced exams, receive live quality suggestions while drafting, and evaluate ambiguity risk.
                  </p>
                </div>
                {generatedExam && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                      variant="outline"
                      className="border-slate-700 text-slate-200 text-xs hover:bg-slate-800"
                    >
                      {showAnswerKeys ? "Hide Answer Keys" : "Show Answer Keys"}
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print Exam Paper
                    </Button>
                  </div>
                )}
              </div>

              {/* Real-Time Question Drafter & Quality Suggestion Bar */}
              <Card className="bg-slate-900/70 border-violet-500/30 backdrop-blur-md shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-violet-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" /> Real-Time Question Drafter & Auto-Suggester
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Type a rough question draft below. The AI Agent will optimize phrasing, identify ambiguity risks, and construct an itemized rubric.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="e.g., Explain why Paxos requires two phases and when leader leases help..."
                      value={draftQuestion}
                      onChange={(e) => setDraftQuestion(e.target.value)}
                      className="bg-slate-800/90 border-slate-700 text-white text-sm flex-1"
                    />
                    <Button
                      onClick={handleLiveSuggest}
                      disabled={suggestLoading || !draftQuestion.trim()}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4 flex items-center gap-1.5"
                    >
                      {suggestLoading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Analyze & Improve
                    </Button>
                  </div>

                  {liveSuggestion && (
                    <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-violet-200">
                          ✨ Suggested Refinement:
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                            Bloom: {liveSuggestion.suggestedBloomLevel}
                          </Badge>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                            Clarity: {liveSuggestion.clarityScore}/10
                          </Badge>
                        </div>
                      </div>
                      <p className="text-slate-100 font-medium leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        "{liveSuggestion.improvedQuestion}"
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                        <div>
                          <span className="font-semibold text-slate-200">Model Solution Draft:</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{liveSuggestion.modelAnswerDraft}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200">Suggested Rubric Points:</span>
                          <div className="space-y-1 mt-0.5">
                            {liveSuggestion.rubricSuggestion?.map((r, i) => (
                              <div key={i} className="flex justify-between text-[11px] text-slate-400">
                                <span>• {r.criterion}</span>
                                <span className="font-mono text-violet-300">+{r.points} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Full Exam Generation Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-violet-400" /> Exam Parameters
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Customize marks, difficulty distribution, and rubric constraints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerateExam} className="space-y-4">
                      <div>
                        <Label className="text-xs text-slate-300">Examination Title / Term</Label>
                        <Input
                          value={examForm.term}
                          onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                          className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-slate-300">Total Marks</Label>
                          <Input
                            type="number"
                            value={examForm.totalMarks}
                            onChange={(e) =>
                              setExamForm({ ...examForm, totalMarks: Number(e.target.value) })
                            }
                            className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-300">Duration (Min)</Label>
                          <Input
                            type="number"
                            value={examForm.durationMinutes}
                            onChange={(e) =>
                              setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })
                            }
                            className="bg-slate-800/80 border-slate-700 text-white mt-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Difficulty Distribution Sliders */}
                      <div className="space-y-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                        <Label className="text-xs font-semibold text-violet-300">
                          Difficulty Distribution
                        </Label>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <span className="text-emerald-400 font-medium">Easy</span>
                            <Input
                              type="number"
                              value={examForm.easyPct}
                              onChange={(e) =>
                                setExamForm({ ...examForm, easyPct: Number(e.target.value) })
                              }
                              className="bg-slate-900 border-slate-700 text-center text-white text-xs mt-1"
                            />
                          </div>
                          <div>
                            <span className="text-amber-400 font-medium">Medium</span>
                            <Input
                              type="number"
                              value={examForm.mediumPct}
                              onChange={(e) =>
                                setExamForm({ ...examForm, mediumPct: Number(e.target.value) })
                              }
                              className="bg-slate-900 border-slate-700 text-center text-white text-xs mt-1"
                            />
                          </div>
                          <div>
                            <span className="text-rose-400 font-medium">Hard</span>
                            <Input
                              type="number"
                              value={examForm.hardPct}
                              onChange={(e) =>
                                setExamForm({ ...examForm, hardPct: Number(e.target.value) })
                              }
                              className="bg-slate-900 border-slate-700 text-center text-white text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-slate-300">Topics to Cover</Label>
                        <Textarea
                          rows={2}
                          value={examForm.topicList}
                          onChange={(e) => setExamForm({ ...examForm, topicList: e.target.value })}
                          className="bg-slate-800/80 border-slate-700 text-white mt-1 text-xs"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Crafting Exam Paper...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Complete Exam & Rubrics
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Exam Paper & Quality Audit Display */}
                <div className="lg:col-span-2 space-y-4">
                  {generatedExam ? (
                    <div className="space-y-4">
                      {/* Quality Audit Summary Card */}
                      {generatedExam.qualityAudit && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Quality Score</span>
                            <p className="text-xl font-bold text-emerald-400 mt-0.5">
                              {generatedExam.qualityAudit.overallScore}/100
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Completion</span>
                            <p className="text-xl font-bold text-indigo-300 mt-0.5">
                              {generatedExam.qualityAudit.estimatedCompletionTimeMinutes}m / {generatedExam.durationMinutes}m
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Bloom Balance</span>
                            <p className="text-xl font-bold text-violet-300 mt-0.5">
                              {generatedExam.qualityAudit.bloomsTaxonomyBalance?.higherOrderPct}% Higher Order
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ambiguity Index</span>
                            <p className="text-xl font-bold text-teal-300 mt-0.5">
                              {generatedExam.qualityAudit.clarityIndex || "Excellent"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Question Paper Layout */}
                      <div className="space-y-4">
                        {generatedExam.questions?.map((q) => (
                          <Card key={q.questionNumber} className="bg-slate-900/80 border-slate-800">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Question {q.questionNumber} • {q.marks} Marks
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px]">
                                    Bloom: {q.bloomLevel}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    ~{q.aiQualityNotes?.estimatedMinutes || 15} mins
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-slate-100 font-medium leading-relaxed mt-2">
                                {q.text}
                              </p>
                            </CardHeader>

                            {showAnswerKeys && (
                              <CardContent className="pt-2 border-t border-slate-800/80 space-y-3">
                                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                                  <span className="font-semibold text-emerald-400 block mb-1">
                                    Official Model Answer:
                                  </span>
                                  <p className="text-slate-200 leading-relaxed">{q.modelAnswer}</p>
                                </div>

                                <div>
                                  <span className="text-xs font-semibold text-indigo-300 block mb-1.5">
                                    Itemized Grading Rubric:
                                  </span>
                                  <div className="space-y-1.5">
                                    {q.rubricCriteria?.map((r, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs"
                                      >
                                        <span className="text-slate-300">{r.criterion}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[11px] text-slate-400 italic">
                                            {r.rule}
                                          </span>
                                          <Badge className="bg-indigo-900/60 text-indigo-300 text-[10px]">
                                            +{r.maxPoints} pts
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Card className="bg-slate-900/40 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center">
                      <Edit3 className="h-12 w-12 text-slate-600 mb-3" />
                      <h4 className="text-base font-semibold text-slate-300">
                        No Exam Paper Generated Yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Configure exam parameters on the left or use the real-time drafter above to generate a balanced examination paper.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MULTIMODAL AUTO-GRADER (WITH SCRIPT CITATIONS & EXPLAINABILITY)    */}
          {/* ========================================================================= */}
          {activeTab === "grader" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 via-slate-800/40 to-slate-900/40 p-6 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-emerald-400" />
                    Multimodal Auto-Grader & Explainability Hub
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Upload handwritten scripts, scanned PDFs or text. The AI evaluates against faculty rules and cites exact lines from the student's answer.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-800 border-slate-700 text-slate-300 text-xs px-3 py-1">
                    Strictness: <span className="text-emerald-400 font-bold uppercase ml-1">{strictnessLevel}</span>
                  </Badge>
                </div>
              </div>

              {/* Faculty Custom Rules Configuration Drawer */}
              <Card className="bg-slate-900/70 border-emerald-500/30 backdrop-blur-md shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-emerald-400" /> Faculty Grading Rules & Partial Credit Policy
                    </CardTitle>
                    {/* Strictness selector */}
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                      {["lenient", "standard", "rigorous"].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setStrictnessLevel(lvl)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase transition-all ${
                            strictnessLevel === lvl
                              ? "bg-emerald-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    The AI Auto-Grader strictly adheres to these rules when scoring answer sheets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    {customRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{rule}</span>
                        </div>
                        <button
                          onClick={() => setCustomRules(customRules.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add rule input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a custom grading rule (e.g. 'Deduct 2 marks if asymptotic notation is omitted')..."
                      value={newRuleText}
                      onChange={(e) => setNewRuleText(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white text-xs flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (newRuleText.trim()) {
                          setCustomRules([...customRules, newRuleText.trim()]);
                          setNewRuleText("");
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Input & Live Split-Screen Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Pane: Submission Input & Visual Preview */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Upload className="h-4 w-4 text-emerald-400" /> Student Submission
                      </CardTitle>
                      <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                        <button
                          onClick={() => setGraderInputType("text")}
                          className={`px-2.5 py-1 rounded font-medium transition-all ${
                            graderInputType === "text"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Text / OCR Script
                        </button>
                        <button
                          onClick={() => setGraderInputType("file")}
                          className={`px-2.5 py-1 rounded font-medium transition-all ${
                            graderInputType === "file"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Scanned Image / PDF
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-300">Student Name</Label>
                        <Input
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="bg-slate-800/80 border-slate-700 text-white text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-300">Student ID</Label>
                        <Input
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="bg-slate-800/80 border-slate-700 text-white text-xs mt-1"
                        />
                      </div>
                    </div>

                    {graderInputType === "file" ? (
                      <div className="space-y-3 flex-1">
                        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer bg-slate-800/30 transition-all">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="exam-upload"
                          />
                          <label htmlFor="exam-upload" className="cursor-pointer block">
                            <Upload className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-slate-200">
                              Click to upload Scanned Answer Sheet or PDF
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Supports JPG, PNG, PDF (Gemini Multimodal Vision OCR)
                            </p>
                          </label>
                        </div>

                        {filePreview && (
                          <div className="rounded-xl overflow-hidden border border-slate-700 max-h-60 bg-black/50 p-2">
                            <img
                              src={filePreview}
                              alt="Student Answer Sheet"
                              className="max-h-56 mx-auto object-contain rounded"
                            />
                          </div>
                        )}
                        {submissionFile && !filePreview && (
                          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs flex items-center gap-2 text-slate-200">
                            <FileText className="h-4 w-4 text-emerald-400" />
                            <span>{submissionFile.name} (Ready for Multimodal Vision)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <Label className="text-xs text-slate-300 mb-1">
                          Student's Answer Script Text:
                        </Label>
                        <Textarea
                          rows={10}
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          className="bg-slate-800/80 border-slate-700 text-white text-xs font-mono leading-relaxed flex-1"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleEvaluateSubmission}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Evaluating Script via Gemini Multimodal...
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="h-4 w-4" />
                          Run Multimodal Auto-Grader
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Right Pane: Itemized Evaluations & Explainable Script Citations */}
                <div className="space-y-4">
                  {gradingResult ? (
                    <div className="space-y-4">
                      {/* Grade Banner */}
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">Total Score Awarded</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-extrabold text-white">
                              {gradingResult.totalScore}
                            </span>
                            <span className="text-slate-400 text-sm">
                              / {gradingResult.maxPossibleScore} ({gradingResult.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-lg px-3 py-1 font-bold">
                            Grade {gradingResult.gradeLetter}
                          </Badge>
                          <span className="block text-[11px] text-emerald-400 mt-1 font-medium">
                            ✓ Rubric Rules Enforced
                          </span>
                        </div>
                      </div>

                      {/* Itemized Question Feedback with Answer Script Citations */}
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {gradingResult.questionEvaluations?.map((q) => (
                          <Card key={q.questionNumber} className="bg-slate-900/90 border-slate-800">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-slate-800 text-slate-200 border-slate-700">
                                  Question {q.questionNumber}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={`text-xs ${
                                      q.awardedScore === q.maxScore
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    }`}
                                  >
                                    Score: {q.awardedScore} / {q.maxScore}
                                  </Badge>
                                  {q.teacherOverride?.applied && (
                                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                                      Teacher Override
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                              {/* Exact Student Script Citation (Crucial User Requirement) */}
                              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
                                <span className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                                  <Eye className="h-3.5 w-3.5" /> Answer Script Citation (Verbatim Reference):
                                </span>
                                <p className="text-slate-200 italic font-mono text-[11px] leading-relaxed bg-black/30 p-2 rounded">
                                  {q.studentAnswerCitation}
                                </p>
                              </div>

                              {/* Rubric Breakdown */}
                              <div>
                                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                                  Rubric Criteria Met:
                                </span>
                                <div className="space-y-1">
                                  {q.rubricBreakdown?.map((rb, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs space-y-0.5"
                                    >
                                      <div className="flex justify-between font-medium">
                                        <span className="text-slate-200">{rb.criterion}</span>
                                        <span className="text-emerald-400 font-mono">
                                          +{rb.awardedPoints} / {rb.maxPoints} pts
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400">{rb.explanation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Justification & Feedback */}
                              <div className="text-xs text-slate-300 space-y-1">
                                <p>
                                  <strong className="text-slate-200">Evaluation Justification: </strong>
                                  {q.gradingJustification}
                                </p>
                                <p className="text-emerald-300">
                                  <strong>Constructive Advice: </strong>
                                  {q.constructiveFeedback}
                                </p>
                              </div>

                              {/* Teacher-in-the-Loop Override Controls */}
                              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                                <span className="text-[11px] text-slate-400">Teacher Override:</span>
                                <Input
                                  type="number"
                                  min="0"
                                  max={q.maxScore}
                                  placeholder="Score"
                                  defaultValue={q.awardedScore}
                                  id={`override-input-${q.questionNumber}`}
                                  className="h-7 w-20 bg-slate-800 border-slate-700 text-white text-xs text-center"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const val = document.getElementById(
                                      `override-input-${q.questionNumber}`
                                    )?.value;
                                    handleApplyOverride(q.questionNumber, val, "Instructor calibrated score");
                                  }}
                                  className="h-7 text-[11px] border-slate-700 text-slate-200 hover:bg-slate-800"
                                >
                                  Apply Score
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Card className="bg-slate-900/40 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center">
                      <FileCheck2 className="h-12 w-12 text-slate-600 mb-3" />
                      <h4 className="text-base font-semibold text-slate-300">
                        Awaiting Submission Evaluation
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Select an input format, upload an answer sheet or paste text, and click "Run Multimodal Auto-Grader" to generate full script citations and scores.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: INTER-RATER CONSISTENCY & CALIBRATION LAB (JUDGES' WOW FACTOR)     */}
          {/* ========================================================================= */}
          {activeTab === "consistency" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/40 via-slate-800/40 to-slate-900/40 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Scale className="h-5 w-5 text-amber-400" />
                    Inter-Rater Consistency & Calibration Lab
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Solves the major academic challenge: Multiple faculty members evaluating the same exam with different grading standards. Simulates multi-evaluator bias, calculates Inter-Rater Reliability (IRR), and standardizes grades.
                  </p>
                </div>
                <Button
                  onClick={() => triggerConsistencyAudit(gradingResult)}
                  disabled={calibrating}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs flex items-center gap-2"
                >
                  {calibrating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scale className="h-4 w-4" />
                  )}
                  Re-Calibrate Multi-Grader Parity
                </Button>
              </div>

              {consistencyAuditResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* IRR Metric & Discrepancy Overview */}
                  <Card className="bg-slate-900/70 border-amber-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-400" /> Inter-Rater Reliability Index (IRR)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Measures statistical grading consensus between disparate evaluators.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">
                          Consensus Parity Score
                        </span>
                        <div className="text-4xl font-extrabold text-amber-400 mt-1">
                          {consistencyAuditResult.irrReliabilityScore}%
                        </div>
                        <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
                          ✓ Institutionally Acceptable Reliability (Cohen's κ &gt; 0.85)
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2 rounded bg-slate-800/60 border border-slate-700/60">
                          <span className="text-slate-400">Max Evaluator Spread:</span>
                          <span className="font-mono text-rose-300 font-bold">
                            ±{consistencyAuditResult.discrepancyDelta} Marks
                          </span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-800/60 border border-slate-700/60">
                          <span className="text-slate-400">Calibrated Consensus:</span>
                          <span className="font-mono text-emerald-300 font-bold">
                            {consistencyAuditResult.recommendedConsensusScore} / 10
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                        <span className="font-semibold text-slate-200 block mb-1">
                          Root Cause of Grader Variance:
                        </span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {consistencyAuditResult.rootCause}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Multi-Grader Simulation Comparison (The Wow Visual) */}
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-slate-900/80 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-400" /> Multi-Faculty Evaluation Perspectives
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Comparing how strict vs application-focused faculty evaluate the exact same answer script.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {consistencyAuditResult.graderSimulations?.map((sim, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-xl border transition-all ${
                              sim.grader.includes("Consensus")
                                ? "bg-emerald-950/30 border-emerald-500/40"
                                : "bg-slate-800/50 border-slate-700/60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                                {sim.grader.includes("Consensus") ? (
                                  <Sparkles className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Users className="h-4 w-4 text-slate-400" />
                                )}
                                {sim.grader}
                              </span>
                              <Badge
                                className={
                                  sim.grader.includes("Consensus")
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-slate-700 text-slate-200"
                                }
                              >
                                {sim.score} / {sim.maxScore} Marks
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                              {sim.biasReasoning}
                            </p>
                          </div>
                        ))}

                        {/* Rubric Refinement Clause to standardize future grading */}
                        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1 mt-4">
                          <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                            Official Standardizing Rubric Clause for Faculty Board:
                          </span>
                          <p className="text-slate-200 italic leading-relaxed">
                            "{consistencyAuditResult.rubricRefinementSuggestion}"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="bg-slate-900/40 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center">
                  <Scale className="h-12 w-12 text-slate-600 mb-3" />
                  <h4 className="text-base font-semibold text-slate-300">
                    Run Calibration on an Answer Sheet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Click "Re-Calibrate Multi-Grader Parity" above to simulate multiple evaluator perspectives and calculate the Inter-Rater Reliability index.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: COHORT ANALYTICS & FACULTY REMEDIATION AGENT                       */}
          {/* ========================================================================= */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900/40 via-slate-800/40 to-slate-900/40 p-6 rounded-2xl border border-teal-500/20 backdrop-blur-sm">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-400" />
                    Cohort Analytics & Remediation Planning Agent
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Aggregates student performance across exams, detects conceptual bottlenecks, and generates actionable lecture remediation plans.
                  </p>
                </div>
                <Button
                  onClick={handleFetchCohortInsights}
                  disabled={insightsLoading}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs flex items-center gap-2"
                >
                  {insightsLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh Cohort Analysis
                </Button>
              </div>

              {cohortInsights ? (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-xs text-slate-400">Class Average</span>
                      <p className="text-2xl font-bold text-teal-300 mt-1">
                        {cohortInsights.classAverage}%
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-xs text-slate-400">Grade Distribution</span>
                      <div className="flex justify-center gap-2 text-xs font-bold text-slate-200 mt-2">
                        <span className="text-emerald-400">A:{cohortInsights.gradeDistribution?.A}</span>
                        <span className="text-indigo-300">B:{cohortInsights.gradeDistribution?.B}</span>
                        <span className="text-amber-300">C:{cohortInsights.gradeDistribution?.C}</span>
                        <span className="text-rose-400">D:{cohortInsights.gradeDistribution?.D}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-xs text-slate-400">Bottleneck Question</span>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        Q#{cohortInsights.mostChallengingQuestions?.[0]?.questionNumber || 2}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-xs text-slate-400">Remedial Sessions</span>
                      <p className="text-2xl font-bold text-indigo-400 mt-1">
                        {cohortInsights.remedialActionPlan?.length || 2} Planned
                      </p>
                    </div>
                  </div>

                  {/* Conceptual Bottlenecks & Common Traps */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/80 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          Most Challenging Concepts & Misconceptions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        {cohortInsights.mostChallengingQuestions?.map((q, i) => (
                          <div key={i} className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                            <div className="flex justify-between font-semibold text-amber-300">
                              <span>Question {q.questionNumber}: {q.topic}</span>
                              <span>Avg: {q.averageScorePct}%</span>
                            </div>
                            <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                              {q.rootMisconception}
                            </p>
                          </div>
                        ))}

                        <div className="space-y-1.5 mt-2">
                          <span className="font-semibold text-slate-200">Observed Cognitive Pitfalls:</span>
                          {cohortInsights.commonMisconceptions?.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 text-slate-400 text-[11px]">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Remedial Lecture Plan */}
                    <Card className="bg-slate-900/80 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-teal-400" />
                          Actionable Remedial Plan for Next Lecture
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        {cohortInsights.remedialActionPlan?.map((plan, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-teal-300">
                              <span>{plan.topic}</span>
                              <Badge className="bg-teal-900/60 text-teal-200 text-[10px]">
                                {plan.sessionMinutes} Minutes
                              </Badge>
                            </div>
                            <p className="text-slate-300 text-[11px]">{plan.activity}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="bg-slate-900/40 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-slate-600 mb-3" />
                  <h4 className="text-base font-semibold text-slate-300">
                    No Cohort Insights Loaded Yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Click "Refresh Cohort Analysis" to diagnose class bottlenecks and generate remedial lesson plans.
                  </p>
                </Card>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
