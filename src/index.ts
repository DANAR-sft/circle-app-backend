import dotenv from "dotenv";
import { createServer } from "node:http";
import { socketAuthMiddleware } from "./middleware/socketAuth";
import { connectRedis } from "./config/redis";
import { createSocketServer } from "./utils/socketEmitter";
import app from "./app";

dotenv.config();
const server = createServer(app);

// Setup Socket.io via centralized emitter (no more circular import)
const io = createSocketServer(server);

// Gunakan middleware autentikasi untuk Socket.io
io.use(socketAuthMiddleware);

const PORT = process.env.PORT;

// Socket.io Connection Handler
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("join:room", (roomId: string) => {
    socket.join(roomId);
    console.log(`👤 User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("leave:room", (roomId: string) => {
    socket.leave(roomId);
    console.log(`👤 User ${socket.id} left room: ${roomId}`);
  });

  socket.on("thread:like", (data: { threadId: number; userId: number }) => {
    console.log(`❤️ Thread ${data.threadId} liked by user ${data.userId}`);
    socket.broadcast.emit("thread:liked", data);
  });

  socket.on("thread:unlike", (data: { threadId: number; userId: number }) => {
    console.log(`💔 Thread ${data.threadId} unliked by user ${data.userId}`);
    socket.broadcast.emit("thread:unliked", data);
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id} - Reason: ${reason}`);
  });
});

// Only start the server and background tasks if this file is executed directly.
if (require.main === module) {
  const startServer = () => {
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Dokumentasi tersedia di http://localhost:${PORT}/api-docs`);
    });
  };

  startServer();

  (async function tryConnect() {
    try {
      await connectRedis();
      console.log("Connected to Redis");
    } catch (err) {
      console.warn("Initial Redis connect failed (non-blocking):", err);

      const retryInterval = Number(process.env.REDIS_RETRY_INTERVAL) || 30000; // 30 seconds
      const intervalId = setInterval(async () => {
        try {
          await connectRedis();
          console.log("Connected to Redis on retry");
          clearInterval(intervalId);
        } catch (e) {
          console.warn("Retrying Redis connection failed:", e);
        }
      }, retryInterval);
    }
  })();

  process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
  });
}
