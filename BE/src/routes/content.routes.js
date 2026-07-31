import express from "express";
import { getStreamUrl } from "../controllers/content.controller.js";
import { isLoggedIn } from "../middleware/isLoggedIn.middleware.js";

const router = express.Router();

// Route to get the standard HLS stream URL
router.get("/stream/:contentId", isLoggedIn, getStreamUrl);

export default router;
