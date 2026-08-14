import express from "express";
import { getStreamUrl } from "../controllers/bunny.controller.js";
import { isLoggedIn } from "../middleware/isLoggedIn.middleware.js";
import { streamLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Route to get the standard HLS stream URL
// ⚡ streamLimiter: 20 req/min per IP to prevent abuse on 0.1 vCPU Render
router.get("/stream/:contentId", streamLimiter, isLoggedIn, getStreamUrl);

export default router;
