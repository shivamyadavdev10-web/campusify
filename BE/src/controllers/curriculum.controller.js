import Branch from "../models/branch.models.js";
import Semester from "../models/semester.models.js";
import Subject from "../models/subject.models.js";
import Content from "../models/content.models.js";
import Banner from "../models/banner.models.js";
import catchAsync from "../utils/catchAsync.utils.js";
import ApiError from "../utils/apiError.utils.js";

// ========================================================
// 📱 STUDENT APIs (App / Frontend Display)
// ========================================================

// 🏫 Step 1: App khulte hi Branches dikhana
export const getBranches = catchAsync(async (req, res) => {
    const branches = await Branch.find({ isActive: true });
    res.status(200).json({ status: true, branches });
});

// 📅 Step 2: Branch select hone par Semesters dikhana
export const getSemesters = catchAsync(async (req, res) => {
    const { branchId } = req.params;
    const semesters = await Semester.find({ branchId, isPublished: true }).sort({ semNumber: 1 });
    res.status(200).json({ status: true, semesters });
});

// 📚 Step 3: Semester select hone par uske Subjects dikhana
export const getSubjects = catchAsync(async (req, res) => {
    const { semesterId } = req.params;
    const subjects = await Subject.find({ semesterId, isActive: true }).sort({ orderSequence: 1 });
    res.status(200).json({ status: true, subjects });
});

// 🚀 Step 4: Subject click hone par Videos & Notes dikhana (SMART LOCK LOGIC)
export const getContents = catchAsync(async (req, res) => {
    const { subjectId } = req.params;
    
    const subject = await Subject.findById(subjectId);
    if (!subject) throw new ApiError(404, "Subject not found");

    // Check if user has purchased this semester
    const hasPurchased = req.user.purchasedSemesters.some(
        semId => semId.toString() === subject.semesterId.toString()
    );

    // Fetch contents
    const contents = await Content.find({ subjectId })
        .select('+fileKey +bunnyLibraryId') // Include both sensitive fields for processing
        .sort({ orderSequence: 1, createdAt: 1 });

    // Default library ID fallback for content that was created before bunnyLibraryId field existed
    const defaultLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

    const processedContent = contents.map(item => {
        const isUnlocked = item.isFree || hasPurchased; 

        let finalUrl = null;
        let bunnyVideoId = null;
        let bunnyLibraryId = null;
        const actualKey = item.fileKey;
        
        if (isUnlocked && actualKey) {
            if (actualKey.startsWith('http')) {
                finalUrl = actualKey; // Direct link (e.g. external PDF)
            } else if (item.type === 'video') {
                bunnyVideoId = actualKey; // Only send bunnyVideoId for videos
                // Use stored library ID, or fall back to the current env var
                bunnyLibraryId = item.bunnyLibraryId || defaultLibraryId;
            } else {
                finalUrl = `/uploads/${actualKey}`;
            }
        }

        return {
            _id: item._id,
            title: item.title,
            type: item.type,
            category: item.category,
            unit: item.unit,
            duration: item.duration,
            isFree: item.isFree,
            orderSequence: item.orderSequence,
            isLocked: !isUnlocked, 
            fileUrl: finalUrl,
            bunnyVideoId: bunnyVideoId,
            bunnyLibraryId: bunnyLibraryId, // Per-video library ID for correct embed URL
        };
    });

    res.status(200).json({ 
        status: true, 
        isSemesterPurchased: hasPurchased, 
        contents: processedContent 
    });
});

