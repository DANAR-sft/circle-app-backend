import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UserPayload } from "../types/jwtpayload";

export const jwtSecret = process.env.JWT_SECRET;

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization?.split(" ")[1];
  const token = authHeader;

  if (!token) {
    return res
      .status(401)
      .json({ code: 401, status: "error", message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret as string) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ code: 401, status: "error", message: "Invalid token" });
  }
}
