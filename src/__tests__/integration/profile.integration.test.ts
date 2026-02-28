import request from "supertest";
import jwt from "jsonwebtoken";
import { startTestDb } from "../../tests/integrationDb";

jest.setTimeout(120000);

describe("Integration: Profile routes", () => {
  let stopDb: (() => Promise<void>) | null = null;

  beforeAll(async () => {
    const db = await startTestDb();
    stopDb = db.stop;
    process.env.DATABASE_URL = db.url;
    // Ensure JWT_SECRET exists
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    jest.resetModules();
  });

  afterAll(async () => {
    try {
      const prisma = (await import("../../connection/database")).prisma;
      await prisma.$disconnect();
    } catch (e) {
      // ignore
    }
    if (stopDb) await stopDb();
  });

  it("GET /api/v1/profile and /api/v1/profile/:id and PATCH /api/v1/profile", async () => {
    const { prisma } = await import("../../connection/database");

    // Seed two users
    const userA = await prisma.users.create({
      data: {
        username: "userA",
        fullname: "User A",
        email: "a@example.com",
        password: "pw",
      },
    });

    const userB = await prisma.users.create({
      data: {
        username: "userB",
        fullname: "User B",
        email: "b@example.com",
        password: "pw",
      },
    });

    // userA follows userB
    await prisma.following.create({
      data: {
        followerId: userA.id,
        followingId: userB.id,
        isFollowing: true,
        createdById: userA.id,
      },
    });

    const token = jwt.sign(
      { id: userA.id, email: userA.email },
      process.env.JWT_SECRET as string,
    );

    const { default: app } = await import("../../app");

    // GET profile of authenticated user
    const resProfile = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(resProfile.body.data).toHaveProperty("id", userA.id);
    expect(resProfile.body.data).toHaveProperty("following_count");
    expect(resProfile.body.data.following_count).toBeGreaterThanOrEqual(1);

    // GET profile by id (userB) and check isFollowing true
    const resById = await request(app)
      .get(`/api/v1/profile/${userB.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(resById.body.data).toHaveProperty("id", userB.id);
    expect(resById.body.data).toHaveProperty("isFollowing", true);

    // PATCH update profile
    const resPatch = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", `Bearer ${token}`)
      .field("fullname", "User A Updated")
      .expect(200);

    expect(resPatch.body).toHaveProperty("data");
    expect(resPatch.body.data.fullname).toBe("User A Updated");
  });
});
