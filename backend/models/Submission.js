import mongoose from "mongoose";

const QuestionEvaluationSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  awardedScore: { type: Number, required: true, default: 0 },
  maxScore: { type: Number, required: true, default: 10 },
  confidenceScore: { type: Number, default: 95 }, // Percentage
  status: {
    type: String,
    enum: ["auto_graded", "needs_faculty_review", "faculty_overridden"],
    default: "auto_graded",
  },
  // Explainability & Script Reference (Crucial User Requirement)
  studentAnswerCitation: {
    type: String,
    required: true,
    default: "Quoted extract from student response.",
  },
  rubricBreakdown: [
    {
      criterion: { type: String, required: true },
      awardedPoints: { type: Number, required: true },
      maxPoints: { type: Number, required: true },
      explanation: { type: String, required: true },
      status: {
        type: String,
        enum: ["full_credit", "partial_credit", "deducted"],
        default: "full_credit",
      },
    },
  ],
  gradingJustification: {
    type: String,
    required: true,
  },
  discrepancyRisk: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low",
  },
  constructiveFeedback: { type: String },
  teacherOverride: {
    applied: { type: Boolean, default: false },
    originalScore: { type: Number },
    overrideScore: { type: Number },
    overrideReason: { type: String },
    facultySignoff: { type: String },
  },
});

const SubmissionSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    examTitle: { type: String, required: true },
    courseCode: { type: String, required: true },
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
    submissionFormat: {
      type: String,
      enum: ["image", "pdf", "text"],
      default: "text",
    },
    originalFileUrl: { type: String },
    extractedScriptContent: { type: String, required: true },
    appliedRules: [{ type: String }],
    strictnessLevel: {
      type: String,
      enum: ["lenient", "standard", "rigorous"],
      default: "standard",
    },
    questionEvaluations: [QuestionEvaluationSchema],
    totalScore: { type: Number, required: true, default: 0 },
    maxPossibleScore: { type: Number, required: true, default: 100 },
    percentage: { type: Number, required: true, default: 0 },
    gradeLetter: { type: String, default: "B+" },
    overallSummary: { type: String },
    
    // Inter-Rater Consistency Audit
    interRaterAudit: {
      audited: { type: Boolean, default: true },
      reliabilityScore: { type: Number, default: 94 }, // 0 to 100%
      raterDiscrepancies: [
        {
          questionNumber: { type: Number },
          raterAPerspective: { type: String },
          raterBPerspective: { type: String },
          varianceReason: { type: String },
          consensusScore: { type: Number },
        },
      ],
      recommendation: { type: String },
    },
    status: {
      type: String,
      enum: ["graded", "flagged_review", "verified_by_faculty"],
      default: "graded",
    },
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", SubmissionSchema);

export default Submission;
