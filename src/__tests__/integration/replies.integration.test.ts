import request from "supertest";
import jwt from "jsonwebtoken";
import { startTestDb } from "../../tests/integrationDb";

jest.setTimeout(120000);

describe("Integration: Replies routes", () => {
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

  it("POST /api/v1/reply and GET /api/v1/reply/:threadId", async () => {
    const { prisma } = await import("../../connection/database");

    // Seed user
    const user = await prisma.users.create({
      data: {
        username: "reply_user",
        fullname: "Reply User",
        email: "reply@example.com",
        password: "pw",
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
    );

    // Create a thread directly so we have threadId
    const thread = await prisma.threads.create({
      data: {
        content: "Thread for replies",
        createdById: user.id,
      },
    });

    const { default: app } = await import("../../app");

    // Post a reply
    const resCreate = await request(app)
      .post("/api/v1/reply")
      .set("Authorization", `Bearer ${token}`)
      .field("threadId", String(thread.id))
      .field("content", "This is a reply")
      .expect(201);

    expect(resCreate.body).toHaveProperty("data");
    expect(resCreate.body.data).toHaveProperty("id");

    // Fetch replies
    const resGet = await request(app)
      .get(`/api/v1/reply/${thread.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(resGet.body.data).toBeInstanceOf(Array);
    expect(resGet.body.data[0]).toHaveProperty("content", "This is a reply");
  });
});
