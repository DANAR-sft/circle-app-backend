import express from "express";
import { likeThread, unlikeThread } from "../controllers/likeThread";
import { jwtAuth } from "../middleware/jwtAuth";

const route = express.Router();

/**
 * @openapi
 * /api/v1/like:
 *   post:
 *     tags:
 *       - Like
 *     summary: Like a thread
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               threadId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Liked
 */
route.post("/like", jwtAuth, likeThread);

/**
 * @openapi
 * /api/v1/like/{id}:
 *   delete:
 *     tags:
 *       - Like
 *     summary: Unlike a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Unliked
 */
route.delete("/like/:id", jwtAuth, unlikeThread);

export default route;
