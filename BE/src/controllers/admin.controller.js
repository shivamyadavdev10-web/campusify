import Branch from "../models/branch.models.js";
import Semester from "../models/semester.models.js";
import Subject from "../models/subject.models.js";
import Content from "../models/content.models.js";
import Banner from "../models/banner.models.js";
import User, { decryptPassword } from "../models/user.models.js"; 
import catchAsync from "../utils/catchAsync.utils.js";
import ApiError from "../utils/apiError.utils.js";
import csv from 'csvtojson'; 
import fs from 'fs'; // 👈 Added 'fs' for safe temp file cleanup
import axios from 'axios';
import { createBunnyVideo, uploadBunnyVideo, deleteBunnyVideo } from '../config/bunny.js';
// ==========================================
// 📊 1. DASHBOARD STATS (Ultra Optimized)
// ==========================================
export const getDashboardStats = catchAsync(async (req, res) => {
    // Parallel fetching for blazing fast dashboard load
    const [totalStudents, totalBranches, totalSemesters, totalSubjects, totalContent, recentlyActive] = await Promise.all([
        User.countDocuments({ accountType: "Student" }),
        Branch.countDocuments(),
        Semester.countDocuments(),
        Subject.countDocuments(),
        Content.countDocuments(),
        User.countDocuments({ "currentDevice.loggedInAt": { $gte: new Date(Date.now() - 24*60*60*1000) } })
    ]);

    res.status(200).json({
        status: true,
        data: {
            users: { total: totalStudents, activeLast24h: recentlyActive },
            content: { branches: totalBranches, semesters: totalSemesters, subjects: totalSubjects, files: totalContent },
            revenue: { note: "Sales graph data will sync with Razorpay module" }
        }
    });
});

// ==========================================
// 🛡️ 2. SECURITY & DEVICE MANAGEMENT
// ==========================================
export const unlockDevice = catchAsync(async (req, res) => {
    const { email } = req.body;
    // $unset removes the device and cooldown, $set resets the penalty count
    const user = await User.findOneAndUpdate(
        { email }, 
        { 
            $unset: { currentDevice: 1, cooldownUntil: 1 },
            $set: { deviceSwitchCount: 0 }
        }, 
        { new: true }
    );
    if (!user) throw new ApiError(404, "Student not found");
    res.status(200).json({ status: true, message: `Device lock removed for ${email}. They can now login on a new device.` });
});

export const toggleBanUser = catchAsync(async (req, res) => {
    const { email, banDays, reason } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "Student not found");

    if (user.isBanned) {
        // UNBAN
        user.isBanned = false;
        user.banReason = null;
        user.banUntil = null;
    } else {
        // BAN & FORCE LOGOUT
        user.isBanned = true;
        user.banReason = reason || "Violation of policies";
        user.banUntil = banDays ? new Date(Date.now() + banDays * 24 * 60 * 60 * 1000) : null;
        user.currentDevice = undefined; // Boot them out instantly
    }
    await user.save(); // Triggers optimistic concurrency

    res.status(200).json({ 
        status: true, 
        message: `User is now ${user.isBanned ? 'BANNED 🛑' : 'UNBANNED ✅'}`, 
        banDetails: { reason: user.banReason, until: user.banUntil }
    });
});

export const getSuspiciousActivity = catchAsync(async (req, res) => {
    // .lean() drops mongoose wrappers, making this query 3x faster for logs
    const logs = await User.find({ isBanned: true })
        .select('email firstName banReason banUntil updatedAt')
        .lean();
    res.status(200).json({ status: true, suspiciousAccounts: logs });
});

// 🤫 SECRET PASSWORD CHECKER (Admin Use Only)
export const checkUserPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+password').lean();
    if (!user) throw new ApiError(404, "User not found");

    const plainPassword = decryptPassword(user.password);
    res.status(200).json({ status: true, email: user.email, decryptedPassword: plainPassword });
});

