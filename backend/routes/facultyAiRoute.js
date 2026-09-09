import { Router } from "express";
import Course from "../models/course.js";
import Exam from "../models/Exam.js";
import Submission from "../models/Submission.js";
import {
  generateCourseCurriculum,
  generateExamPaper,
  suggestQuestionImprovements,
  evaluateStudentSubmissionMultimodal,
  auditInterRaterConsistency,
  generateCohortPedagogicalInsights,
} from "../utils/facultyAiService.js";

export const facultyAiRouter = Router();

// ==========================================
// 1. CURRICULUM & COURSE ARCHITECT ENDPOINTS
// ==========================================

// Generate complete semester syllabus & learning outcomes
facultyAiRouter.post("/curriculum/generate", async (req, res) => {
  try {
    const { courseTitle, courseCode, department, credits, semester, targetAudience, courseFocus } = req.body;
    if (!courseTitle) {
      return res.status(400).json({ error: "Course title is required" });
    }

    const curriculum = await generateCourseCurriculum({
      courseTitle,
      courseCode,
      department: department || "Computer Science",
      credits: credits || 3,
      semester: semester || 1,
      targetAudience,
      courseFocus,
    });

    res.json({ success: true, curriculum });
  } catch (error) {
    console.error("Error generating curriculum:", error);
    res.status(500).json({ error: "Failed to generate course curriculum", details: error.message });
  }
});

// 1-Click Sync into System Courses Database (Instantly ready for Timetable Scheduler)
facultyAiRouter.post("/curriculum/sync", async (req, res) => {
  try {
    const { curriculum } = req.body;
    if (!curriculum || !curriculum.name || !curriculum.code) {
      return res.status(400).json({ error: "Invalid curriculum data for sync" });
    }

    // Check if course already exists or create new
    let course = await Course.findOne({ code: curriculum.code });
    if (course) {
      course.name = curriculum.name;
      course.department = curriculum.department;
      course.credits = curriculum.credits;
      course.semester = curriculum.semester;
      course.description = curriculum.description;
      course.duration = curriculum.duration || 14;
      course.prerequisites = curriculum.prerequisites || [];
      await course.save();
    } else {
      course = new Course({
        name: curriculum.name,
        code: curriculum.code,
        department: curriculum.department,
        credits: curriculum.credits,
        semester: curriculum.semester,
        description: curriculum.description,
        duration: curriculum.duration || 14,
        prerequisites: curriculum.prerequisites || [],
        type: "lecture",
        hoursPerWeek: curriculum.credits || 3,
      });
      await course.save();
    }

    res.json({
      success: true,
      message: `Course ${course.code} synchronized successfully with Smart Classroom Course Database`,
      course,
    });
  } catch (error) {
    console.error("Error syncing course to DB:", error);
    res.status(500).json({ error: "Failed to sync course with database", details: error.message });
  }
});

// ==========================================
// 2. EXAM MAKER & QUALITY ANALYZER ENDPOINTS
// ==========================================

// Generate full exam paper with model answers and rubrics
facultyAiRouter.post("/exam/generate", async (req, res) => {
  try {
    const {
      courseTitle,
      courseCode,
      department,
      term,
      totalMarks,
      durationMinutes,
      topicList,
      difficultyDistribution,
      questionCount,
      facultySpecialNotes,
    } = req.body;

    const examData = await generateExamPaper({
      courseTitle: courseTitle || "Advanced Computing",
      courseCode: courseCode || "CS301",
      department: department || "Computer Science",
      term: term || "Final Exam",
      totalMarks: totalMarks || 100,
      durationMinutes: durationMinutes || 120,
      topicList: topicList || "Core topics",
      difficultyDistribution: difficultyDistribution || { easy: 30, medium: 50, hard: 20 },
      questionCount: questionCount || 4,
      facultySpecialNotes,
    });

    res.json({ success: true, exam: examData });
  } catch (error) {
    console.error("Error generating exam:", error);
    res.status(500).json({ error: "Failed to generate exam paper", details: error.message });
  }
});

// Real-time AI auto-suggester and quality improver while faculty types a question
facultyAiRouter.post("/exam/suggest-question", async (req, res) => {
  try {
    const { questionDraft, courseTopic, marks } = req.body;
    if (!questionDraft) {
      return res.status(400).json({ error: "Question draft text is required" });
    }

    const suggestions = await suggestQuestionImprovements({
      questionDraft,
      courseTopic: courseTopic || "Computer Science",
      marks: marks || 10,
    });

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error("Error suggesting question improvements:", error);
    res.status(500).json({ error: "Failed to generate question suggestions", details: error.message });
  }
});

// Save exam to database
facultyAiRouter.post("/exam/save", async (req, res) => {
  try {
    const examData = req.body;
    const newExam = new Exam(examData);
    await newExam.save();
    res.json({ success: true, message: "Exam saved successfully", exam: newExam });
  } catch (error) {
    console.error("Error saving exam:", error);
    res.status(500).json({ error: "Failed to save exam", details: error.message });
  }
});

