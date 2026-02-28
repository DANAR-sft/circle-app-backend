import { createServer } from "node:http";
import { Server, Socket } from "socket.io";

/**
 * Socket.IO instance manager.
 * Centralizes io creation to avoid circular imports between index.ts and controllers.
 */
let io: Server;

export function createSocketServer(
  httpServer: ReturnType<typeof createServer>,
): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CORS_ORIGIN_1 || "http://localhost:5173",
        process.env.CORS_ORIGIN_2 || "http://localhost:4000",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
  });
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call createSocketServer first.",
    );
  }
  return io;
}
