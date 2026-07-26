import request from "supertest";
import app from "../app.js";
import User from "../src/models/user.models.js";
import mongoose from "mongoose";

describe("Curriculum Routes (/api/curriculum)", () => {
  let userCookie;
  const fakeId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    const uniqueEmail = `curriculum${Date.now()}@example.com`;
    await User.create({
      firstName: "Curriculum",
      lastName: "Test",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "Password123!",
      accountType: "Student",
      isVerified: true
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail, password: "Password123!", platform: "web" });
      
    userCookie = loginRes.headers['set-cookie'];
  });

  it("GET /banner - Should get banners", async () => {
    const res = await request(app).get("/api/curriculum/banner");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("GET /branches - Should get all branches", async () => {
    const res = await request(app).get("/api/curriculum/branches");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("GET /courses/trending - Should get trending courses", async () => {
    const res = await request(app).get("/api/curriculum/courses/trending");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("GET /contents/free - Should get free contents", async () => {
    const res = await request(app).get("/api/curriculum/contents/free");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("GET /content-url/:contentId - Should handle missing content", async () => {
    const res = await request(app).get(`/api/curriculum/content-url/${fakeId}`).set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });

  it("GET /search - Should search curriculum", async () => {
    const res = await request(app).get("/api/curriculum/search?q=").set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("GET /semesters/:branchId - Should get semesters for a branch", async () => {
    const res = await request(app).get(`/api/curriculum/semesters/${fakeId}`).set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("GET /subjects/:semesterId - Should get subjects for a semester", async () => {
    const res = await request(app).get(`/api/curriculum/subjects/${fakeId}`).set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("GET /contents/:subjectId - Should handle missing subject", async () => {
    const res = await request(app).get(`/api/curriculum/contents/${fakeId}`).set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });
});
