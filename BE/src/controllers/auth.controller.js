
  import User from "../models/user.models.js";
  import crypto from "crypto";
  import { sendVerificationEmail } from "../utils/sendingMail.utils.js"; 
  import jwt from "jsonwebtoken";
  import catchAsync from "../utils/catchAsync.utils.js";
  import ApiError from "../utils/apiError.utils.js";
  // import bcrypt from "bcrypt"; 
  
  // Helper function tokens banane ke liye (Code repetition bachane ke liye)
  const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.ACCESSTOKEN_SECRET, { expiresIn: process.env.ACCESSTOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESHTOKEN_SECRET, { expiresIn: process.env.REFRESHTOKEN_EXPIRY });
  return { accessToken, refreshToken };
};

const cookieOptions = { 
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production", 
  sameSite: "strict" 
};

// 1. REGISTER USER

export const registerUser = catchAsync(async (req, res) => {
  const { firstName, lastName, phoneNo, email, createPassword, confirmPassword } = req.body;

  if (createPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  // ⚡ IMPROVEMENT: Phone number ya Email dono me se koi bhi duplicate na ho
  const existingUser = await User.findOne({ $or: [{ email }, { phoneNo }] }).lean();
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email or phone number.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  await User.create({
    firstName,
    lastName,
    phoneNo,
    email,
    password: confirmPassword, 
    accountType: "Student", 
    isVerified: false,
    otp,
    otpExpiry
  });

  // ⚡ FAST API: Email background me jayega
  console.log("🚀 REGISTER OTP: ", otp);
  sendVerificationEmail(email, otp, "register");

  res.status(201).json({
    status: true,
    message: "Registered successfully, please verify email.",
    email
  });
});

// ==========================================
// 2. VERIFY OTP 
// ==========================================
export const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  // deviceId is optional — if not sent, generate a stable fallback so we don't throw
  const deviceId = req.headers['x-device-id'] || req.body.deviceId || `server-fallback-${Date.now()}`;
  const platform = req.headers['x-platform'] || req.body.platform || 'app'; // 🌐 WEB BYPASS LOGIC

  const user = await User.findOne({ email }).select('+otp +otpExpiry');

  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) throw new ApiError(400, "User is already verified. Please login.");

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    throw new ApiError(400, "Invalid or Expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  
  // Always bind device (platform check kept for future web admin panel support)
  if (platform !== 'web') {
    user.currentDevice = { deviceId, loggedInAt: new Date() };
  }
  await user.save();

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(200).json({ status: true, message: "Email verified successfully! Logged in.", accessToken, refreshToken });
});


