import express from "express";
// ⚡ Purane controllers hata kar naya single controller import kiya
import { getMyProfile,getMyPayments } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middleware/isLoggedIn.middleware.js";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Middleware Rule: Is file ke saare routes par API limit aur Login guard lagega
router.use(apiLimiter);
router.use(isLoggedIn);

// 🛡️ PROTECTED ROUTE: Dashboard data (Profile details + Purchased Courses)
router.get("/me", getMyProfile);
router.get("/payments",getMyPayments);

export default router;