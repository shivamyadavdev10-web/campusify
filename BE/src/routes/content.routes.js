import express from "express";
import { getStreamUrl } from "../controllers/content.controller.js";

const router = express.Router();

// Route to get the standard HLS stream URL
router.get("/stream/:contentId", getStreamUrl);

export default router;
