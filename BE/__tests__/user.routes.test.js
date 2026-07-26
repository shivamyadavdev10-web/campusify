import request from "supertest";
import app from "../app.js";
import User from "../src/models/user.models.js";

describe("User Routes (/api/user)", () => {
  let userCookie;

  beforeAll(async () => {
    const uniqueEmail = `userroute${Date.now()}@example.com`;
    // Create a verified user
    await User.create({
      firstName: "UserRoute",
      lastName: "Test",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "Password123!",
      accountType: "Student",
      isVerified: true
    });

    // Login to get token cookie
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail, password: "Password123!", platform: "web" });
      
    userCookie = loginRes.headers['set-cookie'];
  });

  it("GET /me - Should get logged-in user profile", async () => {
    const response = await request(app)
      .get("/api/user/me")
      .set('Cookie', userCookie);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.firstName).toBe("UserRoute");
  });

  it("GET /payments - Should get user payments", async () => {
    const response = await request(app)
      .get("/api/user/payments")
      .set('Cookie', userCookie);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", true);
    // Assuming payments is an array in the response
    expect(response.body.payments).toBeDefined(); 
  });
});
