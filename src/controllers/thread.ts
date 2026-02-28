import { Request, Response } from "express";
import { threadSchema } from "../types/joiValidation";
import { prisma } from "../connection/database";
import { getIO } from "../utils/socketEmitter";
import { invalidateFeedCache } from "../utils/cacheInvalidation";
import {
  redisClient,
  safeGet,
  safeSetEx,
  safeDel,
  safeIncr,
} from "../config/redis";

export async function createThread(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const { content } = req.body;
    const files = req.files as Express.Multer.File[];
    const imageFilenames = files ? files.map((file) => file.path) : [];

    const valid = threadSchema.validate({ content });
    if (valid.error) {
      return res.status(400).json({
        code: 400,
        status: "error",
        error: valid.error.details[0].message,
      });
    }

    const tweet = await prisma.threads.create({
      data: {
        content,
        image: imageFilenames,
        createdById: userId,
      },
      include: {
        createdBy: { omit: { password: true } },
        _count: {
          select: { likes: true, replies: true },
        },
      },
    });

    // Format thread untuk response dan broadcast
    const formattedThread = {
      id: tweet.id,
      content: tweet.content,
      image: tweet.image,
      user: tweet.createdBy,
      createdAt: tweet.createdAt,
      likes: tweet._count.likes,
      reply: tweet._count.replies,
      isliked: false,
    };

    // 🔌 Broadcast ke semua client yang terhubung
    getIO().emit("thread:created", formattedThread);

    // Invalidate cached "my threads" for this user (best-effort)
    try {
      const cacheKey = `user:${userId}:threads`;
      await safeDel(cacheKey);
      await invalidateFeedCache();
      // Metrics: invalidation (best-effort)
      try {
        await safeIncr("metrics:cache:myThreads:invalidations");
        await safeIncr(`metrics:cache:user:${userId}:invalidations`);
      } catch (e) {
        console.error("Safe Redis incr error (invalidation metrics):", e);
      }
    } catch (e) {
      console.error("Safe Redis del error (createThread):", e);
    }

    return res.status(201).json({
      code: 201,
      status: "success",
      message: "Thread berhasil diposting",
      data: formattedThread,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Gagal membuat thread",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get threads created by authenticated user (with Redis caching)
 */
export const getMyThreads = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const cacheKey = `user:${userId}:threads`;

    try {
      const cached = await safeGet(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Metrics: cache hit (global + per-user)
        try {
          await safeIncr("metrics:cache:myThreads:hits");
          await safeIncr(`metrics:cache:user:${userId}:myThreads:hits`);
        } catch (e) {
          console.error("Safe Redis incr error (cache hit metrics):", e);
        }
        console.log(`Cache HIT for key=${cacheKey}`);
        return res.status(200).json({
          code: 200,
          status: "success",
          message: "My threads retrieved (cache)",
          data,
        });
      } else {
        // Metrics: cache miss (global + per-user)
        try {
          await safeIncr("metrics:cache:myThreads:misses");
          await safeIncr(`metrics:cache:user:${userId}:myThreads:misses`);
        } catch (e) {
          console.error("Safe Redis incr error (cache miss metrics):", e);
        }
        console.log(`Cache MISS for key=${cacheKey}`);
      }
    } catch (e) {
      console.error("Redis get error:", e);
      // proceed to fetch from DB
    }

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [threads, totalCount] = await Promise.all([
      prisma.threads.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { likes: true, replies: true } },
          // Only fetch the current user's like (not ALL likes)
          likes: { where: { userId }, take: 1 },
          createdBy: { omit: { password: true } },
        },
      }),
      prisma.threads.count({ where: { createdById: userId } }),
    ]);

    const formattedThreads = threads.map((thread) => {
      const userLike = thread.likes[0];
      return {
        id: thread.id,
        content: thread.content,
        image: thread.image,
        user: thread.createdBy,
        createdAt: thread.createdAt,
        likes: thread._count.likes,
        reply: thread._count.replies,
        isliked: !!userLike,
        likeId: userLike?.id,
      };
    });

    // Cache the result (best-effort)
    try {
      const ttl = Number(process.env.REDIS_TTL) || 60; // seconds
      await safeSetEx(cacheKey, ttl, JSON.stringify(formattedThreads));
      // Metrics: set
      try {
        await safeIncr("metrics:cache:myThreads:sets");
        await safeIncr(`metrics:cache:user:${userId}:myThreads:sets`);
      } catch (e) {
        console.error("Safe Redis incr error (cache set metrics):", e);
      }
    } catch (e) {
      console.error("Safe Redis set error:", e);
    }

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "My threads retrieved",
      data: formattedThreads,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve threads",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getThreads = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Try cache first (feed data without user-specific isliked)
    const cacheKey = `feed:page:${page}:limit:${limit}`;
    let threadsData: any[] | null = null;
    let totalCount = 0;
    let fromCache = false;

    try {
      const cached = await safeGet(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        threadsData = parsed.threads;
        totalCount = parsed.totalCount;
        fromCache = true;
      }
    } catch (e) {
      // proceed to DB
    }

    if (!threadsData) {
      const [threads, count] = await Promise.all([
        prisma.threads.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            _count: {
              select: { likes: true, replies: true },
            },
            createdBy: { omit: { password: true } },
          },
        }),
        prisma.threads.count(),
      ]);

      totalCount = count;
      threadsData = threads.map((thread) => ({
        id: thread.id,
        content: thread.content,
        image: thread.image,
        user: thread.createdBy,
        createdAt: thread.createdAt,
        likes: thread._count.likes,
        reply: thread._count.replies,
      }));

      // Cache the feed data (without user-specific isliked)
      try {
        const ttl = Number(process.env.REDIS_TTL) || 60;
        await safeSetEx(
          cacheKey,
          ttl,
          JSON.stringify({ threads: threadsData, totalCount }),
        );
      } catch (e) {
        // best-effort
      }
    }

    // Merge user-specific isliked status (always fresh from DB)
    const threadIds = threadsData.map((t: any) => t.id);
    const userLikes = await prisma.likes.findMany({
      where: { userId, threadId: { in: threadIds } },
      select: { threadId: true, id: true },
    });
    const likeMap = new Map(userLikes.map((l) => [l.threadId, l.id]));

    const formattedThreads = threadsData.map((thread: any) => ({
      ...thread,
      isliked: likeMap.has(thread.id),
      likeId: likeMap.get(thread.id),
    }));

    return res.status(200).json({
      code: 200,
      status: "success",
      message: fromCache
        ? "Threads retrieved (cache)"
        : "Threads retrieved successfully",
      data: formattedThreads,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve threads",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export async function getThreadById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const threadById = await prisma.threads.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: { omit: { password: true } },
        _count: { select: { likes: true, replies: true } },
      },
    });

    if (!threadById) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Thread not found",
      });
    }

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Thread retrieved successfully",
      data: {
        id: threadById.id,
        content: threadById.content,
        image: threadById.image,
        user: threadById.createdBy,
        createdAt: threadById.createdAt,
        likes: threadById._count.likes,
        replies: threadById._count.replies,
      },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve thread",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function updateThread(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const thread = await prisma.threads.findUnique({
      where: { id: Number(id) },
    });

    if (!thread) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Thread not found",
      });
    }

    if (thread.createdById !== userId) {
      return res.status(403).json({
        code: 403,
        status: "error",
        message: "You can only update your own threads",
      });
    }

    const valid = threadSchema.validate({ content });
    if (valid.error) {
      return res.status(400).json({
        code: 400,
        status: "error",
        error: valid.error.details[0].message,
      });
    }

    const updatedThread = await prisma.threads.update({
      where: { id: Number(id) },
      data: { content, updatedById: userId },
      include: {
        createdBy: { omit: { password: true } },
        _count: { select: { likes: true, replies: true } },
      },
    });

    getIO().emit("thread:updated", {
      id: updatedThread.id,
      content: updatedThread.content,
      image: updatedThread.image,
      user: updatedThread.createdBy,
      createdAt: updatedThread.createdAt,
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Thread updated successfully",
      data: updatedThread,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to update thread",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function deleteThread(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const thread = await prisma.threads.findUnique({
      where: { id: Number(id) },
    });

    if (!thread) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Thread not found",
      });
    }

    if (thread.createdById !== userId) {
      return res.status(403).json({
        code: 403,
        status: "error",
        message: "You can only delete your own threads",
      });
    }

    // Cascade delete: remove related likes and replies first
    await prisma.$transaction([
      prisma.likes.deleteMany({ where: { threadId: Number(id) } }),
      prisma.replies.deleteMany({ where: { threadId: Number(id) } }),
      prisma.threads.delete({ where: { id: Number(id) } }),
    ]);

    // Invalidate cache
    try {
      await safeDel(`user:${userId}:threads`);
      await invalidateFeedCache();
    } catch (e) {
      // best-effort
    }

    getIO().emit("thread:deleted", { id: Number(id) });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Thread deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to delete thread",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
