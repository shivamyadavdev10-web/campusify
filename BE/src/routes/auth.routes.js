import express from "express";
import { 
    registerUser, 
    createSuperAdmin,
    login, 
    logout, 
    verifyOTP, 
    resendOTP,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import validateRequest from "../middleware/validateRequest.middleware.js";
import { 
    registerSchema, 
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema 
} from "../validations/auth.validation.js";


const router = express.Router();

router.post("/register", authLimiter, validateRequest(registerSchema), registerUser);
router.post("/create-super-admin", createSuperAdmin);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/resend-otp", authLimiter, resendOTP);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.post("/forgot-password", authLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validateRequest(resetPasswordSchema), resetPassword);
router.post("/logout", logout);

export default router;