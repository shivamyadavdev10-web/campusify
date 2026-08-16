import express from "express";
import { 
    getDashboardStats, manualAccessOverride, bulkStudentUpload,
    createBranch, createSemester, createSubject, uploadCourseContent, semesterPublish,
    unlockDevice, toggleBanUser, getSuspiciousActivity, checkUserPassword, reorderSubjects,
    toggleContentFreeStatus, uploadBanner, toggleBanner, deleteBanner, updateUserPassword, createContent
} from "../controllers/admin.controller.js";
import { isLoggedIn, isAdmin } from "../middleware/isLoggedIn.middleware.js";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";
import { upload } from "../middleware/upload.middleware.js"; // ✅ Multer Config Activated

const router = express.Router();

// 🛡️ Apply Global Admin Constraints
router.use(apiLimiter);
router.use(isLoggedIn, isAdmin);

// ==========================================
// 📊 DASHBOARD
// ==========================================
router.get("/dashboard-stats", getDashboardStats);

// ==========================================
// 🚨 SECURITY & GOD MODE
// ==========================================
router.post("/security/unlock-device", unlockDevice);
router.post("/security/toggle-ban", toggleBanUser);
router.get("/security/suspicious-logs", getSuspiciousActivity);
router.post("/security/reveal-password", checkUserPassword);

// ==========================================
// 👥 USERS & ACCESS MANAGEMENT
// ==========================================
router.post("/users/manual-access", manualAccessOverride);
router.post("/users/bulk-upload", upload.single('file'), bulkStudentUpload); // ✅ Bulk Upload Active
router.post("/users/update-password", updateUserPassword);

// ==========================================
// 📚 CURRICULUM OPERATIONS
// ==========================================
router.post("/branch", createBranch);
router.post("/semester", createSemester);
router.post("/subject", createSubject);
router.patch("/subject/reorder", reorderSubjects);
router.patch("/semester/:semesterId/toggle-publish", semesterPublish);

// ==========================================
// 🎬 MEDIA UPLOAD
// ==========================================
router.post("/content", upload.single("file"), uploadCourseContent);
router.post("/content/add", createContent);
router.patch("/content/:contentId/toggle-free", toggleContentFreeStatus);
router.post("/banner", upload.single("file"), uploadBanner); // ✅ Banner Upload
router.patch("/banner/:bannerId/toggle", toggleBanner); // ✅ Toggle Banner Active/Inactive
router.delete("/banner/:bannerId", deleteBanner); // ✅ Delete Banner

export default router;