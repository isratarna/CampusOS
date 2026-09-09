import { Router } from "express";
import User from "../models/User.js";
import { generateToken, protect } from "../utils/authMiddleware.js";

export const authRouter = Router();

// Demo accounts metadata for instant frontend autofill
export const DEMO_ACCOUNTS = [
  {
    role: "admin",
    name: "Dr. Eleanor Vance (Dean & Admin)",
    email: "admin@smartclassroom.edu",
    password: "AdminPassword123!",
    department: "Academic Affairs & Administration",
    description: "Full system access, timetable generation, room assignments & user management",
  },
  {
    role: "faculty",
    name: "Prof. Alan Turing (Senior Faculty)",
    email: "faculty@smartclassroom.edu",
    password: "FacultyPassword123!",
    department: "Computer Science & Engineering",
    description: "Curriculum architect, exam crafter, auto-grader & student evaluation",
  },
  {
    role: "student",
    name: "Sophia Chen (Student Representative)",
    email: "student@smartclassroom.edu",
    password: "StudentPassword123!",
    department: "Computer Science",
    studentId: "STU-2026-089",
    description: "View class schedules, access study materials & exam feedback",
  },
];

// @route   GET /api/auth/demo-accounts
// @desc    Get pre-configured demo account credentials for one-click autofill
// @access  Public
authRouter.get("/demo-accounts", (req, res) => {
  res.json({
    success: true,
    accounts: DEMO_ACCOUNTS.map((acc) => ({
      role: acc.role,
      name: acc.name,
      email: acc.email,
      password: acc.password,
      department: acc.department,
      description: acc.description,
      studentId: acc.studentId,
    })),
  });
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department, studentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide name, email, and password" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "faculty",
      department: department || "Computer Science",
      studentId: studentId || (role === "student" ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT token
// @access  Public
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user details
// @access  Private (protect middleware)
authRouter.get("/me", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        studentId: req.user.studentId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile", details: error.message });
  }
});
