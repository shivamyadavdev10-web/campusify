import express from "express";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";
import { isLoggedIn } from "../middleware/isLoggedIn.middleware.js";

const router = express.Router();

// Payment operations ke liye login mandatory hai
router.use(isLoggedIn);

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

export default router;