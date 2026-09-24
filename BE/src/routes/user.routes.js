import express from "express";
// ⚡ Purane controllers hata kar naya single controller import kiya
import { getMyProfile,getMyPayments, changePassword, savePushToken, getNotifications, markNotificationsRead } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middleware/isLoggedIn.middleware.js";
import { apiLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Middleware Rule: Is file ke saare routes par API limit aur Login guard lagega
router.use(apiLimiter);
router.use(isLoggedIn);

router.get("/me", getMyProfile);
router.get("/payments",getMyPayments);
router.post("/change-password", changePassword);

// Push Notifications
router.post("/push-token", savePushToken);
router.get("/notifications", getNotifications);
router.put("/notifications/read", markNotificationsRead);

export default router;