import React, { useState } from "react";
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
import { PageHeader, ViewTabs } from "@/components/app/PageHeader";
import { StatusTag } from "@/components/app/primitives";
import { useCampus } from "@/components/app/CampusProvider";
import { api, apiError } from "@/lib/api";

/* ============================================================
   Faculty AI Studio.

   Five agents over one course: draft the curriculum, build the
   exam, grade the scripts, audit that grading for drift, then
   read the cohort back. It renders inside the ordinary app frame,
   so the rail, topbar and page header are the ones every other
   destination uses - only the body below the tabs is its own.
   ============================================================ */

/* Ids match the views on the faculty-ai entry in components/app/nav.js,
   so the rail sub-menu and ?view= deep links stay in step. */
const STUDIO_TABS = [
  { id: "curriculum", label: "Curriculum" },
  { id: "exam", label: "Exam crafter" },
  { id: "grader", label: "Auto-grader" },
  { id: "consistency", label: "Inter-rater" },
  { id: "analytics", label: "Insights" },
];

export default function FacultyAiStudio() {
  const { refresh } = useCampus();
  const [activeTab, setActiveTab] = useState("curriculum"); // curriculum | exam | grader | consistency | analytics
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

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

  // ----------------------------------------------------
  // Handler: Generate Curriculum
  // ----------------------------------------------------
  const handleGenerateCurriculum = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSyncStatus(null);
    try {
      const res = await api.post("/faculty-ai/curriculum/generate", curriculumForm);
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
      const res = await api.post("/faculty-ai/curriculum/sync", {
        curriculum: generatedCurriculum,
      });
      setSyncStatus({ success: true, message: res.data.message });
      // the catalogue, the dashboard totals and the rail all read one cache -
      // refresh it so a synced course appears everywhere at once
      refresh("courses");
    } catch (err) {
      setSyncStatus({ success: false, message: apiError(err, "Sync failed.") });
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
      const res = await api.post("/faculty-ai/exam/generate", {
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
      const res = await api.post("/faculty-ai/exam/suggest-question", {
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

      const res = await api.post("/faculty-ai/grade/evaluate", payload);
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
      const res = await api.post("/faculty-ai/grade/audit-consistency", {
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
      const res = await api.post("/faculty-ai/analytics/cohort", {
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
    <div className="space-y-7">
      <PageHeader
        navId="faculty-ai"
        actions={
          syncStatus ? (
            <StatusTag tone={syncStatus.success ? "green" : "red"}>{syncStatus.message}</StatusTag>
          ) : (
            <StatusTag tone="violet" icon={Sparkles}>
              Multimodal engine ready
            </StatusTag>
          )
        }
        tabs={
          <ViewTabs
            views={STUDIO_TABS}
            value={activeTab}
            onChange={(next) => {
              setActiveTab(next);
              if (next === "analytics" && !cohortInsights) handleFetchCohortInsights();
            }}
          />
        }
      />


          {/* ========================================================= */}
          {/* TAB 1: CURRICULUM ARCHITECT AGENT                         */}
          {/* ========================================================= */}
          {activeTab === "curriculum" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-md border border-violet/30">
                <div>
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet" />
                    Curriculum & Course Architect Agent
                  </h3>
                  <p className="text-sm text-mut mt-1">
                    Design outcome-based accredited syllabi (Bloom's Taxonomy) and automatically sync directly into the Smart Classroom Course database.
                  </p>
                </div>
                {generatedCurriculum && (
                  <Button
                    onClick={handleSyncCurriculum}
                    disabled={loading}
                    className="text-ink shadow-paper flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Sync to Timetable DB
                  </Button>
                )}
              </div>

              {syncStatus && (
                <div
                  className={`p-4 rounded-md text-sm flex items-center gap-3 ${
                    syncStatus.success
                      ? "bg-green-soft border border-green/30 text-green"
                      : "bg-red-soft border border-red/30 text-red"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{syncStatus.message}</span>
                  <Link
                    to="/timetables"
                    className="ml-auto underline font-semibold text-ink hover:text-green text-xs"
                  >
                    View in Timetable Scheduler &rarr;
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Curriculum Configuration Form */}
                <Card className="bg-paper border-line shadow-paper">
                  <CardHeader>
                    <CardTitle className="text-base text-ink flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-violet" /> Course Parameters
                    </CardTitle>
                    <CardDescription className="text-xs text-mut">
                      Define the academic specifications for autonomous generation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerateCurriculum} className="space-y-4">
                      <div>
                        <Label className="text-xs text-mut">Course Title</Label>
                        <Input
                          value={curriculumForm.courseTitle}
                          onChange={(e) =>
                            setCurriculumForm({ ...curriculumForm, courseTitle: e.target.value })
                          }
                          className="bg-bone border-line text-ink mt-1 text-sm"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-mut">Course Code</Label>
                          <Input
                            value={curriculumForm.courseCode}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, courseCode: e.target.value })
                            }
                            className="bg-bone border-line text-ink mt-1 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-mut">Department</Label>
                          <Input
                            value={curriculumForm.department}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, department: e.target.value })
                            }
                            className="bg-bone border-line text-ink mt-1 text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-mut">Credit Hours</Label>
                          <Input
                            type="number"
                            min="1"
                            max="6"
                            value={curriculumForm.credits}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, credits: Number(e.target.value) })
                            }
                            className="bg-bone border-line text-ink mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-mut">Semester</Label>
                          <Input
                            type="number"
                            min="1"
                            max="8"
                            value={curriculumForm.semester}
                            onChange={(e) =>
                              setCurriculumForm({ ...curriculumForm, semester: Number(e.target.value) })
                            }
                            className="bg-bone border-line text-ink mt-1 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-mut">Pedagogical Focus</Label>
                        <Input
                          value={curriculumForm.courseFocus}
                          onChange={(e) =>
                            setCurriculumForm({ ...curriculumForm, courseFocus: e.target.value })
                          }
                          className="bg-bone border-line text-ink mt-1 text-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full text-ink font-medium py-2.5 rounded-md shadow-paper flex items-center justify-center gap-2"
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
                      <Card className="bg-paper border-line">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-violet-soft text-violet border border-violet/30">
                              {generatedCurriculum.code} • {generatedCurriculum.credits} Credits • Sem {generatedCurriculum.semester}
                            </Badge>
                            <span className="text-xs text-mut font-medium">
                              14-Week Accredited Roadmap
                            </span>
                          </div>
                          <CardTitle className="text-xl text-ink mt-2">
                            {generatedCurriculum.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-mut leading-relaxed mt-1">
                            {generatedCurriculum.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-violet uppercase tracking-wider mb-2">
                              Prerequisites
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {generatedCurriculum.prerequisites?.map((prereq, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-bone text-ink text-xs border border-line"
                                >
                                  {prereq}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Bloom's Taxonomy Outcomes */}
                          <div>
                            <h4 className="text-xs font-semibold text-violet uppercase tracking-wider mb-2">
                              Outcome-Based Learning Objectives (Bloom's Taxonomy)
                            </h4>
                            <div className="space-y-2">
                              {generatedCurriculum.learningOutcomes?.map((lo, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-md bg-bone border border-line flex items-start gap-3"
                                >
                                  <Badge className="bg-violet-soft text-violet border border-violet/30 text-[10px] mt-0.5">
                                    {lo.bloomLevel}
                                  </Badge>
                                  <p className="text-xs text-ink leading-relaxed">
                                    {lo.outcome}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Weekly Modules Carousel / List */}
                          <div>
                            <h4 className="text-xs font-semibold text-violet uppercase tracking-wider mb-2">
                              Weekly Lecture & Lab Breakdown
                            </h4>
                            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                              {generatedCurriculum.weeklyModules?.map((mod) => (
                                <div
                                  key={mod.week}
                                  className="p-3 rounded-md bg-bone border border-line hover:border-violet/30 transition-all text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between font-semibold text-ink">
                                    <span className="text-violet">Week {mod.week}: {mod.topic}</span>
                                    <span className="text-[10px] text-mut font-normal">{mod.readingMaterials}</span>
                                  </div>
                                  <p className="text-mut text-[11px]">{mod.learningObjectives}</p>
                                  <div className="text-[11px] text-green font-medium">
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
                    <Card className="bg-paper border-dashed border-line flex flex-col items-center justify-center p-12 text-center">
                      <BookOpen className="h-12 w-12 text-mut-2 mb-3" />
                      <h4 className="text-base font-semibold text-mut">
                        No Syllabus Generated Yet
                      </h4>
                      <p className="text-xs text-mut-2 max-w-sm mt-1">
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-md border border-violet/30">
                <div>
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-violet" />
                    AI Exam Crafter & Real-Time Quality Analyzer
                  </h3>
                  <p className="text-sm text-mut mt-1">
                    Generate balanced exams, receive live quality suggestions while drafting, and evaluate ambiguity risk.
                  </p>
                </div>
                {generatedExam && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                      variant="outline"
                      className="border-line text-ink text-xs hover:bg-bone"
                    >
                      {showAnswerKeys ? "Hide Answer Keys" : "Show Answer Keys"}
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      className="bg-violet hover:bg-violet/90 text-white text-xs flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print Exam Paper
                    </Button>
                  </div>
                )}
              </div>

              {/* Real-Time Question Drafter & Quality Suggestion Bar */}
              <Card className="bg-paper border-violet/30 shadow-paper">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-violet flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-deep" /> Real-Time Question Drafter & Auto-Suggester
                  </CardTitle>
                  <CardDescription className="text-xs text-mut">
                    Type a rough question draft below. The AI Agent will optimize phrasing, identify ambiguity risks, and construct an itemized rubric.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="e.g., Explain why Paxos requires two phases and when leader leases help..."
                      value={draftQuestion}
                      onChange={(e) => setDraftQuestion(e.target.value)}
                      className="bg-bone border-line text-ink text-sm flex-1"
                    />
                    <Button
                      onClick={handleLiveSuggest}
                      disabled={suggestLoading || !draftQuestion.trim()}
                      className="bg-violet hover:bg-violet/90 text-white text-xs px-4 flex items-center gap-1.5"
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
                    <div className="p-4 rounded-md bg-violet-soft border border-violet/30 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-violet">
                          ✨ Suggested Refinement:
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber/12 text-amber-deep border border-amber/30 text-[10px]">
                            Bloom: {liveSuggestion.suggestedBloomLevel}
                          </Badge>
                          <Badge className="bg-green-soft text-green border border-green/30 text-[10px]">
                            Clarity: {liveSuggestion.clarityScore}/10
                          </Badge>
                        </div>
                      </div>
                      <p className="text-ink font-medium leading-relaxed bg-paper p-2.5 rounded-lg border border-line">
                        "{liveSuggestion.improvedQuestion}"
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-mut">
                        <div>
                          <span className="font-semibold text-ink">Model Solution Draft:</span>
                          <p className="text-[11px] text-mut mt-0.5">{liveSuggestion.modelAnswerDraft}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-ink">Suggested Rubric Points:</span>
                          <div className="space-y-1 mt-0.5">
                            {liveSuggestion.rubricSuggestion?.map((r, i) => (
                              <div key={i} className="flex justify-between text-[11px] text-mut">
                                <span>• {r.criterion}</span>
                                <span className="font-mono text-violet">+{r.points} pts</span>
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
                <Card className="bg-paper border-line shadow-paper">
                  <CardHeader>
                    <CardTitle className="text-base text-ink flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-violet" /> Exam Parameters
                    </CardTitle>
                    <CardDescription className="text-xs text-mut">
                      Customize marks, difficulty distribution, and rubric constraints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerateExam} className="space-y-4">
                      <div>
                        <Label className="text-xs text-mut">Examination Title / Term</Label>
                        <Input
                          value={examForm.term}
                          onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                          className="bg-bone border-line text-ink mt-1 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-mut">Total Marks</Label>
                          <Input
                            type="number"
                            value={examForm.totalMarks}
                            onChange={(e) =>
                              setExamForm({ ...examForm, totalMarks: Number(e.target.value) })
                            }
                            className="bg-bone border-line text-ink mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-mut">Duration (Min)</Label>
                          <Input
                            type="number"
                            value={examForm.durationMinutes}
                            onChange={(e) =>
                              setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })
                            }
                            className="bg-bone border-line text-ink mt-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Difficulty Distribution Sliders */}
                      <div className="space-y-2 p-3 rounded-md bg-bone border border-line">
                        <Label className="text-xs font-semibold text-violet">
                          Difficulty Distribution
                        </Label>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <span className="text-green font-medium">Easy</span>
                            <Input
                              type="number"
                              value={examForm.easyPct}
                              onChange={(e) =>
                                setExamForm({ ...examForm, easyPct: Number(e.target.value) })
                              }
                              className="bg-paper border-line text-center text-ink text-xs mt-1"
                            />
                          </div>
                          <div>
                            <span className="text-amber-deep font-medium">Medium</span>
                            <Input
                              type="number"
                              value={examForm.mediumPct}
                              onChange={(e) =>
                                setExamForm({ ...examForm, mediumPct: Number(e.target.value) })
                              }
                              className="bg-paper border-line text-center text-ink text-xs mt-1"
                            />
                          </div>
                          <div>
                            <span className="text-red font-medium">Hard</span>
                            <Input
                              type="number"
                              value={examForm.hardPct}
                              onChange={(e) =>
                                setExamForm({ ...examForm, hardPct: Number(e.target.value) })
                              }
                              className="bg-paper border-line text-center text-ink text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-mut">Topics to Cover</Label>
                        <Textarea
                          rows={2}
                          value={examForm.topicList}
                          onChange={(e) => setExamForm({ ...examForm, topicList: e.target.value })}
                          className="bg-bone border-line text-ink mt-1 text-xs"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full text-ink font-medium py-2.5 rounded-md shadow-paper flex items-center justify-center gap-2"
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
                        <div className="p-4 rounded-md border border-violet/30 shadow-paper grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <span className="text-[10px] text-mut uppercase tracking-wider">Quality Score</span>
                            <p className="text-xl font-bold text-green mt-0.5">
                              {generatedExam.qualityAudit.overallScore}/100
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-mut uppercase tracking-wider">Est. Completion</span>
                            <p className="text-xl font-bold text-violet mt-0.5">
                              {generatedExam.qualityAudit.estimatedCompletionTimeMinutes}m / {generatedExam.durationMinutes}m
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-mut uppercase tracking-wider">Bloom Balance</span>
                            <p className="text-xl font-bold text-violet mt-0.5">
                              {generatedExam.qualityAudit.bloomsTaxonomyBalance?.higherOrderPct}% Higher Order
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-mut uppercase tracking-wider">Ambiguity Index</span>
                            <p className="text-xl font-bold text-green mt-0.5">
                              {generatedExam.qualityAudit.clarityIndex || "Excellent"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Question Paper Layout */}
                      <div className="space-y-4">
                        {generatedExam.questions?.map((q) => (
                          <Card key={q.questionNumber} className="bg-paper border-line">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-violet-soft text-violet border border-violet/30">
                                  Question {q.questionNumber} • {q.marks} Marks
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-violet-soft text-violet border border-violet/30 text-[10px]">
                                    Bloom: {q.bloomLevel}
                                  </Badge>
                                  <span className="text-xs text-mut">
                                    ~{q.aiQualityNotes?.estimatedMinutes || 15} mins
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-ink font-medium leading-relaxed mt-2">
                                {q.text}
                              </p>
                            </CardHeader>

                            {showAnswerKeys && (
                              <CardContent className="pt-2 border-t border-line space-y-3">
                                <div className="p-3 rounded-md bg-bone border border-line text-xs">
                                  <span className="font-semibold text-green block mb-1">
                                    Official Model Answer:
                                  </span>
                                  <p className="text-ink leading-relaxed">{q.modelAnswer}</p>
                                </div>

                                <div>
                                  <span className="text-xs font-semibold text-violet block mb-1.5">
                                    Itemized Grading Rubric:
                                  </span>
                                  <div className="space-y-1.5">
                                    {q.rubricCriteria?.map((r, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between p-2 rounded-lg bg-bone border border-line text-xs"
                                      >
                                        <span className="text-mut">{r.criterion}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[11px] text-mut italic">
                                            {r.rule}
                                          </span>
                                          <Badge className="bg-violet-soft text-violet text-[10px]">
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
                    <Card className="bg-paper border-dashed border-line flex flex-col items-center justify-center p-12 text-center">
                      <Edit3 className="h-12 w-12 text-mut-2 mb-3" />
                      <h4 className="text-base font-semibold text-mut">
                        No Exam Paper Generated Yet
                      </h4>
                      <p className="text-xs text-mut-2 max-w-sm mt-1">
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-md border border-green/30">
                <div>
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-green" />
                    Multimodal Auto-Grader & Explainability Hub
                  </h3>
                  <p className="text-sm text-mut mt-1">
                    Upload handwritten scripts, scanned PDFs or text. The AI evaluates against faculty rules and cites exact lines from the student's answer.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-bone border-line text-mut text-xs px-3 py-1">
                    Strictness: <span className="text-green font-bold uppercase ml-1">{strictnessLevel}</span>
                  </Badge>
                </div>
              </div>

              {/* Faculty Custom Rules Configuration Drawer */}
              <Card className="bg-paper border-green/30 shadow-paper">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-green flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-green" /> Faculty Grading Rules & Partial Credit Policy
                    </CardTitle>
                    {/* Strictness selector */}
                    <div className="flex items-center gap-1 bg-bone p-1 rounded-lg border border-line">
                      {["lenient", "standard", "rigorous"].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setStrictnessLevel(lvl)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase transition-all ${
                            strictnessLevel === lvl
                              ? "bg-green text-white shadow"
                              : "text-mut hover:text-ink"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CardDescription className="text-xs text-mut">
                    The AI Auto-Grader strictly adheres to these rules when scoring answer sheets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    {customRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-bone border border-line text-xs text-ink"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green shrink-0" />
                          <span>{rule}</span>
                        </div>
                        <button
                          onClick={() => setCustomRules(customRules.filter((_, i) => i !== idx))}
                          className="text-mut-2 hover:text-red p-1"
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
                      className="bg-bone border-line text-ink text-xs flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (newRuleText.trim()) {
                          setCustomRules([...customRules, newRuleText.trim()]);
                          setNewRuleText("");
                        }
                      }}
                      className="bg-green hover:bg-green/90 text-white text-xs px-3"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Input & Live Split-Screen Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Pane: Submission Input & Visual Preview */}
                <Card className="bg-paper border-line shadow-paper flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-ink flex items-center gap-2">
                        <Upload className="h-4 w-4 text-green" /> Student Submission
                      </CardTitle>
                      <div className="flex items-center gap-1 bg-bone p-1 rounded-lg border border-line text-xs">
                        <button
                          onClick={() => setGraderInputType("text")}
                          className={`px-2.5 py-1 rounded font-medium transition-all ${
                            graderInputType === "text"
                              ? "bg-violet text-white"
                              : "text-mut hover:text-ink"
                          }`}
                        >
                          Text / OCR Script
                        </button>
                        <button
                          onClick={() => setGraderInputType("file")}
                          className={`px-2.5 py-1 rounded font-medium transition-all ${
                            graderInputType === "file"
                              ? "bg-violet text-white"
                              : "text-mut hover:text-ink"
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
                        <Label className="text-xs text-mut">Student Name</Label>
                        <Input
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="bg-bone border-line text-ink text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-mut">Student ID</Label>
                        <Input
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="bg-bone border-line text-ink text-xs mt-1"
                        />
                      </div>
                    </div>

                    {graderInputType === "file" ? (
                      <div className="space-y-3 flex-1">
                        <div className="border-2 border-dashed border-line hover:border-green/30 rounded-md p-6 text-center cursor-pointer bg-bone transition-all">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="exam-upload"
                          />
                          <label htmlFor="exam-upload" className="cursor-pointer block">
                            <Upload className="h-8 w-8 text-green mx-auto mb-2" />
                            <p className="text-xs font-semibold text-ink">
                              Click to upload Scanned Answer Sheet or PDF
                            </p>
                            <p className="text-[10px] text-mut mt-1">
                              Supports JPG, PNG, PDF (Gemini Multimodal Vision OCR)
                            </p>
                          </label>
                        </div>

                        {filePreview && (
                          <div className="rounded-md overflow-hidden border border-line max-h-60 bg-black/50 p-2">
                            <img
                              src={filePreview}
                              alt="Student Answer Sheet"
                              className="max-h-56 mx-auto object-contain rounded"
                            />
                          </div>
                        )}
                        {submissionFile && !filePreview && (
                          <div className="p-3 rounded-md bg-bone border border-line text-xs flex items-center gap-2 text-ink">
                            <FileText className="h-4 w-4 text-green" />
                            <span>{submissionFile.name} (Ready for Multimodal Vision)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <Label className="text-xs text-mut mb-1">
                          Student's Answer Script Text:
                        </Label>
                        <Textarea
                          rows={10}
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          className="bg-bone border-line text-ink text-xs font-mono leading-relaxed flex-1"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleEvaluateSubmission}
                      disabled={loading}
                      className="w-full text-ink font-medium py-2.5 rounded-md shadow-paper flex items-center justify-center gap-2"
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
                      <div className="p-5 rounded-md border border-green/30 shadow-paper flex items-center justify-between">
                        <div>
                          <span className="text-xs text-mut">Total Score Awarded</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-extrabold text-ink">
                              {gradingResult.totalScore}
                            </span>
                            <span className="text-mut text-sm">
                              / {gradingResult.maxPossibleScore} ({gradingResult.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-soft text-green border border-green/30 text-lg px-3 py-1 font-bold">
                            Grade {gradingResult.gradeLetter}
                          </Badge>
                          <span className="block text-[11px] text-green mt-1 font-medium">
                            ✓ Rubric Rules Enforced
                          </span>
                        </div>
                      </div>

                      {/* Itemized Question Feedback with Answer Script Citations */}
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {gradingResult.questionEvaluations?.map((q) => (
                          <Card key={q.questionNumber} className="bg-paper border-line">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-bone text-ink border-line">
                                  Question {q.questionNumber}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={`text-xs ${
                                      q.awardedScore === q.maxScore
                                        ? "bg-green-soft text-green border-green/30"
                                        : "bg-amber/12 text-amber-deep border-amber/30"
                                    }`}
                                  >
                                    Score: {q.awardedScore} / {q.maxScore}
                                  </Badge>
                                  {q.teacherOverride?.applied && (
                                    <Badge className="bg-violet-soft text-violet border-violet/30 text-[10px]">
                                      Teacher Override
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                              {/* Exact Student Script Citation (Crucial User Requirement) */}
                              <div className="p-3 rounded-md bg-amber/12 border border-amber/30 text-xs">
                                <span className="font-semibold text-amber-deep flex items-center gap-1.5 mb-1">
                                  <Eye className="h-3.5 w-3.5" /> Answer Script Citation (Verbatim Reference):
                                </span>
                                <p className="text-ink italic font-mono text-[11px] leading-relaxed bg-black/30 p-2 rounded">
                                  {q.studentAnswerCitation}
                                </p>
                              </div>

                              {/* Rubric Breakdown */}
                              <div>
                                <span className="text-[11px] font-semibold text-mut block mb-1">
                                  Rubric Criteria Met:
                                </span>
                                <div className="space-y-1">
                                  {q.rubricBreakdown?.map((rb, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 rounded-lg bg-bone border border-line text-xs space-y-0.5"
                                    >
                                      <div className="flex justify-between font-medium">
                                        <span className="text-ink">{rb.criterion}</span>
                                        <span className="text-green font-mono">
                                          +{rb.awardedPoints} / {rb.maxPoints} pts
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-mut">{rb.explanation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Justification & Feedback */}
                              <div className="text-xs text-mut space-y-1">
                                <p>
                                  <strong className="text-ink">Evaluation Justification: </strong>
                                  {q.gradingJustification}
                                </p>
                                <p className="text-green">
                                  <strong>Constructive Advice: </strong>
                                  {q.constructiveFeedback}
                                </p>
                              </div>

                              {/* Teacher-in-the-Loop Override Controls */}
                              <div className="pt-2 border-t border-line flex items-center gap-2">
                                <span className="text-[11px] text-mut">Teacher Override:</span>
                                <Input
                                  type="number"
                                  min="0"
                                  max={q.maxScore}
                                  placeholder="Score"
                                  defaultValue={q.awardedScore}
                                  id={`override-input-${q.questionNumber}`}
                                  className="h-7 w-20 bg-bone border-line text-ink text-xs text-center"
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
                                  className="h-7 text-[11px] border-line text-ink hover:bg-bone"
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
                    <Card className="bg-paper border-dashed border-line flex flex-col items-center justify-center p-12 text-center">
                      <FileCheck2 className="h-12 w-12 text-mut-2 mb-3" />
                      <h4 className="text-base font-semibold text-mut">
                        Awaiting Submission Evaluation
                      </h4>
                      <p className="text-xs text-mut-2 max-w-sm mt-1">
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-md border border-amber/30">
                <div>
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <Scale className="h-5 w-5 text-amber-deep" />
                    Inter-Rater Consistency & Calibration Lab
                  </h3>
                  <p className="text-sm text-mut mt-1">
                    Solves the major academic challenge: Multiple faculty members evaluating the same exam with different grading standards. Simulates multi-evaluator bias, calculates Inter-Rater Reliability (IRR), and standardizes grades.
                  </p>
                </div>
                <Button
                  onClick={() => triggerConsistencyAudit(gradingResult)}
                  disabled={calibrating}
                  className="bg-amber hover:bg-amber text-ink text-xs flex items-center gap-2"
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
                  <Card className="bg-paper border-amber/30 shadow-paper flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-base text-ink flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-deep" /> Inter-Rater Reliability Index (IRR)
                      </CardTitle>
                      <CardDescription className="text-xs text-mut">
                        Measures statistical grading consensus between disparate evaluators.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-md bg-amber/12 border border-amber/30 text-center">
                        <span className="text-xs text-mut uppercase tracking-wider">
                          Consensus Parity Score
                        </span>
                        <div className="text-4xl font-extrabold text-amber-deep mt-1">
                          {consistencyAuditResult.irrReliabilityScore}%
                        </div>
                        <span className="text-[11px] text-green font-medium mt-1 block">
                          ✓ Institutionally Acceptable Reliability (Cohen's κ &gt; 0.85)
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2 rounded bg-bone border border-line">
                          <span className="text-mut">Max Evaluator Spread:</span>
                          <span className="font-mono text-red font-bold">
                            ±{consistencyAuditResult.discrepancyDelta} Marks
                          </span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-bone border border-line">
                          <span className="text-mut">Calibrated Consensus:</span>
                          <span className="font-mono text-green font-bold">
                            {consistencyAuditResult.recommendedConsensusScore} / 10
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-md bg-bone border border-line text-xs">
                        <span className="font-semibold text-ink block mb-1">
                          Root Cause of Grader Variance:
                        </span>
                        <p className="text-mut leading-relaxed text-[11px]">
                          {consistencyAuditResult.rootCause}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Multi-Grader Simulation Comparison (The Wow Visual) */}
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-paper border-line">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-ink flex items-center gap-2">
                          <Users className="h-4 w-4 text-violet" /> Multi-Faculty Evaluation Perspectives
                        </CardTitle>
                        <CardDescription className="text-xs text-mut">
                          Comparing how strict vs application-focused faculty evaluate the exact same answer script.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {consistencyAuditResult.graderSimulations?.map((sim, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-md border transition-all ${
                              sim.grader.includes("Consensus")
                                ? "bg-green-soft border-green/30"
                                : "bg-bone border-line"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-ink text-sm flex items-center gap-2">
                                {sim.grader.includes("Consensus") ? (
                                  <Sparkles className="h-4 w-4 text-green" />
                                ) : (
                                  <Users className="h-4 w-4 text-mut" />
                                )}
                                {sim.grader}
                              </span>
                              <Badge
                                className={
                                  sim.grader.includes("Consensus")
                                    ? "bg-green-soft text-green border-green/30"
                                    : "bg-bone text-ink"
                                }
                              >
                                {sim.score} / {sim.maxScore} Marks
                              </Badge>
                            </div>
                            <p className="text-xs text-mut mt-2 leading-relaxed">
                              {sim.biasReasoning}
                            </p>
                          </div>
                        ))}

                        {/* Rubric Refinement Clause to standardize future grading */}
                        <div className="p-4 rounded-md bg-violet-soft border border-violet/30 text-xs space-y-1 mt-4">
                          <span className="font-semibold text-violet flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-violet" />
                            Official Standardizing Rubric Clause for Faculty Board:
                          </span>
                          <p className="text-ink italic leading-relaxed">
                            "{consistencyAuditResult.rubricRefinementSuggestion}"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="bg-paper border-dashed border-line flex flex-col items-center justify-center p-12 text-center">
                  <Scale className="h-12 w-12 text-mut-2 mb-3" />
                  <h4 className="text-base font-semibold text-mut">
                    Run Calibration on an Answer Sheet
                  </h4>
                  <p className="text-xs text-mut-2 max-w-sm mt-1">
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-md border border-green/30">
                <div>
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green" />
                    Cohort Analytics & Remediation Planning Agent
                  </h3>
                  <p className="text-sm text-mut mt-1">
                    Aggregates student performance across exams, detects conceptual bottlenecks, and generates actionable lecture remediation plans.
                  </p>
                </div>
                <Button
                  onClick={handleFetchCohortInsights}
                  disabled={insightsLoading}
                  className="bg-green hover:bg-green/90 text-white text-xs flex items-center gap-2"
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
                    <div className="p-4 rounded-md bg-paper border border-line text-center">
                      <span className="text-xs text-mut">Class Average</span>
                      <p className="text-2xl font-bold text-green mt-1">
                        {cohortInsights.classAverage}%
                      </p>
                    </div>
                    <div className="p-4 rounded-md bg-paper border border-line text-center">
                      <span className="text-xs text-mut">Grade Distribution</span>
                      <div className="flex justify-center gap-2 text-xs font-bold text-ink mt-2">
                        <span className="text-green">A:{cohortInsights.gradeDistribution?.A}</span>
                        <span className="text-violet">B:{cohortInsights.gradeDistribution?.B}</span>
                        <span className="text-amber-deep">C:{cohortInsights.gradeDistribution?.C}</span>
                        <span className="text-red">D:{cohortInsights.gradeDistribution?.D}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-md bg-paper border border-line text-center">
                      <span className="text-xs text-mut">Bottleneck Question</span>
                      <p className="text-2xl font-bold text-amber-deep mt-1">
                        Q#{cohortInsights.mostChallengingQuestions?.[0]?.questionNumber || 2}
                      </p>
                    </div>
                    <div className="p-4 rounded-md bg-paper border border-line text-center">
                      <span className="text-xs text-mut">Remedial Sessions</span>
                      <p className="text-2xl font-bold text-violet mt-1">
                        {cohortInsights.remedialActionPlan?.length || 2} Planned
                      </p>
                    </div>
                  </div>

                  {/* Conceptual Bottlenecks & Common Traps */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-paper border-line">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-ink flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-deep" />
                          Most Challenging Concepts & Misconceptions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        {cohortInsights.mostChallengingQuestions?.map((q, i) => (
                          <div key={i} className="p-3 rounded-md bg-amber/12 border border-amber/30">
                            <div className="flex justify-between font-semibold text-amber-deep">
                              <span>Question {q.questionNumber}: {q.topic}</span>
                              <span>Avg: {q.averageScorePct}%</span>
                            </div>
                            <p className="text-mut mt-1 text-[11px] leading-relaxed">
                              {q.rootMisconception}
                            </p>
                          </div>
                        ))}

                        <div className="space-y-1.5 mt-2">
                          <span className="font-semibold text-ink">Observed Cognitive Pitfalls:</span>
                          {cohortInsights.commonMisconceptions?.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 text-mut text-[11px]">
                              <span className="text-red font-bold">•</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Remedial Lecture Plan */}
                    <Card className="bg-paper border-line">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-ink flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-green" />
                          Actionable Remedial Plan for Next Lecture
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        {cohortInsights.remedialActionPlan?.map((plan, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-md bg-green-soft border border-green/30 space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-green">
                              <span>{plan.topic}</span>
                              <Badge className="bg-green-soft text-green text-[10px]">
                                {plan.sessionMinutes} Minutes
                              </Badge>
                            </div>
                            <p className="text-mut text-[11px]">{plan.activity}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="bg-paper border-dashed border-line flex flex-col items-center justify-center p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-mut-2 mb-3" />
                  <h4 className="text-base font-semibold text-mut">
                    No Cohort Insights Loaded Yet
                  </h4>
                  <p className="text-xs text-mut-2 max-w-sm mt-1">
                    Click "Refresh Cohort Analysis" to diagnose class bottlenecks and generate remedial lesson plans.
                  </p>
                </Card>
              )}
            </div>
          )}

    </div>
  );
}