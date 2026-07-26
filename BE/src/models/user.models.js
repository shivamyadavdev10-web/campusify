import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const IV_LENGTH = 16; 
const ALGORITHM = 'aes-256-gcm'; // Upgraded from CBC to GCM for authenticated encryption

// OPTIMIZATION 1: Derive the key once at startup using a proper cryptographic hash
// This prevents running string manipulation and weak padding on every single encryption.
const rawSecret = (process.env.ENCRYPTION_KEY || "ShivEdTechSuperSecretKey12345678").trim().replace(/['"]/g, '');
const ENCRYPTION_KEY = crypto.createHash('sha256').update(rawSecret).digest();

function encryptPassword(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // GCM requires an auth tag to ensure the data hasn't been tampered with
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

export function decryptPassword(text) {
    try {
        const parts = text.split(':');
        if (parts.length !== 3) throw new Error("Invalid payload format");
        
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const authTag = Buffer.from(parts[2], 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag); // Verify data integrity
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        return "❌ Decryption Failed";
    }
}

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    accountType: { type: String, enum: ["Student", "Admin"], default: "Student", required: true },
    
    // OTP & Verification
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    // OPTIMIZATION 2: TTL Index to automatically delete expired OTPs
    otpExpiry: { type: Date, select: false, index: { expires: 0 } }, 
    
    // Course Access
    purchasedSemesters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Semester" }],

    // Security & Device Locking
    currentDevice: {
        deviceId: { type: String },
        loggedInAt: { type: Date },
    },
    deviceSwitchCount: { type: Number, default: 0 },
    
    // Admin Control: Ban/Unban System
    // OPTIMIZATION 3: Partial Index to save RAM (only index the banned users)
    isBanned: { type: Boolean, default: false, index: { partialFilterExpression: { isBanned: true } } },
    banReason: { type: String },
    banUntil: { type: Date, default: null },

    cooldownUntil: { type: Date, default: null }, 
    refreshToken: { type: String, select: false }
}, { timestamps: true, optimisticConcurrency: true });

// Hash/Encrypt password before saving
userSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = encryptPassword(this.password);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = function (enteredPassword) {
    try {
        const originalPassword = decryptPassword(this.password);
        return originalPassword === enteredPassword;
    } catch (error) {
        return false;
    }
};

const User = mongoose.model("User", userSchema); 
export default User;