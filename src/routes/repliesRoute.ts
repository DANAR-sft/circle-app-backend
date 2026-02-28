import express from "express";
import { createReply, getReply } from "../controllers/replies";
import { upload } from "../lib/multer";
import { jwtAuth } from "../middleware/jwtAuth";

const route = express.Router();

/**
 * @openapi
 * /api/v1/reply:
 *   post:
 *     tags:
 *       - Reply
 *     summary: Post a reply to a thread (optional image)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               threadId:
 *                 type: integer
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Reply created
 */
route.post("/reply", jwtAuth, upload.single("image"), createReply);

/**
 * @openapi
 * /api/v1/reply/{threadId}:
 *   get:
 *     tags:
 *       - Reply
 *     summary: Get replies for a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of replies
 */
route.get("/reply/:threadId", jwtAuth, getReply);

export default route;
