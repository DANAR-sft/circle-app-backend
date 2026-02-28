import express from "express";
import {
  getProfile,
  getProfileById,
  getAllProfiles,
  updateProfile,
} from "../controllers/profile";
import { jwtAuth } from "../middleware/jwtAuth";
import { upload } from "../lib/multer";

const route = express.Router();

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile object
 */
route.get("/profile", jwtAuth, getProfile);

/**
 * @openapi
 * /api/v1/profile/{id}:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get profile by ID
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
 *         description: Profile object
 */
route.get("/profile/:id", jwtAuth, getProfileById);

/**
 * @openapi
 * /api/v1/profiles:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get list of all profiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of profiles
 */
route.get("/profiles", jwtAuth, getAllProfiles);

/**
 * @openapi
 * /api/v1/profile:
 *   patch:
 *     tags:
 *       - Profile
 *     summary: Update authenticated user's profile (supports avatar upload)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated profile
 */
route.patch("/profile", jwtAuth, upload.single("avatar"), updateProfile);

export default route;
