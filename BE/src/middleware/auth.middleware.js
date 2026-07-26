// npm install node-cache
// import jwt from "jsonwebtoken";
// import User from "../models/user.models.js";
// import catchAsync from "../utils/catchAsync.utils.js";
// import ApiError from "../utils/apiError.utils.js";

// // ==========================================
// // 1. PROTECT (Login Check Bouncer)
// // ==========================================
// export const protect = catchAsync(async (req, res, next) => {
//     let token;
    
//     if (req.cookies && req.cookies.accessToken) {
//         token = req.cookies.accessToken;
//     } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//         token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//         throw new ApiError(401, "You are not logged in! Please log in to get access.");
//     }

//     const decoded = jwt.verify(token, process.env.ACCESSTOKEN_SECRET);

//     const currentUser = await User.findById(decoded.id);
//     if (!currentUser) {
//         throw new ApiError(401, "The user belonging to this token no longer exists.");
//     }

//     // Aage ke controllers ke liye user data req me daal diya
//     req.user = currentUser;
//     next();
// });

// // ==========================================
// // 2. RESTRICT TO (Role Check Bouncer)
// // ==========================================
// export const restrictTo = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.accountType)) {
//             throw new ApiError(403, "Access Denied! Only Admins can perform this action.");
//         }
//         next();
//     };
// };

