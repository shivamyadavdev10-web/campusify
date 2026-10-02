import Notification from "../models/notification.models.js";
import User from "../models/user.models.js";
import catchAsync from "../utils/catchAsync.utils.js";
import ApiError from "../utils/apiError.utils.js";
import { sendPushNotifications } from "../utils/pushNotification.utils.js";

// ==========================================
// ADMIN: CREATE AND SEND NOTIFICATION
// ==========================================
export const createNotification = catchAsync(async (req, res) => {
    const { title, message, type, branchId, semesterId, url, imageUrl } = req.body;

    if (!title || !message) {
        throw new ApiError(400, "Title and message are required");
    }

    // 1. Save Notification to Database
    const targetAudience = {};
    if (branchId) targetAudience.branchId = branchId;
    if (semesterId) targetAudience.semesterId = semesterId;

    const notification = await Notification.create({
        title,
        message,
        type: type || 'info',
        url,
        imageUrl,
        targetAudience: Object.keys(targetAudience).length > 0 ? targetAudience : undefined
    });

    // 2. Fetch target users' push tokens
    let userQuery = { pushToken: { $ne: null } };
    
    // If targeted, only send to students in that branch/semester
    if (branchId || semesterId) {
        const semQuery = {};
        if (branchId) semQuery.branchId = branchId;
        if (semesterId) semQuery._id = semesterId;
        
        if (semesterId) {
            userQuery.purchasedSemesters = semesterId;
        }
    }

    const users = await User.find(userQuery).select('pushToken');
    const pushTokens = users.map(u => u.pushToken).filter(Boolean);

    // 3. Send Push Notifications via Expo
    if (pushTokens.length > 0) {
        await sendPushNotifications(pushTokens, title, message, {
            notificationId: notification._id,
            type: notification.type,
            url,
            imageUrl
        });
    }

    res.status(201).json({
        status: true,
        message: `Notification created and pushed to ${pushTokens.length} devices`,
        data: notification
    });
});
