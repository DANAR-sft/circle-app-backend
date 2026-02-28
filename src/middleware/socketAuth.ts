import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface JWTPayload {
  id: number;
  email: string;
  username: string;
}

/**
 * Middleware untuk autentikasi Socket.io menggunakan JWT
 * Memverifikasi token sebelum mengizinkan koneksi
 */
export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth.token;

    // Jika tidak ada token, izinkan koneksi (untuk guest mode)
    // Ubah ke error jika ingin memaksa autentikasi
    if (!token) {
      console.log("⚠️ Socket connection without token - allowing as guest");
      return next();
    }

    // Verifikasi JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not configured");
      return next(new Error("Server configuration error"));
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Attach user data ke socket untuk digunakan di event handlers
    socket.data.user = decoded;
    console.log(`✅ Socket authenticated for user: ${decoded.username}`);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("❌ Socket auth failed: Token expired");
      return next(new Error("Authentication failed: Token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("❌ Socket auth failed: Invalid token");
      return next(new Error("Authentication failed: Invalid token"));
    }
    console.error("❌ Socket auth error:", error);
    next(new Error("Authentication failed"));
  }
};
