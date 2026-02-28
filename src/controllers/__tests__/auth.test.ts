jest.mock("../../middleware/jwtAuth", () => ({
  jwtSecret: "testsecret",
  jwtAuth: jest.fn(),
}));
jest.mock("../../connection/database", () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { loginController, registerController } from "../loginPage";
import { createMockRequest, createMockResponse } from "../../tests/utils";
import { prisma } from "../../connection/database";
import bcrypt from "bcrypt";

const mockedPrisma = prisma as unknown as {
  users: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
};

describe("loginController", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when email/password is missing", async () => {
    const req = createMockRequest({ body: {} });
    const res = createMockResponse();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when user not found", async () => {
    const req = createMockRequest({
      body: { email: "notfound@example.com", password: "test1234" },
    });
    const res = createMockResponse();

    mockedPrisma.users.findUnique.mockResolvedValue(null);
    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 401 when password is wrong", async () => {
    const req = createMockRequest({
      body: { email: "user@example.com", password: "wrongpass" },
    });
    const res = createMockResponse();

    const hashed = await bcrypt.hash("correctpass", 10);
    mockedPrisma.users.findUnique.mockResolvedValue({
      id: 1,
      email: "user@example.com",
      password: hashed,
    });

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 200 with token and does NOT return password", async () => {
    const req = createMockRequest({
      body: { email: "user@example.com", password: "test1234" },
    });
    const res = createMockResponse();

    const hashed = await bcrypt.hash("test1234", 10);
    mockedPrisma.users.findUnique.mockResolvedValue({
      id: 1,
      email: "user@example.com",
      username: "testuser",
      fullname: "Test User",
      password: hashed,
    });

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall).toHaveProperty("data.token");
    // Security: password must NOT be in response
    expect(jsonCall.data.user).not.toHaveProperty("password");
  });
});

describe("registerController", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when validation fails (missing fields)", async () => {
    const req = createMockRequest({ body: { email: "test@example.com" } });
    const res = createMockResponse();

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 201 and does NOT return password", async () => {
    const req = createMockRequest({
      body: {
        email: "new@example.com",
        password: "test1234",
        fullname: "New User",
        username: "newuser",
      },
    });
    const res = createMockResponse();

    mockedPrisma.users.create.mockResolvedValue({
      id: 2,
      email: "new@example.com",
      username: "newuser",
      fullname: "New User",
      password: "hashed_value",
    });

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    // Security: password must NOT be in response
    expect(jsonCall.data.user).not.toHaveProperty("password");
  });
});