// ==========================================
// 💰 3. MANUAL ACCESS & BULK UPLOAD
// ==========================================
export const manualAccessOverride = catchAsync(async (req, res) => {
    const { userId, email, semesterId, action = 'grant' } = req.body; // default to grant if undefined
    
    // Find by email or userId depending on what's passed
    const query = userId ? { _id: userId } : { email };

    // Optimized operator injection
    const updateCommand = action === 'grant' 
        ? { $addToSet: { purchasedSemesters: semesterId } } 
        : { $pull: { purchasedSemesters: semesterId } };

    const updated = await User.findOneAndUpdate(query, updateCommand, { new: true });
    if (!updated) throw new ApiError(404, "User not found");

    const identifier = email || updated.email || userId;
    res.status(200).json({ status: true, message: `Course ${action} successful for ${identifier}.` });
});

export const bulkStudentUpload = catchAsync(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Please upload a CSV file");
    
    const jsonArray = await csv().fromFile(req.file.path);
    let successCount = 0;
    let failCount = 0;

    // Running sequentially to ensure pre('save') GCM encryption triggers safely
    for (const doc of jsonArray) {
        try {
            const exists = await User.exists({ email: doc.email });
            if (!exists) {
                const newUser = new User(doc);
                await newUser.save(); // Password gets encrypted here securely
                successCount++;
            } else {
                failCount++; // Skip existing users to prevent overwriting
            }
        } catch (err) {
            failCount++;
        }
    }
    
    // Cleanup temp CSV file
    try {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    } catch (e) {
        console.error('Error cleaning up CSV file', e);
    }

    res.status(200).json({ 
        status: true, 
        message: "Bulk upload processed", 
        stats: { uploaded: successCount, skippedOrFailed: failCount } 
    });
});

// ==========================================
// 📚 4. CURRICULUM SETUP & REORDERING
// ==========================================
export const createBranch = catchAsync(async (req, res) => {
    const branch = await Branch.create(req.body);
    res.status(201).json({ status: true, message: "Branch created", branch });
});

export const createSemester = catchAsync(async (req, res) => {
    const semester = await Semester.create(req.body);
    res.status(201).json({ status: true, message: "Semester created", semester });
});

export const createSubject = catchAsync(async (req, res) => {
    const subject = await Subject.create(req.body);
    res.status(201).json({ status: true, message: "Subject created", subject });
});

// 🔄 REORDER SUBJECTS / UNITS
export const reorderSubjects = catchAsync(async (req, res) => {
    const { orderedIds } = req.body; 
    
    // bulkWrite is the most efficient way to update multiple documents concurrently
    const bulkOps = orderedIds.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { orderSequence: index } } }
    }));
    await Subject.bulkWrite(bulkOps);
    
    res.status(200).json({ status: true, message: "Course Sequence Updated successfully" });
});

