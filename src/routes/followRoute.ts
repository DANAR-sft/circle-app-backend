import express from "express";
import { followUser, unfollowUser, getFollows } from "../controllers/follow";
import { jwtAuth } from "../middleware/jwtAuth";

const route = express.Router();

/**
 * @openapi
 * /api/v1/follow:
 *   post:
 *     tags:
 *       - Follow
 *     summary: Follow a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: integer
 *           examples:
 *             follow:
 *               value:
 *                 id: 123
 *     responses:
 *       201:
 *         description: User followed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowActionResponse'
 *       400:
 *         description: Bad request (e.g., already following or cannot follow self)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
route.post("/follow", jwtAuth, followUser);

/**
 * @openapi
 * /api/v1/follow:
 *   delete:
 *     tags:
 *       - Follow
 *     summary: Unfollow a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: integer
 *           examples:
 *             unfollow:
 *               value:
 *                 id: 123
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowActionResponse'
 *       400:
 *         description: Bad request (e.g., not following this user)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
route.delete("/follow", jwtAuth, unfollowUser);

/**
 * @openapi
 * /api/v1/follow:
 *   get:
 *     tags:
 *       - Follow
 *     summary: Get follow relationships for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [followers, following]
 *         required: true
 *         description: Type of list to retrieve ("followers" or "following")
 *     responses:
 *       200:
 *         description: Follows retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FollowItem'
 *       400:
 *         description: Bad request (e.g., missing or invalid `type`)
 */
route.get("/follow", jwtAuth, getFollows);

export default route;