// Get all exams
facultyAiRouter.get("/exams", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json({ success: true, exams });
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ error: "Failed to fetch exams", details: error.message });
  }
});

// =========================================================================
// 3. MULTIMODAL AUTO-GRADING AGENT (WITH SCRIPT CITATIONS & EXPLAINABILITY)
// =========================================================================

facultyAiRouter.post("/grade/evaluate", async (req, res) => {
  try {
    const {
      examContext,
      studentName,
      studentId,
      fileBase64,
      mimeType,
      submissionText,
      facultyCustomRules,
      strictnessLevel,
    } = req.body;

    const evaluation = await evaluateStudentSubmissionMultimodal({
      examContext,
      studentName: studentName || "Student Candidate",
      studentId: studentId || "STU-" + Math.floor(1000 + Math.random() * 9000),
      fileBase64,
      mimeType,
      submissionText,
      facultyCustomRules: facultyCustomRules || [],
      strictnessLevel: strictnessLevel || "standard",
    });

    res.json({ success: true, evaluation });
  } catch (error) {
    console.error("Error evaluating submission:", error);
    res.status(500).json({ error: "Failed to evaluate submission", details: error.message });
  }
});

// Save evaluated submission to DB
facultyAiRouter.post("/grade/save-submission", async (req, res) => {
  try {
    const submissionData = req.body;
    const newSubmission = new Submission(submissionData);
    await newSubmission.save();
    res.json({ success: true, message: "Submission evaluation saved", submission: newSubmission });
  } catch (error) {
    console.error("Error saving submission:", error);
    res.status(500).json({ error: "Failed to save submission", details: error.message });
  }
});

// Retrieve all submissions
facultyAiRouter.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions", details: error.message });
  }
});

// Teacher Override endpoint (Preserving teacher authority)
facultyAiRouter.post("/grade/override", async (req, res) => {
  try {
    const { submissionId, questionNumber, overrideScore, overrideReason, facultyName } = req.body;
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const qEval = submission.questionEvaluations.find((q) => q.questionNumber === Number(questionNumber));
    if (!qEval) {
      return res.status(404).json({ error: "Question evaluation not found" });
    }

    const scoreDiff = Number(overrideScore) - qEval.awardedScore;
    qEval.teacherOverride = {
      applied: true,
      originalScore: qEval.awardedScore,
      overrideScore: Number(overrideScore),
      overrideReason: overrideReason || "Teacher pedagogical discretion",
      facultySignoff: facultyName || "Course Instructor",
    };
    qEval.awardedScore = Number(overrideScore);
    qEval.status = "faculty_overridden";

    // Recalculate total
    submission.totalScore = submission.questionEvaluations.reduce((acc, q) => acc + q.awardedScore, 0);
    submission.percentage = Math.round((submission.totalScore / submission.maxPossibleScore) * 100);
    submission.status = "verified_by_faculty";

    await submission.save();

    res.json({ success: true, message: "Teacher override recorded", submission });
  } catch (error) {
    console.error("Error recording teacher override:", error);
    res.status(500).json({ error: "Failed to record teacher override", details: error.message });
  }
});

// =========================================================================
// 4. INTER-RATER CONSISTENCY & CALIBRATION AUDITOR ENDPOINT
// =========================================================================
facultyAiRouter.post("/grade/audit-consistency", async (req, res) => {
  try {
    const { questionText, modelAnswer, rubricCriteria, studentAnswerCitation, facultyEvaluations } = req.body;

    const auditResult = await auditInterRaterConsistency({
      questionText: questionText || "Sample Question",
      modelAnswer: modelAnswer || "Standard Model Answer",
      rubricCriteria: rubricCriteria || [],
      studentAnswerCitation: studentAnswerCitation || "Student script citation",
      facultyEvaluations,
    });

    res.json({ success: true, audit: auditResult });
  } catch (error) {
    console.error("Error auditing inter-rater consistency:", error);
    res.status(500).json({ error: "Failed to audit grading consistency", details: error.message });
  }
});

// =========================================================================
// 5. COHORT ANALYTICS & FACULTY REMEDIATION ENDPOINT
// =========================================================================
facultyAiRouter.post("/analytics/cohort", async (req, res) => {
  try {
    const { courseName, examTitle, submissionsData } = req.body;

    const insights = await generateCohortPedagogicalInsights({
      courseName: courseName || "Software Architecture",
      examTitle: examTitle || "Midterm Examination",
      submissionsData: submissionsData || [],
    });

    res.json({ success: true, insights });
  } catch (error) {
    console.error("Error generating cohort insights:", error);
    res.status(500).json({ error: "Failed to generate cohort insights", details: error.message });
  }
});
