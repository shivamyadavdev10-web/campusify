import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './src/models/user.models.js';
import Semester from './src/models/semester.models.js'; // MUST import for populate to work
import Branch from './src/models/branch.models.js';

dotenv.config();

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const testEmail = "testuser_sem@campusify.com";
        const user = await User.findOne({ email: testEmail }).select('+password +otp +isVerified +isBanned').populate('purchasedSemesters');

        if (!user) {
            console.log("User not found.");
            return;
        }

        // Test Password Match
        const isMatch = user.comparePassword("Password@123");
        if (isMatch) {
            console.log("✅ Password matched perfectly.");
        } else {
            console.log("❌ Password mismatch.");
        }

        // Test JWT Generation
        const accessToken = jwt.sign(
            { id: user._id },
            process.env.ACCESSTOKEN_SECRET || "ShivCampusifyAccessSecret999",
            { expiresIn: process.env.ACCESSTOKEN_EXPIRY || "1d" }
        );

        if (accessToken) {
            console.log("✅ Access token generated successfully.");
        }

        console.log("✅ User Dashboard Data:");
        console.log("Name:", user.firstName, user.lastName);
        console.log("Email:", user.email);
        console.log("Purchased Semesters:", user.purchasedSemesters.map(s => s.title).join(", "));
        
    } catch (error) {
        console.error("Error during test:", error);
    } finally {
        await mongoose.disconnect();
    }
}

testLogin();
