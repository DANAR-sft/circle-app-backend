import swaggerJsdoc from "swagger-jsdoc";

const port = process.env.PORT || 3000;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Circle-App API Documentation",
      version: "1.0.0",
      description: "Dokumentasi API untuk backend Circle-App",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            email: { type: "string" },
            fullname: { type: "string" },
            photo_profile: { type: "string" },
            bio: { type: "string" },
          },
        },
        Thread: {
          type: "object",
          properties: {
            id: { type: "integer" },
            content: { type: "string" },
            image: {
              type: "array",
              items: { type: "string" },
            },
            user: { $ref: "#/components/schemas/User" },
            createdAt: { type: "string", format: "date-time" },
            likes: { type: "integer" },
            reply: { type: "integer" },
            isliked: { type: "boolean" },
            likeId: { type: "integer" },
          },
        },
        FollowItem: {
          type: "object",
          properties: {
            id: { type: "integer" },
            followerId: { type: "integer" },
            followingId: { type: "integer" },
            follower: { $ref: "#/components/schemas/User" },
            following: { $ref: "#/components/schemas/User" },
            isFollowedBack: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        FollowActionResponse: {
          type: "object",
          properties: {
            code: { type: "integer" },
            status: { type: "string" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                userId: { type: "integer" },
                isFollowing: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  },
  // Path ke file yang berisi komentar dokumentasi (routes dengan JSDoc OpenAPI)
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
