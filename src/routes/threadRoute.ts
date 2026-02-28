import express from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  createThread,
  getThreads,
  getThreadById,
  getMyThreads,
  updateThread,
  deleteThread,
} from "../controllers/thread";
import { upload } from "../lib/multer";

const route = express.Router();

/**
 * @openapi
 * /api/v1/thread:
 *   post:
 *     tags:
 *       - Thread
 *     summary: Create a new thread (supports images)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *           encoding:
 *             image:
 *               style: form
 *               explode: false
 *     responses:
 *       201:
 *         description: Thread created
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
 *                   $ref: '#/components/schemas/Thread'
 */
route.post("/thread", jwtAuth, upload.array("image", 12), createThread);

/**
 * @openapi
 * /api/v1/thread:
 *   get:
 *     tags:
 *       - Thread
 *     summary: Retrieve list of threads
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of threads
 */
route.get("/thread", jwtAuth, getThreads);

/**
 * @openapi
 * /api/v1/thread/mine:
 *   get:
 *     tags:
 *       - Thread
 *     summary: Get threads created by authenticated user (cached)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user's threads
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
 *                     $ref: '#/components/schemas/Thread'
 */
route.get("/thread/mine", jwtAuth, getMyThreads);

/**
 * @openapi
 * /api/v1/thread/{id}:
 *   get:
 *     tags:
 *       - Thread
 *     summary: Get thread by ID
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
 *         description: Thread details
 */
route.get("/thread/:id", jwtAuth, getThreadById);

/**
 * @openapi
 * /api/v1/thread/{id}:
 *   patch:
 *     tags:
 *       - Thread
 *     summary: Update a thread (placeholder route)
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
 *         description: Updated thread message
 */
route.patch("/thread/:id", jwtAuth, updateThread);

/**
 * @openapi
 * /api/v1/thread/{id}:
 *   delete:
 *     tags:
 *       - Thread
 *     summary: Delete a thread
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
 *         description: Thread deleted successfully
 *       403:
 *         description: Not authorized to delete this thread
 *       404:
 *         description: Thread not found
 */
route.delete("/thread/:id", jwtAuth, deleteThread);

export default route;
