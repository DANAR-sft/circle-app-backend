import { Request, Response } from "express";
import { prisma } from "../connection/database";
import { getIO } from "../utils/socketEmitter";

export async function followUser(req: Request, res: Response) {
  // id yang mau di follow
  const { id } = req.body;
  // id user yang ingin follow
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    // Cek apakah sudah following (record exist?)
    const existingFollow = await prisma.following.findFirst({
      where: {
        followerId: userId,
        followingId: Number(id),
      },
    });

    // Jika record exist → artinya sudah following
    if (existingFollow) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Already following this user",
      });
    }

    // Jika record tidak exist → buat follow
    if (Number(id) !== userId) {
      const follow = await prisma.following.create({
        data: {
          followerId: userId,
          followingId: Number(id),
        },
      });

      // Get updated follower/following counts
      const followerCount = await prisma.following.count({
        where: { followingId: Number(id) },
      });
      const followingCount = await prisma.following.count({
        where: { followerId: Number(id) },
      });

      // Emit socket event untuk real-time update
      getIO().emit("follow:updated", {
        userId: userId,
        targetUserId: Number(id),
        isFollowing: true,
      });

      // Emit follower count update
      getIO().emit("follow:count:updated", {
        userId: Number(id),
        followerCount: followerCount,
        followingCount: followingCount,
      });

      return res.status(201).json({
        code: 201,
        status: "success",
        message: "User followed successfully",
        data: { userId: follow.followingId, isFollowing: true },
      });
    } else {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "You cannot follow yourself",
      });
    }
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to follow user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function unfollowUser(req: Request, res: Response) {
  try {
    const { id } = req.body;
    const userId = req.user?.id;
    const targetUserId = Number(id);

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    // Cek apakah record following exist
    const existingFollow = await prisma.following.findFirst({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    // Jika record tidak exist → tidak sedang following
    if (!existingFollow) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Not following this user",
      });
    }

    // Jika record exist → hapus untuk unfollow
    await prisma.following.delete({
      where: {
        id: existingFollow.id,
      },
    });

    // Get updated follower/following counts
    const followerCount = await prisma.following.count({
      where: { followingId: targetUserId },
    });
    const followingCount = await prisma.following.count({
      where: { followerId: targetUserId },
    });

    // Emit socket event untuk real-time update
    getIO().emit("follow:updated", {
      userId: userId,
      targetUserId: targetUserId,
      isFollowing: false,
    });

    // Emit follower count update
    getIO().emit("follow:count:updated", {
      userId: targetUserId,
      followerCount: followerCount,
      followingCount: followingCount,
    });

    res.status(200).json({
      code: 200,
      status: "success",
      message: "User unfollowed successfully",
      data: { userId: targetUserId, isFollowing: false },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to unfollow user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getFollows(req: Request, res: Response) {
  try {
    const { type } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    if (type === "followers") {
      const followers = await prisma.following.findMany({
        where: { followingId: userId },
        include: {
          follower: { omit: { password: true } },
        },
      });

      // Batch query: get all users that the logged-in user follows back (single query instead of N queries)
      const followerIds = followers.map((f) => f.followerId);
      const followedBackRecords = await prisma.following.findMany({
        where: {
          followerId: userId,
          followingId: { in: followerIds },
        },
        select: { followingId: true },
      });
      const followedBackSet = new Set(
        followedBackRecords.map((r) => r.followingId),
      );

      const followersWithStatus = followers.map((f) => ({
        ...f,
        isFollowedBack: followedBackSet.has(f.followerId),
      }));

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Follows retrieved successfully",
        data: followersWithStatus,
      });
    }

    if (type === "following") {
      const following = await prisma.following.findMany({
        where: { followerId: userId },
        include: {
          following: { omit: { password: true } },
        },
      });
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Follows retrieved successfully",
        data: following,
      });
    }
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve follows",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
