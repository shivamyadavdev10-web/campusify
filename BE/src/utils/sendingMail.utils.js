import axios from "axios";

export const sendVerificationEmail = async (email, otp) => {
    // 🛑 Prevent actual emails from being sent during testing to avoid console errors
    if (process.env.NODE_ENV === "test") {
        return;
    }

    try {
        // 1. ZeptoMail API Endpoint
        const apiUrl = "https://api.zeptomail.in/v1.1/email"; 

        // 2. Email ka design aur content (Aapka exact HTML preserve kiya hai)
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

        // 3. ZeptoMail Payload
        const payload = {
            from: { 
                address: process.env.ZEPTO_FROM_EMAIL, 
                name: "Campusify Support" 
            },
            to: [
                { 
                    email_address: { 
                        address: email, 
                        name: "Student" 
                    } 
                }
            ],
            subject: "Your Secure OTP for Login/Signup",
            htmlbody: htmlContent,
        };

        // 4. Email Send karna 
        await axios.post(apiUrl, payload, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Zoho-enczapikey ${process.env.ZEPTO_API_TOKEN}` 
            }
        });

        console.log(`✅ OTP Email successfully sent to ${email}`);

    } catch (error) {
        
        console.error("❌ Email sending failed:", error.response?.data || error.message);
        
    }
};