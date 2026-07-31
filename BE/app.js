// 1. Environment Variables sabse pehle load hone chahiye
import dotenv from "dotenv";
dotenv.config({ path: './.env' }); 

import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/database.js"; // DB Connector
import errorHandler from "./src/middleware/errorHandler.middleware.js";
import ApiError from "./src/utils/apiError.utils.js";
import adminRoutes from "./src/routes/admin.routes.js"; 
const app = express();

// Trust proxy for Render load balancer to pass correct IP to express-rate-limit
app.set('trust proxy', 1);

// ==========================================
// 2. GLOBAL MIDDLEWARES (Security & Parsing)
// ==========================================
const ALLOWED_ORIGINS = [
    'https://campusifyplus.in',
    'https://admin.campusifyplus.in',
    'http://localhost:3000',
    'http://localhost:8081', // React Native Expo web
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Browser ko Cookies accept karne ki permission
    exposedHeaders: ['x-new-access-token', 'x-new-refresh-token'] // 🔑 Allow Frontend to read new tokens
}));

app.use(express.json({ limit: "16mb" })); // JSON body parse karne ke liye
app.use(express.urlencoded({ extended: true, limit: "16mb" })); // URL data parse karne ke liye
app.use(cookieParser()); // req.cookies padhne ke liye
app.use(compression());


// ==========================================
// 3. ROUTE IMPORTS
// ==========================================
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import curriculumRoutes from "./src/routes/curriculum.routes.js";
import contentRoutes from "./src/routes/content.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";

// ==========================================
// 4. ROUTE DECLARATIONS (Mounting)
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api/content", contentRoutes);
app.use("/api/payment", paymentRoutes);




// ==========================================
// 5. 404 ROUTE CATCHER
// ==========================================
// Agar koi hacker aisi API hit kare jo hai hi nahi
app.all("*", (req, res, next) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found on this server.`));
});


// ==========================================
// 6. GLOBAL ERROR HANDLER
// ==========================================
// Yeh hamesha saare routes ke END me aayega
app.use(errorHandler);


// ==========================================
// 7. STARTING THE SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    // Pehle Database connect karo, phir server start karo
    connectDB()
        .then(() => {
            // '0.0.0.0' add karne se backend pure Wi-Fi network par available ho jayega
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`\n🚀 Server is actively running on Port: ${PORT}`);
                // Console log ko bhi update kar dete hain taaki confusion na ho
                console.log(`🌐 Base API URL: http://0.0.0.0:${PORT}/api`);
                console.log(`📱 For Mobile App, use your IP: http://192.168.1.5:${PORT}/api (or 10.0.2.2 for Android Emulator)`);
            });
        })
        .catch((err) => {
            console.log("❌ Server startup failed due to database issue !!!", err);
        });
}

export default app;