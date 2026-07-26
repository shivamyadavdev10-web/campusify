import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import User from "../src/models/user.models.js";

// Mock the email utility so background tasks don't run during tests
jest.mock("../src/utils/sendingMail.utils.js", () => ({
  sendVerificationEmail: jest.fn()
}));

describe("Auth Routes (/api/auth)", () => {
  it("POST /register - Should register a new user", async () => {
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "User",
        phoneNo: uniquePhone,
        email: uniqueEmail,
        createPassword: "Password123!",
        confirmPassword: "Password123!"
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toBe("Registered successfully, please verify email.");
  });
  it("POST /create-super-admin - Should create a super admin", async () => {
    const uniqueEmail = `admin${Date.now()}@example.com`;
    const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const response = await request(app)
      .post("/api/auth/create-super-admin")
      .send({
        firstName: "Super",
        lastName: "Admin",
        phoneNo: uniquePhone,
        email: uniqueEmail,
        createPassword: "AdminPassword123!",
        confirmPassword: "AdminPassword123!",
        adminSecretKey: process.env.ENCRYPTION_KEY,
        deviceId: "test-device-id-123"
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toContain("Super Admin created successfully!");
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
  });
  it("POST /verify-otp - Should verify user OTP", async () => {
    const uniqueEmail = `otpuser${Date.now()}@example.com`;
    // Manually create an unverified user in the DB with a known OTP
    await User.create({
      firstName: "OTP",
      lastName: "User",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "Password123!",
      accountType: "Student",
      isVerified: false,
      otp: "123456",
      otpExpiry: Date.now() + 10 * 60 * 1000
    });

    const response = await request(app)
      .post("/api/auth/verify-otp")
      .send({
        email: uniqueEmail,
        otp: "123456",
        platform: "web"
      });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toContain("Email verified successfully");
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
  });
  it("POST /resend-otp - Should resend OTP", async () => {
    const uniqueEmail = `resenduser${Date.now()}@example.com`;
    // Create an unverified user
    await User.create({
      firstName: "Resend",
      lastName: "User",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "Password123!",
      accountType: "Student",
      isVerified: false,
      otp: "oldotp",
      otpExpiry: Date.now() - 1000 // already expired
    });

    const response = await request(app)
      .post("/api/auth/resend-otp")
      .send({
        email: uniqueEmail
      });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toContain("A new OTP has been sent to your email.");
  });
  it("POST /login - Should login user and return tokens", async () => {
    const uniqueEmail = `loginuser${Date.now()}@example.com`;
    // Create a verified user for successful login
    await User.create({
      firstName: "Login",
      lastName: "User",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "LoginPassword123!",
      accountType: "Student",
      isVerified: true
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: uniqueEmail,
        password: "LoginPassword123!",
        platform: "web"
      });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toBe("Logged in successfully");
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
  });
  it("POST /forgot-password - Should initiate forgot password", async () => {
    const uniqueEmail = `forgotuser${Date.now()}@example.com`;
    // Create a verified user
    await User.create({
      firstName: "Forgot",
      lastName: "User",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "Password123!",
      accountType: "Student",
      isVerified: true
    });

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({
        email: uniqueEmail
      });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toBe("A password reset OTP has been sent to your email.");
  });
  it("POST /reset-password - Should reset user password", async () => {
    const uniqueEmail = `resetuser${Date.now()}@example.com`;
    // Create a user with a valid OTP for password reset
    await User.create({
      firstName: "Reset",
      lastName: "User",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "OldPassword123!",
      accountType: "Student",
      isVerified: true,
      otp: "654321",
      otpExpiry: Date.now() + 10 * 60 * 1000
    });

    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({
        email: uniqueEmail,
        otp: "654321",
        newPassword: "NewPassword123!",
        confirmNewPassword: "NewPassword123!"
      });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toContain("Password reset successful!");
  });
  it("POST /logout - Should logout user", async () => {
    const uniqueEmail = `logoutuser${Date.now()}@example.com`;
    // Create a verified user
    await User.create({
      firstName: "Logout",
      lastName: "User",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "Password123!",
      accountType: "Student",
      isVerified: true
    });

    // Step 1: Login to get the tokens in the cookie
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: uniqueEmail,
        password: "Password123!",
        platform: "web"
      });
      
    const cookies = loginRes.headers['set-cookie'];

    // Step 2: Logout with the acquired cookies
    const response = await request(app)
      .post("/api/auth/logout")
      .set('Cookie', cookies)
      .send();
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.message).toBe("Logged out successfully");
  });
});
