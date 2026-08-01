import rateLimit from "express-rate-limit";

// Helper: Render ke load balancer se real client IP nikalo
// app.set('trust proxy', 1) already set in app.js — this extracts the real IP correctly
const getRealIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

// 🟢 NORMAL APIS KE LIYE (Jaise courses fetch karna)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute ki window
    max: 100, // Ek IP address se max 100 request (Exam time pe safe zone)
    // FIX: Use real client IP from Render's load balancer headers
    keyGenerator: getRealIp,
    message: { 
        status: false, 
        message: "Too many requests from this IP, please try again after 15 minutes." 
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// 🔴 AUTH APIS KE LIYE (Brute Force aur Hacker attacks rokne ke liye)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ghanta
    max: 10, // Login/Signup par max 10 attempts allowed
    // FIX: Use real client IP from Render's load balancer headers
    keyGenerator: getRealIp,
    message: { 
        status: false, 
        message: "Too many login attempts. For security reasons, please try again after an hour." 
    },
    standardHeaders: true,
    legacyHeaders: false,
});