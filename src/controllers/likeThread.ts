import { Request, Response } from "express";
import { prisma } from "../connection/database";
import { getIO } from "../utils/socketEmitter";

export async function likeThread(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { threadId } = req.body;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const liked = await prisma.likes.create({
      data: {
        userId: userId,
        threadId: Number(threadId),
      },
    });

    const actualLikeCount = await prisma.likes.count({
      where: { threadId: Number(threadId) },
    });

    getIO().emit("like:updated", {
      threadId: Number(threadId),
      likeCount: actualLikeCount,
      likeId: liked.id,
      userId: userId,
      action: "like",
    });

    return res.status(201).json({
      code: 201,
      status: "success",
      message: "Thread liked successfully",
      data: liked,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to like thread",
    });
  }
}

export async function unlikeThread(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const likeToDelete = await prisma.likes.findUnique({
      where: { id: Number(id) },
    });

    if (!likeToDelete) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Like not found",
      });
    }

    const threadId = likeToDelete.threadId;

    const unliked = await prisma.likes.delete({
      where: {
        id: Number(id),
      },
    });

    const actualLikeCount = await prisma.likes.count({
      where: { threadId: threadId },
    });

    getIO().emit("like:updated", {
      threadId: threadId,
      likeCount: actualLikeCount,
      userId: userId,
      action: "unlike",
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Thread unliked successfully",
      data: unliked,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to unlike thread",
    });
  }
}
