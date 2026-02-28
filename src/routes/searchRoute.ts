import express from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { searchProfiles } from "../controllers/search";

const route = express.Router();

/**
 * @openapi
 * /api/v1/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search profiles by query
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
route.get("/search", jwtAuth, searchProfiles);

export default route;
