import { Request, Response } from "express";
import { prisma } from "../connection/database";
import { replySchema } from "../types/joiValidation";
import { getIO } from "../utils/socketEmitter";

export async function createReply(req: Request, res: Response) {
  try {
    const { content, threadId } = req.body;
    const image = req.file?.filename;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const valid = replySchema.validate({ content, threadId });
    if (valid.error) {
      return res.status(400).json({
        code: 400,
        status: "error",
        error: valid.error.details[0].message,
      });
    }

    const newReply = await prisma.replies.create({
      data: {
        content,
        image,
        threadId: Number(threadId),
        userId: userId,
        createdById: userId,
      },
      // Include user data for the socket event
      include: {
        user: true,
      },
    });

    // 🔌 SOCKET.IO: Emit event to all connected clients
    // This broadcasts the new reply to everyone viewing this thread
    getIO().emit("reply:created", {
      id: newReply.id,
      content: newReply.content,
      image: newReply.image,
      user: newReply.user,
      threadId: newReply.threadId,
      createdAt: newReply.createdAt,
    });

    // 🔌 SOCKET.IO: Get actual reply count from database and emit
    const actualReplyCount = await prisma.replies.count({
      where: { threadId: Number(threadId) },
    });

    getIO().emit("reply:count:updated", {
      threadId: newReply.threadId,
      replyCount: actualReplyCount, // Actual count from database
    });

    return res.status(201).json({
      code: 201,
      status: "success",
      message: "Reply created successfully",
      data: newReply,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to create reply",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getReply(req: Request, res: Response) {
  try {
    const { threadId } = req.params;

    const replies = await prisma.replies.findMany({
      where: { threadId: Number(threadId) },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const mappedReplies = replies.map((reply) => {
      return {
        id: reply.id,
        content: reply.content,
        image: reply.image,
        user: reply.user,
        createdAt: reply.createdAt,
      };
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Replies retrieved successfully",
      data: mappedReplies,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve replies",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