// ========================================================
// 🔍 ULTRA-OPTIMIZED Global Search API
// ========================================================
export const searchCurriculum = catchAsync(async (req, res) => {
    const { q, branch } = req.query; 

    // Agar search bar khali hai
    if (!q || q.trim() === "") {
        return res.status(200).json({ status: true, semesters: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    // Base query: Jo published hain wahi dikhane hain
    let matchQuery = { isPublished: true };

    // 🚀 DB OPTIMIZATION LOGIC
    if (branch && branch !== 'all') {
        // SCENARIO 1: Specific branch selected (e.g., Computer)
        // ⚡ Bypass Branch search completely. Ultra-fast query!
        matchQuery.branchId = branch;
        matchQuery.title = searchRegex;

    } else {
        // SCENARIO 2: "All Branches" selected
        // Pehle active branches me dhoondho
        const matchingBranches = await Branch.find({
            isActive: true,
            $or: [
                { name: searchRegex },
                { shortName: searchRegex }
            ]
        }).select('_id');
        
        const branchIds = matchingBranches.map(b => b._id);

        // Matching branch ke semesters ya title matching semesters laao
        matchQuery.$or = [
            { title: searchRegex },
            { branchId: { $in: branchIds } } 
        ];
    }

    // ⚡ Execute the final optimized query
    const semesters = await Semester.find(matchQuery)
    .populate({
        path: 'branchId',
        select: 'name shortName' // Frontend cards ke liye
    })
    .sort({ semNumber: 1 });

    res.status(200).json({ 
        status: true, 
        message: "Search successful",
        semesters 
    });
});

// ========================================================
// 🌟 NEW HOME SCREEN APIs (Trending Courses & Free Contents)
// ========================================================

// 🔥 Latest Courses (Trending) - Shows latest 6 published semesters
export const getTrendingCourses = catchAsync(async (req, res) => {
    const courses = await Semester.find({ isPublished: true })
        .populate({
            path: 'branchId',
            select: 'name shortName'
        })
        .sort({ createdAt: -1 })
        .limit(6);
        
    res.status(200).json({ status: true, courses });
});

// 🎁 Free Demo Lectures - Shows latest 10 free videos/contents
export const getFreeContents = catchAsync(async (req, res) => {
    const contents = await Content.find({ isFree: true })
        .select('+fileKey +bunnyLibraryId')
        .populate({
            path: 'subjectId',
            select: 'name semesterId'
        })
        .sort({ createdAt: -1 })
        .limit(10);

    const defaultLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
        
    const processedContent = contents.map(item => {
        let finalUrl = null;
        let bunnyVideoId = null;
        let bunnyLibraryId = null;
        const actualKey = item.fileKey;
        
        if (actualKey) {
            if (actualKey.startsWith('http')) {
                finalUrl = actualKey;
            } else if (item.type === 'video') {
                bunnyVideoId = actualKey;
                bunnyLibraryId = item.bunnyLibraryId || defaultLibraryId;
            } else {
                finalUrl = `/uploads/${actualKey}`;
            }
        }
        
        return {
            _id: item._id,
            title: item.title,
            type: item.type,
            duration: item.duration,
            isFree: item.isFree,
            fileUrl: finalUrl,
            bunnyVideoId: bunnyVideoId,
            bunnyLibraryId: bunnyLibraryId,
            subjectId: item.subjectId
        };
    });
        
    res.status(200).json({ status: true, contents: processedContent });
});

// 🎥 Fetch Single Content Signed URL (Fallback for Video Player)
export const getSingleContentUrl = catchAsync(async (req, res) => {
    const content = await Content.findById(req.params.contentId).select('+fileKey +bunnyLibraryId');
    if (!content) throw new ApiError(404, "Content not found");
    
    const defaultLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    let finalUrl = null;
    let bunnyVideoId = null;
    let bunnyLibraryId = null;
    const actualKey = content.fileKey;
    
    if (actualKey) {
        if (actualKey.startsWith('http')) {
            finalUrl = actualKey;
        } else if (content.type === 'video') {
            bunnyVideoId = actualKey;
            bunnyLibraryId = content.bunnyLibraryId || defaultLibraryId;
        } else {
            finalUrl = `/uploads/${actualKey}`;
        }
    }
    
    res.status(200).json({ status: true, fileUrl: finalUrl, bunnyVideoId, bunnyLibraryId });
});

// 🎥 Stream URL for free content
export const getFreeStreamUrl = catchAsync(async (req, res) => {
    const content = await Content.findById(req.params.contentId).select('+fileKey');
    if (!content) throw new ApiError(404, "Content not found");
    if (!content.isFree) throw new ApiError(403, "This content requires enrollment");
    
    // Return bunny stream URL for free content
    const bunnyVideoId = content.fileKey;
    const hostname = (process.env.BUNNY_STREAM_HOSTNAME || '').replace(/^https?:\/\//, '');
    const videoUrl = `https://${hostname}/${bunnyVideoId}/playlist.m3u8`;
    const videoDirectUrl = `https://${hostname}/${bunnyVideoId}/play_720p.mp4`;
    
    res.status(200).json({ success: true, videoUrl, videoDirectUrl });
});

// 🖼️ Fetch Active Banner for Home Screen
export const getBanner = catchAsync(async (req, res) => {
    // Only return the latest active banner (or limit 1)
    const banner = await Banner.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ status: true, banner });
});