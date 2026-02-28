import request from "supertest";
import jwt from "jsonwebtoken";
import { startTestDb } from "../../tests/integrationDb";

jest.setTimeout(120000);

describe("Integration: Likes routes", () => {
  let stopDb: (() => Promise<void>) | null = null;

  beforeAll(async () => {
    const db = await startTestDb();
    stopDb = db.stop;
    process.env.DATABASE_URL = db.url;
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

  it("POST /api/v1/like and DELETE /api/v1/like/:id", async () => {
    const { prisma } = await import("../../connection/database");

    // Seed user
    const user = await prisma.users.create({
      data: {
        username: "like_user",
        fullname: "Like User",
        email: "like@example.com",
        password: "pw",
      },
    });

    // Create a thread
    const thread = await prisma.threads.create({
      data: {
        content: "Thread for likes",
        createdById: user.id,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
    );

    const { default: app } = await import("../../app");

    // Like the thread
    const resLike = await request(app)
      .post("/api/v1/like")
      .set("Authorization", `Bearer ${token}`)
      .send({ threadId: thread.id })
      .expect(201);

    expect(resLike.body).toHaveProperty("data");
    const likeId = resLike.body.data.id;

    // Unlike (delete) the like
    const resUnlike = await request(app)
      .delete(`/api/v1/like/${likeId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(resUnlike.body).toHaveProperty("data");
    expect(resUnlike.body.data.id).toBe(likeId);
  });
});
