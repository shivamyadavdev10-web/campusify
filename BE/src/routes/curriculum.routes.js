import express from "express";
import {
    getBranches, getSemesters, getSubjects, getContents, searchCurriculum,
    getTrendingCourses, getFreeContents, getSingleContentUrl, getFreeStreamUrl, getBanner
} from "../controllers/curriculum.controller.js";
import { getStreamUrl } from "../controllers/bunny.controller.js";
import { isLoggedIn } from "../middleware/isLoggedIn.middleware.js";
import checkEnrollment from "../middleware/checkEnrollment.middleware.js";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Traffic control (15 min me max 100 requests per IP)
router.use(apiLimiter);

// ==========================================
// 📱 STUDENT ROUTES
// ==========================================

// 🟢 PUBLIC ROUTE: Branch bina login ke dekhne do (App display ke liye)
router.get("/banner", getBanner);
router.get("/branches", getBranches);
router.get("/courses/trending", getTrendingCourses);
router.get("/contents/free", getFreeContents);
router.get("/content-url/:contentId", isLoggedIn, getSingleContentUrl);

// 🟢 PUBLIC: Stream URL for free content only
router.get("/free-stream-url/:contentId", isLoggedIn, getFreeStreamUrl);

// 🔒 PAID ROUTE: Check enrollment before generating stream URL
router.get("/stream-url/:contentId", isLoggedIn, checkEnrollment, getStreamUrl);

router.get("/search", isLoggedIn, searchCurriculum);

// 🟡 PROTECTED ROUTES: Semesters aur Subjects dekhne ke liye Free Account (Login) zaruri hai
router.get("/semesters/:branchId", isLoggedIn, getSemesters);
router.get("/subjects/:semesterId", isLoggedIn, getSubjects);

// 🔴 PREMIUM ROUTE: Lock Icon / Unlocked Video dene ka logic ab controller me hai
router.get("/contents/:subjectId", isLoggedIn, getContents);

export default router;