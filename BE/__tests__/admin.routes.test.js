import request from "supertest";
import app from "../app.js";
import User from "../src/models/user.models.js";
import mongoose from "mongoose";

describe("Admin Routes (/api/admin)", () => {
  let adminCookie;
  const fakeId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    const uniqueEmail = `admin${Date.now()}@example.com`;
    // Create a verified Super Admin
    await User.create({
      firstName: "Super",
      lastName: "Admin",
      phoneNo: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: uniqueEmail,
      password: "AdminPassword123!",
      accountType: "Admin", // Crucial for isAdmin middleware
      isVerified: true
    });

    // Login to get token cookie
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail, password: "AdminPassword123!", platform: "web" });
      
    adminCookie = loginRes.headers['set-cookie'];
  });

  // Dashboard
  it("GET /dashboard-stats - Should get dashboard statistics", async () => {
    const res = await request(app).get("/api/admin/dashboard-stats").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  // Security
  it("POST /security/unlock-device - Should unlock user device", async () => {
    const res = await request(app).post("/api/admin/security/unlock-device").set("Cookie", adminCookie).send({ email: "fake@example.com" });
    expect(res.status).toBe(404); // User not found, perfectly valid for testing
  });

  it("POST /security/toggle-ban - Should ban/unban user", async () => {
    const res = await request(app).post("/api/admin/security/toggle-ban").set("Cookie", adminCookie).send({ email: "fake@example.com" });
    expect(res.status).toBe(404);
  });

  it("GET /security/suspicious-logs - Should get suspicious logs", async () => {
    const res = await request(app).get("/api/admin/security/suspicious-logs").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("POST /security/reveal-password - Should check user password", async () => {
    const res = await request(app).post("/api/admin/security/reveal-password").set("Cookie", adminCookie).send({ email: "fake@example.com" });
    expect(res.status).toBe(404);
  });

  // Users
  it("POST /users/manual-access - Should override manual access", async () => {
    const res = await request(app).post("/api/admin/users/manual-access").set("Cookie", adminCookie).send({ email: "fake@example.com", semesterId: fakeId });
    expect(res.status).toBe(404);
  });

  it("POST /users/bulk-upload - Should handle missing CSV", async () => {
    // We test that it throws 400 when no file is uploaded
    const res = await request(app).post("/api/admin/users/bulk-upload").set("Cookie", adminCookie);
    expect(res.status).toBe(400); 
  });

  it("POST /users/update-password - Should update user password", async () => {
    const res = await request(app).post("/api/admin/users/update-password").set("Cookie", adminCookie).send({ userId: fakeId, newPassword: "NewPass123!" });
    expect(res.status).toBe(404);
  });

  // Curriculum Operations
  it("POST /branch - Should create a branch", async () => {
    const res = await request(app).post("/api/admin/branch").set("Cookie", adminCookie).send({ name: `Test Branch ${Date.now()}`, shortName: "TB" });
    expect(res.status).toBe(201);
  });

  it("POST /semester - Should create a semester", async () => {
    const res = await request(app).post("/api/admin/semester").set("Cookie", adminCookie).send({ title: `Sem 1 ${Date.now()}`, branchId: fakeId, price: 500, semNumber: 1 });
    expect(res.status).toBe(201);
  });

  it("POST /subject - Should create a subject", async () => {
    const res = await request(app).post("/api/admin/subject").set("Cookie", adminCookie).send({ name: `Maths ${Date.now()}`, semesterId: fakeId });
    expect(res.status).toBe(201);
  });

  it("PATCH /subject/reorder - Should reorder subjects", async () => {
    const res = await request(app).patch("/api/admin/subject/reorder").set("Cookie", adminCookie).send({ orderedIds: [fakeId] });
    expect(res.status).toBe(200);
  });

  it("PATCH /semester/:semesterId/toggle-publish - Should toggle publish status", async () => {
    const res = await request(app).patch(`/api/admin/semester/${fakeId}/toggle-publish`).set("Cookie", adminCookie);
    expect(res.status).toBe(404);
  });

  // Media Upload
  it("POST /content - Should handle missing fields/file for content", async () => {
    const res = await request(app).post("/api/admin/content").set("Cookie", adminCookie);
    expect(res.status).toBe(400); // Because required fields are missing
  });

  it("POST /content - Should upload a video successfully", async () => {
    const res = await request(app)
      .post("/api/admin/content")
      .set("Cookie", adminCookie)
      .field("branchId", fakeId)
      .field("semesterId", fakeId)
      .field("subjectId", fakeId)
      .field("title", "Test Video")
      .field("type", "video")
      .attach("file", Buffer.from("dummy video content"), "test-video.mp4");

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(true);
    expect(res.body.data.type).toBe("video");
  });

  it("PATCH /content/:contentId/toggle-free - Should toggle content free status", async () => {
    const res = await request(app).patch(`/api/admin/content/${fakeId}/toggle-free`).set("Cookie", adminCookie);
    expect(res.status).toBe(404);
  });

  it("POST /banner - Should upload banner using imageUrl", async () => {
    const res = await request(app).post("/api/admin/banner").set("Cookie", adminCookie).send({ imageUrl: "https://example.com/banner.png" });
    expect(res.status).toBe(201);
  });
});
