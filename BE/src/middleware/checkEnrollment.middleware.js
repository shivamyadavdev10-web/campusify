import ApiError from "../utils/apiError.utils.js";
import catchAsync from "../utils/catchAsync.utils.js";
import Subject from "../models/subject.models.js"; 
import Content from "../models/content.models.js";

const checkEnrollment = catchAsync(async (req, res, next) => {
    // 1. Admin Bypass (Aapke liye sab open hai)
    if (req.user && req.user.accountType === "Admin") {
        return next();
    }

    // 2. URL params ya body se IDs nikalna
    const semesterId = req.params.semesterId || req.body.semesterId;
    const subjectId = req.params.subjectId || req.body.subjectId;
    const contentId = req.params.contentId || req.body.contentId;

    let targetSemesterId = semesterId;

    // 3. SMART RESOLUTION: Agar contentId mila (e.g. video streaming route)
    if (contentId && !targetSemesterId) {
        const content = await Content.findById(contentId).populate('subjectId');
        if (!content) {
            return next(new ApiError(404, "Content not found."));
        }
        // ⚡ If content is free, skip enrollment check
        if (content.isFree) {
            return next();
        }
        if (content.subjectId) {
             targetSemesterId = content.subjectId.semesterId;
        }
    }

    // 4. Agar sirf subjectId mila (e.g. content list route)
    if (subjectId && !targetSemesterId) {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return next(new ApiError(404, "Subject not found."));
        }
        targetSemesterId = subject.semesterId;
    }

    if (!targetSemesterId) {
        return next(new ApiError(400, "Could not determine the semester for this request."));
    }

    // 4. VERIFICATION: Student ka purchasedSemesters array check karna
    if (!req.user.purchasedSemesters || req.user.purchasedSemesters.length === 0) {
        return next(new ApiError(403, "Access Denied. You haven't purchased any courses yet."));
    }

    const isEnrolled = req.user.purchasedSemesters.some(
        (enrolledSemId) => enrolledSemId.toString() === targetSemesterId.toString()
    );

    // 5. GOOGLE-SAFE REJECTION MESSAGE (Anti-piracy)
    if (!isEnrolled) {
        return next(new ApiError(
            403, 
            "Access Denied. This course is locked. Please visit our official website to manage your enrollments."
        ));
    }

    // Validation pass ho gaya, video/content play karne do
    next();
});

export default checkEnrollment;