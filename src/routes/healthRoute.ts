import express from "express";
import { getHealth } from "../controllers/health";

const route = express.Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Get server health and Redis status
 *     responses:
 *       200:
 *         description: Health status with Redis connection info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     server:
 *                       type: string
 *                     redis:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                         ping:
 *                           type: string
 *                           nullable: true
 */
route.get("/health", getHealth);

export default route;
