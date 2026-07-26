import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.models.js';
import Semester from './src/models/semester.models.js';
import Branch from './src/models/branch.models.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        // Find or create a branch
        let branch = await Branch.findOne();
        if (!branch) {
            branch = await Branch.create({
                name: "Test Branch",
                shortName: "TB",
                description: "Test Branch",
                isActive: true
            });
            console.log("Created test branch.");
        }

        // Find or create a semester
        let semester = await Semester.findOne();
        if (!semester) {
            semester = await Semester.create({
                branchId: branch._id,
                semNumber: 1,
                title: "Test Semester 1",
                price: 99,
                isPublished: true
            });
            console.log("Created test semester.");
        }

        const testEmail = "testuser_sem@campusify.com";
        let user = await User.findOne({ email: testEmail });
        
        if (!user) {
            user = new User({
                firstName: "Test",
                lastName: "User",
                phoneNo: "9999999999",
                email: testEmail,
                password: "Password@123",
                accountType: "Student",
                isVerified: true,
                purchasedSemesters: []
            });
            console.log("Created new test user.");
        } else {
            console.log("Test user already exists.");
        }

        // Add the semester manually
        if (!user.purchasedSemesters.includes(semester._id)) {
            user.purchasedSemesters.push(semester._id);
            await user.save();
            console.log("Added semester to user manually.");
        } else {
            console.log("Semester already added to user.");
        }

        // Verify it was added
        const updatedUser = await User.findById(user._id).populate('purchasedSemesters');
        console.log("User's purchased semesters:");
        updatedUser.purchasedSemesters.forEach(s => {
            console.log(`- ${s.title} (Sem ${s.semNumber})`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

run();
