import express from "express";
import { loginController, registerController } from "../controllers/loginPage";
import { getProfile } from "../controllers/profile";
import { jwtAuth } from "../middleware/jwtAuth";

const route = express.Router();

/**
 * @openapi
 * /api/v1/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
route.post("/login", loginController);

/**
 * @openapi
 * /api/v1/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - username
 *               - email
 *               - password
 *             properties:
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *           examples:
 *             register:
 *               value:
 *                 fullname: "John Doe"
 *                 username: "johndoe"
 *                 email: "john@example.com"
 *                 password: "secret"
 *     responses:
 *       201:
 *         description: User created successfully with JWT token
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         description: Validation or bad request
 *       500:
 *         description: Server error
 */
route.post("/register", registerController);

/**
 * @openapi
 * /api/v1/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's profile
 */
route.get("/me", jwtAuth, getProfile);

export default route;
