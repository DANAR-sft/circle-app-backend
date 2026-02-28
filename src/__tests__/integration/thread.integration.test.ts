import request from "supertest";
import jwt from "jsonwebtoken";
import { startTestDb } from "../../tests/integrationDb";
import { prisma as prismaClient } from "../../connection/database";

jest.setTimeout(120000);

describe("Integration: Thread routes (real DB)", () => {
  let stopDb: (() => Promise<void>) | null = null;

  beforeAll(async () => {
    const db = await startTestDb();
    stopDb = db.stop;
    process.env.DATABASE_URL = db.url;
    // Reset modules so Prisma client picks up new DATABASE_URL
    jest.resetModules();
  });

  afterAll(async () => {
    // Disconnect prisma client
    try {
      const prisma = (await import("../../connection/database")).prisma;
      await prisma.$disconnect();
    } catch (e) {
      // ignore
    }
    if (stopDb) await stopDb();
  });

  it("can create a thread via API and read it back", async () => {
    // Re-import prisma after setting env
    const { prisma } = await import("../../connection/database");

    // Seed a user
    const user = await prisma.users.create({
      data: {
        username: "integration_user",
        fullname: "Integration User",
        email: "integ@example.com",
        password: "hashed",
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
    );

    // Import app after prisma is configured
    const { default: app } = await import("../../app");

    const resCreate = await request(app)
      .post("/api/v1/thread")
      .set("Authorization", `Bearer ${token}`)
      .field("content", "Hello integration")
      .expect(201);

    expect(resCreate.body).toHaveProperty("data");
    const createdId = resCreate.body.data.id;

    const resGet = await request(app)
      .get(`/api/v1/thread/${createdId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(resGet.body.data).toHaveProperty("content", "Hello integration");
  });
});