// ==========================================
// 🚀 5. CONTENT UPLOAD & VISIBILITY
// ==========================================
export const uploadCourseContent = catchAsync(async (req, res) => {
    // Strict Multer File Check at the very beginning
    if (!req.file) {
        return res.status(400).json({ status: false, message: "No file was uploaded or Multer failed to process it." });
    }

    // 👈 Postman se ab 'type', 'orderSequence', 'unit', aur 'category' ayega
    // bunnyCollectionId is optional — when set, the video is placed into a
    // Bunny Stream Collection (subject folder) on Bunny.net
    const { branchId, semesterId, subjectId, unit, title, type, orderSequence, category, bunnyCollectionId } = req.body;

    // Strict validation check
    if (!subjectId || !unit || !title || !type) {
        // Validation fail hone par local file hata do
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        throw new ApiError(400, "Missing required fields (subjectId, unit, title, type).");
    }

    console.log(`\n📥 Received file: ${req.file.originalname} | Preparing for CDN...`);

    let fileUrl = req.file.filename;
    let finalFileKey = req.file.filename;
    let sanitizedVideoId = null; // Track for cleanup on DB failure

    if (type.toLowerCase() === "video") {
        try {
            console.log("🚀 Initiating Bunny Stream Upload via service...");
            
            // 1. Create a video object in Bunny Stream (optionally in a collection)
            const videoId = await createBunnyVideo(title, bunnyCollectionId || null);
            // Defensive: strip any accidental library prefix from the GUID
            sanitizedVideoId = videoId.includes('/') ? videoId.split('/').pop() : videoId;
            console.log(`✅ Video object created with ID: ${sanitizedVideoId}`);

            // 2. Upload the actual video file binary
            try {
                await uploadBunnyVideo(sanitizedVideoId, req.file.path);
                console.log(`✅ Video uploaded to Bunny Stream successfully!`);
            } catch (uploadError) {
                // ⚡ Upload failed — clean up the orphaned video object on Bunny
                console.error("❌ Video binary upload failed. Cleaning up orphaned Bunny video...");
                try {
                    await deleteBunnyVideo(sanitizedVideoId);
                    console.log(`🗑️ Orphaned video ${sanitizedVideoId} deleted from Bunny.`);
                } catch (cleanupError) {
                    console.error("⚠️ Failed to cleanup orphaned Bunny video:", cleanupError.message);
                }
                throw uploadError; // Re-throw to hit the outer catch
            }

            // Use Bunny Video ID as the fileKey
            finalFileKey = sanitizedVideoId;
            const hostname = (process.env.BUNNY_STREAM_HOSTNAME || '').replace(/^https?:\/\//, '').trim();
            fileUrl = `https://${hostname}/${sanitizedVideoId}/playlist.m3u8`;

        } catch (error) {
            console.error("FULL UPLOAD ERROR:", error.response ? error.response.data : error.message);
            return res.status(500).json({
                status: false,
                message: "Failed to upload video to Bunny CDN. No database entry was created.",
                errorDetail: error.response?.data || error.message || "Unknown error"
            });
        } finally {
            // Guaranteed cleanup on success or failure for video files
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }
    }

    try {
        // Save the returned Live URL to Database
        const newContent = await Content.create({ 
            subjectId,
            unit,
            title, 
            type: type.toLowerCase(),          
            category: category || "Resources", 
            orderSequence: orderSequence || 1, 
            fileKey: finalFileKey,
            // Persist which Bunny library this video was uploaded to
            bunnyLibraryId: type.toLowerCase() === 'video' ? (process.env.BUNNY_STREAM_LIBRARY_ID || null) : null,
            // Persist the Bunny Collection (subject folder) this video was placed in
            bunnyCollectionId: type.toLowerCase() === 'video' ? (bunnyCollectionId || null) : null,
            fileUrl: fileUrl,  
            isPublished: true 
        });

        res.status(201).json({ 
            status: true, 
            message: `${type} Content Uploaded Successfully! 🎉`, 
            data: newContent 
        });
    } catch (dbError) {
        // ⚡ DB save failed — clean up the already-uploaded Bunny video to prevent orphans
        if (type.toLowerCase() === "video" && sanitizedVideoId) {
            console.error("❌ DB save failed after Bunny upload. Cleaning up Bunny video...");
            try {
                await deleteBunnyVideo(sanitizedVideoId);
                console.log(`🗑️ Bunny video ${sanitizedVideoId} deleted after DB failure.`);
            } catch (cleanupError) {
                console.error("⚠️ Failed to cleanup Bunny video after DB error:", cleanupError.message);
            }
        }
        // If DB insertion fails, prevent disk bloat for non-video files
        if (type.toLowerCase() !== "video" && req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        throw new ApiError(500, "Database error: Failed to save content record. Bunny video was cleaned up.");
    }
});

export const createContent = catchAsync(async (req, res) => {
    const { subjectId, unit, title, type, category, fileKey, bunnyLibraryId, bunnyCollectionId, duration, isFree, orderSequence } = req.body;

    // Validate required fields
    if (!subjectId || !unit || !title || !type || orderSequence === undefined) {
        throw new ApiError(400, "Missing required fields: subjectId, unit, title, type, orderSequence.");
    }

    // Sanitize fileKey: strip accidental library prefix
    const sanitizedFileKey = fileKey && fileKey.includes('/') ? fileKey.split('/').pop() : fileKey;

    // Create the content with the Bunny fileKey, library ID, and collection ID
    const newContent = await Content.create({
        subjectId,
        unit,
        title,
        type: type.toLowerCase(),
        category: category || "Resources",
        fileKey: sanitizedFileKey,
        // Accept explicit bunnyLibraryId from body, or fall back to the current env var
        bunnyLibraryId: type.toLowerCase() === 'video'
            ? (bunnyLibraryId || process.env.BUNNY_STREAM_LIBRARY_ID || null)
            : null,
        // Accept explicit bunnyCollectionId from body (subject folder on Bunny)
        bunnyCollectionId: type.toLowerCase() === 'video'
            ? (bunnyCollectionId || null)
            : null,
        duration,
        isFree: isFree || false,
        orderSequence
    });

    // Remove the fileKey from the response object to prevent leaking
    const contentResponse = newContent.toObject();
    delete contentResponse.fileKey;

    res.status(201).json({
        status: true,
        message: "Content linked and added successfully!",
        data: contentResponse
    });
});
export const semesterPublish = catchAsync(async (req, res) => {
    const semester = await Semester.findById(req.params.semesterId);
    if (!semester) throw new ApiError(404, "Semester not found");

    semester.isPublished = !semester.isPublished;
    await semester.save();
    res.status(200).json({ status: true, message: `Semester is now ${semester.isPublished ? "Public 🟢" : "Hidden 🔴"}` });
});

export const toggleContentFreeStatus = catchAsync(async (req, res) => {
    const content = await Content.findById(req.params.contentId);
    if (!content) throw new ApiError(404, "Content not found");

    content.isFree = !content.isFree;
    await content.save();
    res.status(200).json({ 
        status: true, 
        message: `Content is now ${content.isFree ? "Free 🟢" : "Paid 🔴"}`, 
        data: content 
    });
});

// ==========================================
// 🖼️ BANNER MANAGEMENT (Multiple Banners Supported)
// ==========================================

// Upload new banner — now supports multiple active banners
export const uploadBanner = catchAsync(async (req, res) => {
    let imageUrl = req.body.imageUrl;
    
    if (req.file) {
        console.log(`\n📥 Received banner file: ${req.file.originalname}`);
        imageUrl = req.file.filename;
    }

    if (!imageUrl) {
        throw new ApiError(400, "Please provide an image file or imageUrl for the banner.");
    }

    // Create new active banner (purane banners active rahenge)
    const banner = await Banner.create({
        imageUrl,
        title: req.body.title || "",
        subtitle: req.body.subtitle || "",
        actionUrl: req.body.actionUrl || "",
        isActive: true
    });

    res.status(201).json({ status: true, message: "Banner uploaded successfully", banner });
});

// Toggle banner active/inactive status
export const toggleBanner = catchAsync(async (req, res) => {
    const { bannerId } = req.params;
    const banner = await Banner.findById(bannerId);
    if (!banner) throw new ApiError(404, "Banner not found.");

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({ status: true, message: `Banner ${banner.isActive ? 'activated' : 'deactivated'}`, banner });
});

// Delete a banner permanently
export const deleteBanner = catchAsync(async (req, res) => {
    const { bannerId } = req.params;
    const banner = await Banner.findByIdAndDelete(bannerId);
    if (!banner) throw new ApiError(404, "Banner not found.");

    res.status(200).json({ status: true, message: "Banner deleted successfully" });
});

// ==========================================
// 🔑 CHANGE USER/ADMIN PASSWORD DIRECTLY
// ==========================================
export const updateUserPassword = catchAsync(async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        throw new ApiError(400, "Please provide userId and newPassword.");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Assigning new password. The pre-save hook in user.models.js will automatically encrypt it!
    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
        status: true, 
        message: `Password for ${user.email} has been successfully changed!` 
    });
});