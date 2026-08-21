import { Resend } from "resend";

// Initialize Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY);
console.log("📧 Resend email client initialized");

// ==========================================
// Dynamic Email Templates — per purpose
// ==========================================
const EMAIL_TEMPLATES = {
    register: {
        subject: "Verify Your Campusify Account 🎓",
        heading: "Welcome to Campusify!",
        message: "Thank you for signing up! To complete your registration, please use the following 6-digit OTP. This OTP is valid for the next 10 minutes.",
        color: "#4CAF50",
    },
    login: {
        subject: "Verify Your Identity — Campusify Login",
        heading: "Login Verification Required",
        message: "We noticed your account is not verified yet. Please use the following OTP to verify your email and complete login.",
        color: "#2196F3",
    },
    resend: {
        subject: "Your New OTP — Campusify Verification",
        heading: "Here's Your New OTP",
        message: "You requested a new OTP. Please use the following 6-digit code to verify your email. This OTP is valid for the next 10 minutes.",
        color: "#FF9800",
    },
    forgotPassword: {
        subject: "Reset Your Campusify Password 🔐",
        heading: "Password Reset Request",
        message: "We received a request to reset your password. Use the following OTP to proceed with the password reset. If you did not request this, please ignore this email.",
        color: "#F44336",
    },
};

/**
 * Send OTP email via Resend
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - One of: "register", "login", "resend", "forgotPassword"
 */
export const sendVerificationEmail = async (email, otp, purpose = "register") => {
    // 🛑 Prevent actual emails from being sent during testing
    if (process.env.NODE_ENV === "test") {
        console.log(`🧪 [TEST MODE] Skipping email send to ${email} | OTP: ${otp} | Purpose: ${purpose}`);
        return;
    }

    try {
        // Get template based on purpose, fallback to register
        const template = EMAIL_TEMPLATES[purpose] || EMAIL_TEMPLATES.register;
        console.log(`📤 Sending "${purpose}" OTP email to: ${email}`);

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: ${template.color}; margin: 0;">${template.heading}</h2>
                </div>
                <p style="color: #333; font-size: 15px;">Hello Student,</p>
                <p style="color: #555; font-size: 14px; line-height: 1.6;">${template.message}</p>
                <div style="text-align: center; margin: 25px 0;">
                    <span style="font-size: 28px; font-weight: bold; background: #f4f4f4; padding: 12px 24px; border-radius: 8px; letter-spacing: 6px; color: ${template.color}; border: 2px dashed ${template.color};">${otp}</span>
                </div>
                <p style="color: #e53935; font-size: 12px; text-align: center; margin: 15px 0;">⚠️ Do not share this OTP with anyone.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #888; font-size: 13px;">Best regards,<br><strong>Campusify Support Team</strong></p>
                <p style="color: #aaa; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} Campusify. All rights reserved.</p>
            </div>
        `;

        console.log(`📋 Email payload — From: ${process.env.RESEND_FROM_EMAIL}, To: ${email}, Subject: "${template.subject}"`);

        // Resend API se email bhejo
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Campusify Support <noreply@campusifyplus.in>",
            to: [email],
            subject: template.subject,
            html: htmlContent,
        });

        if (error) {
            console.error(`❌ Resend API error [${purpose}]:`, JSON.stringify(error, null, 2));
            return;
        }

        console.log(`✅ OTP Email sent to ${email} [${purpose}]`);
        console.log(`📨 Resend Response:`, JSON.stringify(data, null, 2));

    } catch (error) {
        console.error(`❌ Email sending failed [${purpose}]:`, error.message);
        console.error("🔍 Full error details:", JSON.stringify(error, null, 2));
    }
};