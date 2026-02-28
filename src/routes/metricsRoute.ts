import express from "express";
import { getCacheMetrics } from "../controllers/metrics";
import { jwtAuth } from "../middleware/jwtAuth";

const route = express.Router();

/**
 * @openapi
 * /api/v1/metrics/cache:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get cache metrics for My Threads (global and per-user)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Optional user id to get per-user metrics
 *     responses:
 *       200:
 *         description: Metrics object with global and optional user counters
 */
route.get("/metrics/cache", jwtAuth, getCacheMetrics);

export default route;
