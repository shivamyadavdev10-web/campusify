// import ApiError from "../utils/apiError.utils.js";
// import catchAsync from "../utils/catchAsync.utils.js";
// import Subject from "../models/subject.models.js"; // Subject db ko import kiya for smart resolution

// const checkEnrollment = catchAsync(async (req, res, next) => {
//     // 1. Admin Bypass (Aapke liye sab open hai)
//     if (req.user && req.user.accountType === "Admin") {
//         return next();
//     }

//     // 2. URL params ya body se IDs nikalna
//     const semesterId = req.params.semesterId || req.body.semesterId;
//     const subjectId = req.params.subjectId || req.body.subjectId;

//     let targetSemesterId = semesterId;

//     // 3. SMART RESOLUTION: Agar student video route hit kar raha hai toh usme sirf subjectId hota hai
//     // Toh database me check karenge ki yeh subject kis semester ka hai.
//     if (subjectId && !targetSemesterId) {
//         const subject = await Subject.findById(subjectId);
//         if (!subject) {
//             return next(new ApiError(404, "Subject not found."));
//         }
//         targetSemesterId = subject.semesterId;
//     }

//     if (!targetSemesterId) {
//         return next(new ApiError(400, "Could not determine the semester for this request."));
//     }

//     // 4. VERIFICATION: Student ka purchasedSemesters array check karna
//     if (!req.user.purchasedSemesters || req.user.purchasedSemesters.length === 0) {
//         return next(new ApiError(403, "Access Denied. You haven't purchased any courses yet."));
//     }

//     // Mongoose ke ObjectIds ko compare karne ke liye .toString() karna best practice hai
//     const isEnrolled = req.user.purchasedSemesters.some(
//         (enrolledSemId) => enrolledSemId.toString() === targetSemesterId.toString()
//     );

//     // 5. GOOGLE-SAFE REJECTION MESSAGE (Anti-piracy)
//     if (!isEnrolled) {
//         return next(new ApiError(
//             403, 
//             "Access Denied. This course is locked. Please visit our official website to manage your enrollments."
//         ));
//     }

//     // Validation pass ho gaya, video/content play karne do
//     next();
// });

// export default checkEnrollment;