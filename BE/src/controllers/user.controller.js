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
            select: "title price thumbnail semNumber isPublished branchId",
            populate: {
                path: "branchId",
                select: "name shortName"
            }
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
            purchasedSemesters: user.purchasedSemesters,
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

// ==========================================
// 3. CHANGE PASSWORD (Authenticated)
// ==========================================
export const changePassword = catchAsync(async (req, res) => {
    const { newPassword, confirmNewPassword } = req.body;
    
    if (!newPassword || !confirmNewPassword) {
        throw new ApiError(400, "Please provide newPassword and confirmNewPassword");
    }
    
    if (newPassword !== confirmNewPassword) {
        throw new ApiError(400, "Passwords do not match");
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
        status: true,
        message: "Password updated successfully"
    });
});

// ==========================================
// 4. SAVE EXPO PUSH TOKEN
// ==========================================
export const savePushToken = catchAsync(async (req, res) => {
    const { pushToken } = req.body;
    
    if (!pushToken) {
        throw new ApiError(400, "pushToken is required");
    }

    await User.findByIdAndUpdate(req.user._id, { pushToken });

    res.status(200).json({
        status: true,
        message: "Push token saved successfully"
    });
});

// ==========================================
// 5. GET MY NOTIFICATIONS
// ==========================================
import Notification from "../models/notification.models.js";

export const getNotifications = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id).select("lastNotificationReadAt");
    
    // In a real app, you might want to filter by targetAudience. For now, fetch all active.
    const notifications = await Notification.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Calculate unread count
    const unreadCount = notifications.filter(
        (n) => new Date(n.createdAt) > new Date(user.lastNotificationReadAt)
    ).length;

    res.status(200).json({
        status: true,
        data: {
            notifications,
            unreadCount
        }
    });
});

// ==========================================
// 6. MARK NOTIFICATIONS AS READ
// ==========================================
export const markNotificationsRead = catchAsync(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { lastNotificationReadAt: Date.now() });

    res.status(200).json({
        status: true,
        message: "Notifications marked as read"
    });
});