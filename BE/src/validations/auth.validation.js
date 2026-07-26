// import { z } from "zod";

// // ==========================================
// // 1. REGISTER VALIDATION
// // ==========================================
// export const registerSchema = z.object({
//     body: z.object({
//         firstName: z
//             .string({ required_error: "First name is required" })
//             .min(2, "First name must be at least 2 characters")
//             .max(50, "First name cannot exceed 50 characters")
//             .trim(),
            
//         lastName: z
//             .string({ required_error: "Last name is required" })
//             .min(2, "Last name must be at least 2 characters")
//             .max(50, "Last name cannot exceed 50 characters")
//             .trim(),
            
//         phoneNo: z
//             .string({ required_error: "Phone number is required" })
//             .min(10, "Phone number must be at least 10 digits")
//             .max(15, "Phone number cannot exceed 15 characters")
//             .trim(),
            
//         email: z
//             .string({ required_error: "Email is required" })
//             .email("Please provide a valid email address")
//             .trim()
//             .toLowerCase(),
            
//         createPassword: z
//             .string({ required_error: "Create Password is required" })
//             .min(6, "Password must be at least 6 characters long")
//             .max(100, "Password is too long"),
            
//         confirmPassword: z
//             .string({ required_error: "Confirm Password is required" })
//     }).refine((data) => data.createPassword === data.confirmPassword, {
//         message: "Passwords do not match",
//         path: ["confirmPassword"],
//     }),
// });

// // ==========================================
// // 2. LOGIN VALIDATION
// // ==========================================
// export const loginSchema = z.object({
//     body: z.object({
//         email: z
//             .string({ required_error: "Email is required" })
//             .email("Please provide a valid email address")
//             .trim()
//             .toLowerCase(),
            
//         password: z
//             .string({ required_error: "Password is required" })
//             .min(6, "Password must be at least 6 characters long"),
            
//         deviceId: z.string().optional(),
//     }),
// });

// // ==========================================
// // 3. FORGOT PASSWORD VALIDATION
// // ==========================================
// export const forgotPasswordSchema = z.object({
//     body: z.object({
//         email: z
//             .string({ required_error: "Email is required" })
//             .email("Please provide a valid email address")
//             .trim()
//             .toLowerCase(),
//     }),
// });

// // ==========================================
// // 4. RESET PASSWORD VALIDATION
// // ==========================================
// export const resetPasswordSchema = z.object({
//     body: z.object({
//         email: z
//             .string({ required_error: "Email is required" })
//             .email("Please provide a valid email address")
//             .trim()
//             .toLowerCase(),
            
//         otp: z
//             .string({ required_error: "OTP is required" })
//             .length(6, "OTP must be exactly 6 digits"),
            
//         newPassword: z
//             .string({ required_error: "New Password is required" })
//             .min(6, "Password must be at least 6 characters long"),
            
//         confirmNewPassword: z
//             .string({ required_error: "Confirm Password is required" })
//     }).refine((data) => data.newPassword === data.confirmNewPassword, {
//         message: "Passwords do not match",
//         path: ["confirmNewPassword"],
//     }),
// });




// ____________________------------------------_-------------------------------





import { z } from "zod";

// ==========================================
// 1. REGISTER VALIDATION
// ==========================================
export const registerSchema = z.object({
    body: z.object({
        firstName: z
            .string({ required_error: "First name is required" })
            .min(2, "First name must be at least 2 characters")
            .max(50, "First name cannot exceed 50 characters")
            .trim(),
            
        lastName: z
            .string({ required_error: "Last name is required" })
            .min(2, "Last name must be at least 2 characters")
            .max(50, "Last name cannot exceed 50 characters")
            .trim(),
            
        phoneNo: z
            .string({ required_error: "Phone number is required" })
            // Regex: Optional '+', followed by 10 to 15 digits only
            .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number containing only digits")
            .trim(),
            
        email: z
            .string({ required_error: "Email is required" })
            .email("Please provide a valid email address")
            .trim()
            .toLowerCase(),
            
        createPassword: z
            .string({ required_error: "Create Password is required" })
            .min(8, "Password must be at least 8 characters long")
            // Regex: At least one number and at least one special character
            .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, "Password must contain at least one number and one special character (!@#$%^&*)")
            .max(100, "Password is too long"),
            
        confirmPassword: z
            .string({ required_error: "Confirm Password is required" })
    }).refine((data) => data.createPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }),
});

// ==========================================
// 2. LOGIN VALIDATION
// ==========================================
export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .email("Please provide a valid email address")
            .trim()
            .toLowerCase(),
            
        password: z
            .string({ required_error: "Password is required" })
            .min(1, "Password is required"), // Keep this simple for login, just ensure it's not empty
            
        deviceId: z.string().optional(),
    }),
});

// ==========================================
// 3. FORGOT PASSWORD VALIDATION
// ==========================================
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .email("Please provide a valid email address")
            .trim()
            .toLowerCase(),
    }),
});

// ==========================================
// 4. RESET PASSWORD VALIDATION
// ==========================================
export const resetPasswordSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .email("Please provide a valid email address")
            .trim()
            .toLowerCase(),
            
        otp: z
            .string({ required_error: "OTP is required" })
            .length(6, "OTP must be exactly 6 digits")
            // Make sure the OTP is strictly numeric
            .regex(/^[0-9]+$/, "OTP must contain only numbers"),
            
        newPassword: z
            .string({ required_error: "New Password is required" })
            .min(8, "Password must be at least 8 characters long")
            .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, "Password must contain at least one number and one special character (!@#$%^&*)"),
            
        confirmNewPassword: z
            .string({ required_error: "Confirm Password is required" })
    }).refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
    }),
});