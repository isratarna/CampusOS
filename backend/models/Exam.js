import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["conceptual", "numerical_derivation", "coding", "essay", "multiple_choice"],
    default: "conceptual",
  },
  marks: { type: Number, required: true, default: 5 },
  bloomLevel: {
    type: String,
    enum: ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"],
    default: "Apply",
  },
  modelAnswer: { type: String, required: true },
  rubricCriteria: [
    {
      criterion: { type: String, required: true },
      maxPoints: { type: Number, required: true },
      rule: { type: String }, // e.g. "Deduct 1 point if missing asymptotic notation"
    },
  ],
  aiQualityNotes: {
    clarityRating: { type: Number, default: 9 },
    ambiguityRisk: { type: String, default: "Low" },
    estimatedMinutes: { type: Number, default: 10 },
  },
});

const ExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    department: { type: String, required: true },
    term: { type: String, default: "Midterm" },
    totalMarks: { type: Number, required: true, default: 100 },
    durationMinutes: { type: Number, required: true, default: 120 },
    instructions: [{ type: String }],
    questions: [QuestionSchema],
    facultyGradingRules: [
      {
        ruleType: { type: String }, // e.g. "partial_credit", "penalty", "alternative_answers"
        description: { type: String },
        weight: { type: Number, default: 1 },
      },
    ],
    qualityAudit: {
      overallScore: { type: Number, default: 92 },
      bloomsTaxonomyBalance: {
        lowerOrderPct: { type: Number, default: 30 },
        higherOrderPct: { type: Number, default: 70 },
      },
      estimatedCompletionTimeMinutes: { type: Number, default: 110 },
      clarityIndex: { type: String, default: "Excellent (4.8/5.0)" },
      recommendations: [{ type: String }],
    },
    status: {
      type: String,
      enum: ["draft", "finalized", "archived"],
      default: "finalized",
    },
    createdBy: { type: String, default: "Faculty Member" },
  },
  { timestamps: true }
);

const Exam = mongoose.model("Exam", ExamSchema);

export default Exam;
