import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute";
import threadRoute from "./routes/threadRoute";
import profileRoute from "./routes/profileRoute";
import replyRoute from "./routes/repliesRoute";
import likeRoute from "./routes/likeRoute";
import followRoute from "./routes/followRoute";
import searchRoute from "./routes/searchRoute";
import metricsRoute from "./routes/metricsRoute";
import healthRoute from "./routes/healthRoute";
import { corsOptions } from "./lib/cors";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimiter";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger";

dotenv.config();
const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Per-request timeout (15s) to avoid requests hanging forever
app.use((req, res, next) => {
  (res as any).setTimeout(15000, () => {
    console.warn("Request timed out:", req.method, req.originalUrl);
    if (!res.headersSent) {
      res
        .status(504)
        .json({ code: 504, status: "error", message: "Request timed out" });
    }
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsOptions);

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Rate limiting: auth endpoints get stricter limits
app.use("/api/v1/login", authRateLimiter);
app.use("/api/v1/register", authRateLimiter);

// Global API rate limiting
app.use("/api/v1", apiRateLimiter);

app.use(
  "/api/v1",
  authRoute,
  threadRoute,
  profileRoute,
  replyRoute,
  likeRoute,
  followRoute,
  searchRoute,
  metricsRoute,
  healthRoute,
);

export default app;
