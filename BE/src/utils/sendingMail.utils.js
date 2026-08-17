import { Resend } from "resend";

// Initialize Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY);
console.log("📧 Resend email client initialized");

export const sendVerificationEmail = async (email, otp) => {
    // 🛑 Prevent actual emails from being sent during testing to avoid console errors
    if (process.env.NODE_ENV === "test") {
        console.log(`🧪 [TEST MODE] Skipping email send to ${email} with OTP: ${otp}`);
        return;
    }

    try {
        console.log(`📤 Attempting to send OTP email to: ${email}`);

        // Email ka design aur content (Aapka exact HTML preserve kiya hai)
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4CAF50; text-align: center;">Welcome to the Platform!</h2>
                <p>Hello Student,</p>
                <p>To continue with your verification, please use the following 6-digit OTP. This OTP is valid for the next 10 minutes.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">${otp}</span>
                </div>
                <p style="color: red; font-size: 12px; text-align: center;">Do not share this OTP with anyone.</p>
                <p>Best regards,<br>Campusify Support Team</p>
            </div>
        `;

        console.log(`📋 Email payload prepared — From: ${process.env.RESEND_FROM_EMAIL}, To: ${email}, Subject: "Your Secure OTP for Login/Signup"`);

        // Resend API se email bhejo
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "Campusify Support <onboarding@resend.dev>",
            to: [email],
            subject: "Your Secure OTP for Login/Signup",
            html: htmlContent,
        });

        if (error) {
            console.error("❌ Resend API returned an error:", JSON.stringify(error, null, 2));
            return;
        }

        console.log(`✅ OTP Email successfully sent to ${email}`);
        console.log(`📨 Resend Response Data:`, JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        console.error("🔍 Full error details:", JSON.stringify(error, null, 2));
    }
};