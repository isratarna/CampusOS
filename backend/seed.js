import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

import User from "./models/User.js";
import Course from "./models/course.js";
import Faculty from "./models/Faculty.js";
import Room from "./models/Room.js";
import Timetable from "./models/Timetable.js";
import Notification from "./models/Notification.js";
import Exam from "./models/Exam.js";
import Submission from "./models/Submission.js";
import { DEMO_ACCOUNTS } from "./routes/authRoute.js";

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.error("No MongoDB URI found in environment!");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully.");

    // 1. SEED USERS (Admin, Faculty, Student)
    console.log("Seeding Demo Users...");
    for (const acc of DEMO_ACCOUNTS) {
      const existing = await User.findOne({ email: acc.email });
      if (existing) {
        existing.name = acc.name;
        existing.password = acc.password; // Will trigger pre-save hook
        existing.role = acc.role;
        existing.department = acc.department;
        existing.studentId = acc.studentId;
        await existing.save();
        console.log(`Updated user: ${acc.email} (${acc.role})`);
      } else {
        const newUser = new User({
          name: acc.name,
          email: acc.email,
          password: acc.password,
          role: acc.role,
          department: acc.department,
          studentId: acc.studentId,
        });
        await newUser.save();
        console.log(`Created user: ${acc.email} (${acc.role})`);
      }
    }

    // 2. SEED FACULTY MEMBERS
    console.log("Checking Faculty records...");
    const facultyCount = await Faculty.countDocuments();
    let sampleFacultyId;
    if (facultyCount === 0) {
      const faculties = await Faculty.insertMany([
        {
          name: "Prof. Alan Turing",
          email: "faculty@smartclassroom.edu",
          department: "Computer Science & Engineering",
          specialization: ["Algorithms", "Machine Learning", "Theoretical Computer Science"],
          maxHoursPerWeek: 18,
          availability: {
            monday: [{ start: "09:00", end: "17:00" }],
            tuesday: [{ start: "09:00", end: "17:00" }],
            wednesday: [{ start: "09:00", end: "17:00" }],
            thursday: [{ start: "09:00", end: "17:00" }],
            friday: [{ start: "09:00", end: "15:00" }],
          },
        },
        {
          name: "Dr. Grace Hopper",
          email: "grace.hopper@smartclassroom.edu",
          department: "Computer Science & Engineering",
          specialization: ["Distributed Systems", "Compiler Design", "Cloud Infrastructure"],
          maxHoursPerWeek: 16,
          availability: {
            monday: [{ start: "10:00", end: "18:00" }],
            wednesday: [{ start: "10:00", end: "18:00" }],
            friday: [{ start: "10:00", end: "16:00" }],
          },
        },
        {
          name: "Dr. Claude Shannon",
          email: "claude.shannon@smartclassroom.edu",
          department: "Electrical & Computer Engineering",
          specialization: ["Information Theory", "Cryptography", "Network Architecture"],
          maxHoursPerWeek: 14,
          availability: {
            tuesday: [{ start: "09:00", end: "16:00" }],
            thursday: [{ start: "09:00", end: "16:00" }],
          },
        },
      ]);
      sampleFacultyId = faculties[0]._id;
      console.log(`Seeded ${faculties.length} faculty members.`);
    } else {
      const first = await Faculty.findOne();
      sampleFacultyId = first._id;
      console.log(`Faculty collection already has ${facultyCount} records.`);
    }

    // 3. SEED ROOMS
    console.log("Checking Room records...");
    const roomCount = await Room.countDocuments();
    let sampleRoomId;
    if (roomCount === 0) {
      const defaultAvailability = {
        monday: [{ start: "08:00", end: "18:00" }],
        tuesday: [{ start: "08:00", end: "18:00" }],
        wednesday: [{ start: "08:00", end: "18:00" }],
        thursday: [{ start: "08:00", end: "18:00" }],
        friday: [{ start: "08:00", end: "18:00" }],
      };
      const rooms = await Room.insertMany([
        {
          name: "Turing Lab 101",
          building: "Turing Hall",
          floor: 1,
          capacity: 65,
          type: "lab",
          equipment: ["High-Performance Workstations", "Smartboard", "Air Conditioned", "Projector"],
          availability: defaultAvailability,
        },
        {
          name: "Auditorium Hall Alpha",
          building: "Central Complex",
          floor: 2,
          capacity: 220,
          type: "auditorium",
          equipment: ["Surround Sound System", "Dual 4K Projectors", "Video Recording Deck"],
          availability: defaultAvailability,
        },
        {
          name: "Seminar Room 304",
          building: "Engineering Block B",
          floor: 3,
          capacity: 45,
          type: "seminar_room",
          equipment: ["Smart Podium", "Video Conferencing", "Whiteboard"],
          availability: defaultAvailability,
        },
      ]);
      sampleRoomId = rooms[0]._id;
      console.log(`Seeded ${rooms.length} classroom & lab rooms.`);
    } else {
      const first = await Room.findOne();
      sampleRoomId = first._id;
      console.log(`Room collection already has ${roomCount} records.`);
    }

    // 4. SEED COURSES
    console.log("Checking Course records...");
    const courseCount = await Course.countDocuments();
    let sampleCourseId;
    if (courseCount === 0) {
      const courses = await Course.insertMany([
        {
          name: "Advanced Distributed Cloud Architecture",
          code: "CS401",
          department: "Computer Science",
          credits: 4,
          semester: 6,
          type: "lecture",
          duration: 14,
          hoursPerWeek: 4,
          description: "Scalable microservices, fault tolerance, consensus algorithms, and event-driven patterns.",
          prerequisites: ["Data Structures & Algorithms", "Operating Systems"],
        },
        {
          name: "Artificial Intelligence & Agentic Workflows",
          code: "CS480",
          department: "Computer Science",
          credits: 3,
          semester: 7,
          type: "lecture",
          duration: 14,
          hoursPerWeek: 3,
          description: "Autonomous reasoning agents, multimodal LLMs, tool orchestration, and cognitive design.",
          prerequisites: ["Machine Learning Fundamentals"],
        },
        {
          name: "Database Internals & Storage Engines",
          code: "CS320",
          department: "Computer Science",
          credits: 3,
          semester: 5,
          type: "lab",
          duration: 14,
          hoursPerWeek: 3,
          description: "B-Trees, LSM-Trees, WAL, write-amplification, concurrency control, and MVCC.",
          prerequisites: ["Database Systems"],
        },
      ]);
      sampleCourseId = courses[0]._id;
      console.log(`Seeded ${courses.length} accredited courses.`);
    } else {
      const first = await Course.findOne();
      sampleCourseId = first._id;
      console.log(`Course collection already has ${courseCount} records.`);
    }

    // 5. SEED NOTIFICATIONS
    console.log("Checking Notifications...");
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.insertMany([
        {
          title: "Timetable Published for Fall Semester",
          message: "The AI Timetable Generator has finalized room allocations for all CS departments with zero clashes.",
          type: "success",
          isRead: false,
        },
        {
          title: "New AI Multimodal Grading Report Available",
          message: "Midterm submissions for CS401 have been processed with automated rubric compliance and script citations.",
          type: "info",
          isRead: false,
        },
      ]);
      console.log("Seeded default notifications.");
    }

    // 6. SEED SAMPLE EXAM & SUBMISSION IF NONE EXIST
    const examCount = await Exam.countDocuments();
    if (examCount === 0) {
      const sampleExam = new Exam({
        title: "CS401: Midterm Examination - Cloud Systems & Architecture",
        courseCode: "CS401",
        courseName: "Advanced Distributed Cloud Architecture",
        department: "Computer Science",
        term: "Midterm Fall",
        totalMarks: 50,
        durationMinutes: 90,
        instructions: [
          "Answer all questions showing intermediate derivations.",
          "Partial credit awarded for valid mathematical setups.",
        ],
        questions: [
          {
            questionNumber: 1,
            text: "Explain the CAP theorem trade-offs during a network partition. Contrast CP versus AP database guarantees with real-world examples.",
            type: "conceptual",
            marks: 25,
            bloomLevel: "Analyze",
            modelAnswer: "During network partition (P), a distributed system must choose between Consistency (C) and Availability (A). CP systems (e.g. Paxos/Raft in Spanner) reject writes to maintain linearizability, while AP systems (e.g. Cassandra) accept conflicting writes resolving them via vector clocks or LWW.",
            rubricCriteria: [
              { criterion: "Definition of Partition Tolerance & Inevitability", maxPoints: 8, rule: "Must highlight network unreliability" },
              { criterion: "CP vs AP Mechanism Contrast", maxPoints: 10, rule: "Must cite linearizability vs eventual consistency" },
              { criterion: "Authentic Production System Examples", maxPoints: 7, rule: "Accurately maps CP to Spanner/Raft and AP to Dynamo/Cassandra" },
            ],
            aiQualityNotes: { clarityRating: 9.7, ambiguityRisk: "Low", estimatedMinutes: 20 },
          },
          {
            questionNumber: 2,
            text: "Derive the write-amplification factor (WAF) of an LSM-Tree compaction under Levelled Compaction. Contrast this against a traditional B+Tree write pattern.",
            type: "numerical_derivation",
            marks: 25,
            bloomLevel: "Evaluate",
            modelAnswer: "WAF = Total Bytes Written to Storage / Logical Bytes Written by User. In Levelled Compaction with multiplier T (typically 10), each level rewrite carries an amplification of O(T * L) where L is the number of levels. In B+Trees, random in-place updates cause full page rewrites (e.g. 4KB page updated for 100-byte record = WAF of 40).",
            rubricCriteria: [
              { criterion: "Formal definition of WAF", maxPoints: 7, rule: "Correct fraction of physical vs logical bytes" },
              { criterion: "LSM Levelled Compaction derivation", maxPoints: 10, rule: "Derives O(T * L) with tiering/compaction explanation" },
              { criterion: "B+Tree full page rewrite contrast", maxPoints: 8, rule: "Calculates ratio for 4KB dirty page rewrite" },
            ],
            aiQualityNotes: { clarityRating: 9.5, ambiguityRisk: "Low", estimatedMinutes: 25 },
          },
        ],
        facultyGradingRules: [
          { ruleType: "partial_credit", description: "Award 50% credit if core formula is correctly framed even if arithmetic fails", weight: 1 },
          { ruleType: "penalty", description: "Deduct 2 marks for missing asymptotic notations or units", weight: 1 },
        ],
        qualityAudit: {
          overallScore: 95,
          bloomsTaxonomyBalance: { lowerOrderPct: 15, higherOrderPct: 85 },
          estimatedCompletionTimeMinutes: 75,
          clarityIndex: "Pristine Rigor (4.9/5.0)",
          recommendations: ["Exemplary analytical exam paper with zero ambiguous wording."],
        },
      });
      await sampleExam.save();
      console.log("Seeded sample exam CS401.");

      // Seed a graded sample submission
      const sampleSubmission = new Submission({
        examId: sampleExam._id,
        examTitle: sampleExam.title,
        courseCode: sampleExam.courseCode,
        studentName: "Sophia Chen",
        studentId: "STU-2026-089",
        submissionType: "text",
        extractedScriptContent: `Q1: In the CAP theorem, when a network partition occurs, CP systems prioritize consistency by pausing writes if a consensus quorum is unreachable (e.g., Google Spanner). AP systems, like Apache Cassandra, favor availability by continuing to accept writes locally and syncing via anti-entropy / hinted handoffs later.
Q2: Write Amplification Factor (WAF) = Bytes Written to Disk / Bytes Written by Application. In Levelled LSM Compaction with sizing ratio T=10, keys get rewritten across L levels yielding WAF ~ O(T*L). Conversely, B+Trees update records in-place, rewriting the entire 4KB or 8KB page on every write, leading to massive write amplification for small random inserts.`,
        questionEvaluations: [
          {
            questionNumber: 1,
            awardedScore: 24,
            maxScore: 25,
            confidenceScore: 98,
            status: "auto_graded",
            studentAnswerCitation: "Student Script: 'CP systems prioritize consistency by pausing writes if a consensus quorum is unreachable (e.g., Google Spanner). AP systems, like Apache Cassandra, favor availability...'",
            rubricBreakdown: [
              {
                criterion: "Definition of Partition Tolerance & Inevitability",
                awardedPoints: 8,
                maxPoints: 8,
                explanation: "Accurately noted consensus quorum pause mechanics.",
                status: "full_credit",
              },
              {
                criterion: "CP vs AP Mechanism Contrast",
                awardedPoints: 9,
                maxPoints: 10,
                explanation: "Exceptional contrast; minor deduction for omitting vector clock conflict resolution detail.",
                status: "partial_credit",
              },
              {
                criterion: "Authentic Production System Examples",
                awardedPoints: 7,
                maxPoints: 7,
                explanation: "Perfect production system references (Spanner and Cassandra).",
                status: "full_credit",
              },
            ],
            gradingJustification: "Highly articulate response demonstrating rigorous understanding of partition boundaries.",
            discrepancyRisk: "Low",
            constructiveFeedback: "Near perfect. Mentioning vector clocks would complete an academic publication-grade answer.",
          },
          {
            questionNumber: 2,
            awardedScore: 23,
            maxScore: 25,
            confidenceScore: 96,
            status: "auto_graded",
            studentAnswerCitation: "Student Script: 'WAF = Bytes Written to Disk / Bytes Written by Application... LSM Compaction sizing ratio T=10 yielding WAF ~ O(T*L). Conversely, B+Trees update records in-place, rewriting the entire 4KB page...'",
            rubricBreakdown: [
              {
                criterion: "Formal definition of WAF",
                awardedPoints: 7,
                maxPoints: 7,
                explanation: "Correct disk-to-app byte ratio definition.",
                status: "full_credit",
              },
              {
                criterion: "LSM Levelled Compaction derivation",
                awardedPoints: 9,
                maxPoints: 10,
                explanation: "Accurate asymptotic tiering derivation.",
                status: "partial_credit",
              },
              {
                criterion: "B+Tree full page rewrite contrast",
                awardedPoints: 7,
                maxPoints: 8,
                explanation: "Clear 4KB page dirty rewrite demonstration.",
                status: "partial_credit",
              },
            ],
            gradingJustification: "Rigorous derivation directly citing the compaction multiplier and page overhead.",
            discrepancyRisk: "Low",
            constructiveFeedback: "Excellent grasp of write-amplification physics.",
          },
        ],
        totalScore: 47,
        maxPossibleScore: 50,
        percentage: 94,
        gradeLetter: "A",
        status: "verified_by_faculty",
        overallSummary: "Sophia demonstrated outstanding mastery (94%) of distributed consistency and storage engine internals.",
        interRaterAudit: {
          reliabilityScore: 96,
          raterDiscrepancies: [],
          recommendation: "Evaluation adheres strictly to mathematical rubrics. 96% inter-rater agreement across graders.",
        },
      });
      await sampleSubmission.save();
      console.log("Seeded sample evaluated submission.");
    }

    console.log("\n==========================================");
    console.log("DEMO SEEDING COMPLETED SUCCESSFULLY!");
    console.log("Demo Accounts Ready for Autofill:");
    DEMO_ACCOUNTS.forEach((acc) => {
      console.log(`- [${acc.role.toUpperCase()}] ${acc.email} | Password: ${acc.password}`);
    });
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
};

seedDatabase();
