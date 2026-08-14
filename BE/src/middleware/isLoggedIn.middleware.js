import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import SimpleCache from "../utils/cache.utils.js";

// ══════════════════════════════════════════════════════════════════════════════
// 🚀 Auth User Cache — Eliminates 50% of MongoDB reads
// ══════════════════════════════════════════════════════════════════════════════
// Every authenticated request calls User.findById() to verify the user exists.
// With 2,000 concurrent viewers, that's 2,000 unnecessary DB queries per burst.
// Cache verified users for 2 minutes to skip this DB hit.
//
// Trade-off: Bans/access revocations take up to 2 min to propagate.
// Memory: 2,000 users × ~2 KB = ~4 MB (safe on 512MB Render)
const userCache = new SimpleCache(2000, 2 * 60 * 1000); // 2000 users, 2 min TTL

// 🟢 Auth Middleware
export const isLoggedIn = async (req, res, next) => {
  try {
    // 1. Token nikalne ka PRO tarika (Web ke liye Cookies, Mobile App ke liye Header)
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    const refreshToken = req.cookies?.refreshToken || req.header("x-refresh-token");
    const incomingDeviceId = req.headers['x-device-id']; 

    if (!accessToken && !refreshToken) {
      return res.status(401).json({ status: false, message: "Unauthorized access: Please login." });
    }

    let decodedId = null;

    // 2. Verify Access Token
    if (accessToken) {
      try {
        const accessDecoded = jwt.verify(accessToken, process.env.ACCESSTOKEN_SECRET);
        decodedId = accessDecoded.id; 
      } catch (error) {
        decodedId = null; // Agar expire ho gaya, toh aage Refresh Token wala block chalega
      }
    }

    // 3. Auto-Refresh Logic (Jab Access Token expire ho jaye)
    if (!decodedId && refreshToken) {
      try {
        const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESHTOKEN_SECRET);
        const user = await User.findById(refreshDecoded.id);
        
        // Agar DB me token change ho chuka hai (Naye phone me login ki wajah se)
        if (!user || user.refreshToken !== refreshToken) {
          res.clearCookie("accessToken");
          res.clearCookie("refreshToken");
          return res.status(401).json({ status: false, message: "Session expired or logged in from another device." });
        }

        // Naye Tokens Generate karo
        const newAccessToken = jwt.sign({ id: user._id }, process.env.ACCESSTOKEN_SECRET, { expiresIn: process.env.ACCESSTOKEN_EXPIRY });
        const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESHTOKEN_SECRET, { expiresIn: process.env.REFRESHTOKEN_EXPIRY });

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false }); // ⚡ Fast Save

        // Naye Tokens ko cookies me set karo
        const cookieOptions = { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === "production", 
          sameSite: "strict" 
        };
        res.cookie("accessToken", newAccessToken, cookieOptions);
        res.cookie("refreshToken", newRefreshToken, cookieOptions);
        
        // Mobile App ke liye headers me bhi bhej sakte ho agar chaho (Optional)
        res.setHeader('x-new-access-token', newAccessToken);
        res.setHeader('x-new-refresh-token', newRefreshToken);
        
        decodedId = user._id; 

        // ⚡ Invalidate user cache after token refresh (user data may have changed)
        userCache.delete(decodedId.toString());
      } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(401).json({ status: false, message: "Session expired. Please login again." });
      }
    }

    // 4. Final Fallback Check
    if (!decodedId) {
      return res.status(401).json({ status: false, message: "Authentication failed." });
    }

    // 5. User Fetch — ⚡ OPTIMIZED: Check cache before hitting MongoDB
    const userIdStr = decodedId.toString();
    let currentUser = userCache.get(userIdStr);

    if (!currentUser) {
      // Cache miss — fetch from DB and cache the result
      // .lean() returns plain JS object (5x faster, 5x less memory)
      currentUser = await User.findById(decodedId).select("-password -refreshToken").lean();

      if (currentUser) {
        userCache.set(userIdStr, currentUser);
      }
    }

    if (!currentUser) {
      return res.status(401).json({ status: false, message: "User no longer exists." });
    }

    // 🛑 5.5 BAN CHECK
    if (currentUser.isBanned) {
      const now = new Date();
      if (!currentUser.banUntil || currentUser.banUntil > now) {
        return res.status(403).json({ 
          status: false, 
          message: `Your account has been suspended. Reason: ${currentUser.banReason || 'Policy violation'}.` 
        });
      }
    }

    // 🛑 6. NETFLIX SECURITY: The Ultimate Device Kick-Out
    if (incomingDeviceId && currentUser.currentDevice?.deviceId) {
      if (currentUser.currentDevice.deviceId !== incomingDeviceId) {
        // Purane device ki memory flush kar do
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(403).json({ 
          status: false, 
          message: "🚨 Session takeover detected! You logged in on a new device. This app is now logged out." 
        });
      }
    }

    // 7. Success! User ko attach karo aur aage bhejo
    req.user = currentUser;
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// 🔴 ADMIN CHECK (Ekdum Perfect Hai)
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.accountType === "Admin") {
        next();
    } else {
        return res.status(403).json({ status: false, message: "Access Denied. Only admins can perform this action." });
    }
};