//2.1 creating admin 
// ==========================================
// 🛡️ CREATE SUPER ADMIN (Direct Creation + Device Binding + Auto Tokens)
// ==========================================
export const createSuperAdmin = catchAsync(async (req, res) => {
  const { firstName, lastName, phoneNo, email, createPassword, confirmPassword, adminSecretKey, deviceId } = req.body;

  // 📱 1. MENDATORY DEVICE ID CHECK
  if (!deviceId) {
    throw new ApiError(400, "Device ID is required to bind the Admin device.");
  }

   if (createPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  // 🔑 2. SECRET KEY CHECK (Bypass OTP hone ka License)
  if (adminSecretKey !== process.env.ENCRYPTION_KEY) {
    throw new ApiError(403, "Unauthorized! Invalid Secret Key. Access Denied. 🚫");
  }

  // 🔍 3. CHECK IF ALREADY EXISTS
  const existingUser = await User.findOne({ $or: [{ email }, { phoneNo }] }).lean();
  if (existingUser) {
    throw new ApiError(400, "User or Admin already registered with this email/phone.");
  }

  // 📝 4. DIRECT ADMIN CREATION & DEVICE BINDING
  const newAdmin = await User.create({
    firstName,
    lastName,
    phoneNo,
    email,
    password: confirmPassword, // Pre-save hook isko automatically hash kar dega
    accountType: "Admin", // 🔥 Direct Admin
    isVerified: true,     // 🔥 OTP Bypassed!
    currentDevice: {      // 📱 Device ID permanently locked to this session
      deviceId, 
      loggedInAt: new Date() 
    } 
  });

  // 🪙 5. AUTO-ASSIGN TOKENS LOGIC
  const { accessToken, refreshToken } = generateTokens(newAdmin._id);

  // 💾 6. SAVE REFRESH TOKEN IN DB
  newAdmin.refreshToken = refreshToken;
  await newAdmin.save({ validateBeforeSave: false });

  // 🍪 7. SET SECURE COOKIES
  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // 🚀 8. FINAL SUCCESS RESPONSE
  return res.status(201).json({
    status: true,
    message: "🎉 Super Admin created successfully! Device bound and tokens assigned.",
    accessToken,
    refreshToken,
    admin: {
      id: newAdmin._id,
      name: `${newAdmin.firstName} ${newAdmin.lastName}`,
      email: newAdmin.email,
      accountType: newAdmin.accountType,
      deviceId: newAdmin.currentDevice.deviceId
    }
  });
});


// ==========================================
// 3. LOGIN USER (Auto-OTP Interceptor & Strict Device Lock)
// ==========================================
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const deviceId = req.headers['x-device-id'] || req.body.deviceId;
  const platform = req.headers['x-platform'] || req.body.platform || 'app'; // 🌐 WEB BYPASS LOGIC

  if (platform !== 'web' && !deviceId) {
    throw new ApiError(400, "Device ID is required for App login");
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(400, "Invalid email or password");
  }

  // 🛡️ SECURITY: Strict Device Lock & Progressive Penalty System
  if (platform !== 'web' && user.currentDevice && user.currentDevice.deviceId) {
    if (user.currentDevice.deviceId !== deviceId) {
      
      // Agar pehle se koi penalty/cooldown chal raha hai toh naya device LOGIN REJECT karo
      if (user.cooldownUntil && user.cooldownUntil > Date.now()) {
        const remainingHours = Math.ceil((user.cooldownUntil - Date.now()) / (60000 * 60));
        
        // Drama & optimized message as requested by user
        throw new ApiError(403, `Security Alert 🛑: Suspicious multiple logins detected. To protect your data, account access is restricted for the next ${remainingHours} hours.`);
      }

      // Agar cooldown over ho gaya hai, ya first time switch kar raha hai, toh Progressive Penalty lagao
      user.deviceSwitchCount = (user.deviceSwitchCount || 0) + 1;
      
      let penaltyHours = 24; // First switch (Mummy's phone)
      if (user.deviceSwitchCount === 2) penaltyHours = 48; // Second switch (Papa's phone)
      else if (user.deviceSwitchCount === 3) penaltyHours = 72; // Third switch
      else if (user.deviceSwitchCount >= 4) penaltyHours = 100; // Fourth switch and beyond

      // Apply the exponential cooldown timer
      user.cooldownUntil = new Date(Date.now() + penaltyHours * 60 * 60 * 1000); 
      
      // Accept the new device, but they are now locked to it for the penalty period
      console.log(`🚨 DEVICE SWITCH: ${email} switched devices. Count: ${user.deviceSwitchCount}. Cooldown applied for ${penaltyHours} hours.`);
    }
  }

  // Agar user purane / sahi device se aaya hai, lekin abhi us par penalty bachi hai, toh usko bata do
  // Note: Only checking for the NEW device above. If they are on the SAME device, they CAN login normally.
  // Wait, if they are on the SAME device, we don't block them. Cooldown only applies to SWITCHING devices.
  // The user said: "purane vale me 24h ka cool down lag jaye". This means the ACCOUNT is locked from switching.
  // So if `deviceId` matches, we let them login, even if `cooldownUntil` is in the future.
  // So we REMOVE the block for the SAME device.

  // Interceptor: Unverified user
  if (!user.isVerified) {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = newOtp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    console.log("🚀 LOGIN NAYA OTP: ", newOtp);

    // ⚡ FAST API: Email background me jayega
    sendVerificationEmail(user.email, newOtp, "login"); 

    return res.status(403).json({
      status: false,
      isVerified: false, 
      message: "Account not verified. A new OTP has been sent.",
      email: user.email
    });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  
  if (platform !== 'web') {
    user.currentDevice = { deviceId, loggedInAt: new Date() };
  }
  // user.cooldownUntil = null; // ❌ BUG FIXED: Removed this to ensure the cooldown timer persists in DB
  await user.save();

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(200).json({ status: true, message: "Logged in successfully", accessToken, refreshToken });
});

// ==========================================
// 4. RESEND OTP
// ==========================================
export const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  // ⚡ OPTIMIZED: Pura document fetch karne ke bajay seedha DB me value set kar di.
  const updated = await User.updateOne(
    { email, isVerified: false }, 
    { $set: { otp, otpExpiry } }
  );

  if (updated.matchedCount === 0) {
    throw new ApiError(400, "User not found or is already verified. Please login.");
  }

  console.log("🚀 RESEND OTP: ", otp);
  sendVerificationEmail(email, otp, "resend"); // Background call

  res.status(200).json({ status: true, message: "A new OTP has been sent to your email." });
});

// ==========================================
// 5. FORGOT PASSWORD
// ==========================================
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000;
  
  // ⚡ OPTIMIZED: Direct update
  const updated = await User.updateOne(
    { email, isVerified: true }, // User verified hona chahiye forget pass ke liye
    { $set: { otp, otpExpiry } }
  );

  if (updated.matchedCount === 0) {
    throw new ApiError(400, "User not found or account is not verified.");
  }

  console.log("🚀 FORGOT PASSWORD OTP: ", otp);
  sendVerificationEmail(email, otp, "forgotPassword"); 

  res.status(200).json({ status: true, message: "A password reset OTP has been sent to your email." });
});

// ==========================================
// 6. RESET PASSWORD
// ==========================================
export const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) throw new ApiError(400, "Passwords do not match");

  const user = await User.findOne({ email }).select('+otp +otpExpiry');
  if (!user) throw new ApiError(404, "User not found");

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    throw new ApiError(400, "Invalid or Expired OTP");
  }

  // Pre-save hook automatically encrypt karega naye password ko
  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  // user.currentDevice = undefined; // ❌ BUG FIXED: Prevented users from bypassing device lock by resetting password
  await user.save();

  res.status(200).json({ status: true, message: "Password reset successful! You can now login with your new password." });
});

// ==========================================
// 7. LOGOUT USER
// ==========================================
export const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.header("x-refresh-token") || req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({ status: true, message: "Logged out successfully" });
  }

  try {
    const refreshDecoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET);
    const user = await User.findById(refreshDecoded.id);

    if (user) {
      user.refreshToken = undefined;
      user.currentDevice = undefined; 
      await user.save();
    }
  } catch (error) {
    // If token is invalid/expired, still clear cookies and return 200
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ status: true, message: "Logged out successfully" });
});