import { Request, Response } from "express";
import { registerSchema, loginSchema } from "../types/joiValidation";
import { prisma } from "../connection/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { jwtSecret } from "../middleware/jwtAuth";

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const valid = loginSchema.validate({ email, password });

    if (valid.error) {
      return res.status(400).json({ error: valid.error.details[0].message });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email: email },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ code: 404, status: "error", message: "User not found" });
    } else if (!(await bcrypt.compare(password, existingUser.password))) {
      return res
        .status(401)
        .json({ code: 401, status: "error", message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: existingUser?.id,
        email: existingUser?.email,
      },
      jwtSecret as string,
      { expiresIn: "1h" },
    );

    // Exclude password from response
    const { password: _, ...safeUser } = existingUser;

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "User logged in successfully",
      data: { user: safeUser, token },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ code: 500, status: "error", message: "invalid login" });
  }
}

export async function registerController(req: Request, res: Response) {
  try {
    const { email, fullname, username, password } = req.body;

    const valid = registerSchema.validate({
      email,
      fullname,
      username,
      password,
    });

    if (valid.error) {
      return res.status(400).json({ error: valid.error.details[0].message });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        email: email,
        fullname: fullname,
        username: username,
        password: passwordHash,
      },
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
      },
      jwtSecret as string,
      { expiresIn: "1h" },
    );

    // Exclude password from response
    const { password: _, ...safeNewUser } = newUser;

    return res.status(201).json({
      code: 201,
      status: "success",
      message: "User registered successfully",
      data: { user: safeNewUser, token },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ code: 500, status: "error", message: "invalid register" });
  }
}
