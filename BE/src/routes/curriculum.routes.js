import express from "express";
import {
    getBranches, getSemesters, getSubjects, getContents, searchCurriculum,
    getTrendingCourses, getFreeContents, getSingleContentUrl, getFreeStreamUrl, getBanner,
    getDefaultSearchResults
} from "../controllers/curriculum.controller.js";
import { getStreamUrl } from "../controllers/bunny.controller.js";
import { isLoggedIn } from "../middleware/isLoggedIn.middleware.js";
import checkEnrollment from "../middleware/checkEnrollment.middleware.js";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";
import { apiCache } from "../middleware/cache.middleware.js";

const router = express.Router();

// Traffic control (15 min me max 100 requests per IP)
router.use(apiLimiter);

// ==========================================
// STUDENT ROUTES (Optimized with Caching)
// ==========================================

// PUBLIC ROUTE: Banner, Branches, Trending, Free Contents (Cache: 5 mins)
router.get("/banner", apiCache(300), getBanner);
router.get("/branches", apiCache(300), getBranches);
router.get("/courses/trending", apiCache(300), getTrendingCourses);
router.get("/contents/free", apiCache(300), getFreeContents);

// URL generation (Do not cache single content URL dynamically if it generates signed tokens)
router.get("/content-url/:contentId", isLoggedIn, getSingleContentUrl);

// PUBLIC: Stream URL for free content only (Not cached due to stream limits)
router.get("/free-stream-url/:contentId", isLoggedIn, getFreeStreamUrl);

// PAID ROUTE: Check enrollment before generating stream URL (Not cached)
router.get("/stream-url/:contentId", isLoggedIn, checkEnrollment, getStreamUrl);

router.get("/search/featured", isLoggedIn, apiCache(300), getDefaultSearchResults);
router.get("/search", isLoggedIn, searchCurriculum); // Real-time search

// PROTECTED ROUTES: Semesters and Subjects (Cache: 5 mins)
router.get("/semesters/:branchId", isLoggedIn, apiCache(300), getSemesters);
router.get("/subjects/:semesterId", isLoggedIn, apiCache(300), getSubjects);

// PREMIUM ROUTE: Contents list (Cache: 5 mins)
router.get("/contents/:subjectId", isLoggedIn, apiCache(300), getContents);

export default router;
