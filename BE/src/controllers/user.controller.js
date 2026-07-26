import User from "../models/user.models.js";
import catchAsync from "../utils/catchAsync.utils.js";
import ApiError from "../utils/apiError.utils.js";
import Transaction from "../models/transaction.models.js";

// ==========================================
// 1. GET MY PROFILE & PURCHASED COURSES
// ==========================================
export const getMyProfile = catchAsync(async (req, res) => {
    // ⚡ OPTIMIZED: Use select to prevent fetching password/OTP fields implicitly, and .lean() for speed
    const user = await User.findById(req.user._id)
        .select("firstName lastName email phoneNo accountType isVerified purchasedSemesters")
        .populate({
            path: "purchasedSemesters",
            select: "title price thumbnail semNumber isPublished" 
        })
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json({
        status: true,
        message: "Profile and purchased courses fetched successfully",
        data: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNo: user.phoneNo,
            accountType: user.accountType,
            isVerified: user.isVerified,
            totalPurchased: user.purchasedSemesters.length,
            myCourses: user.purchasedSemesters 
        }
    });
});

// ==========================================
// 2. GET MY PAYMENTS / TRANSACTIONS
// ==========================================
export const getMyPayments = catchAsync(async (req, res) => {
    // Find all successful or pending transactions belonging to this user
    const payments = await Transaction.find({ userId: req.user._id })
        .populate({
            path: 'semesterId', // Populates the title of the course they bought
            select: 'title'
        })
        .sort({ createdAt: -1 }) // Sorts by newest first
        .lean(); // .lean() for faster execution since we only need to read data

    res.status(200).json({ 
        status: true, 
        message: "Payment history fetched successfully",
        payments 
    });
});