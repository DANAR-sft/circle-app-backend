import { Request, Response } from "express";
import { prisma } from "../connection/database";
import { profileUpdateSchema } from "../types/joiValidation";

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const userProfile = await prisma.users.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: {
        _count: {
          select: { followers: true, following: true },
        },
      },
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "User profile retrieved successfully",
      data: {
        id: userProfile?.id,
        username: userProfile?.username,
        name: userProfile?.fullname,
        avatar: userProfile?.photo_profile,
        cover: userProfile?.photo_profile,
        bio: userProfile?.bio,
        follower_count: userProfile?._count.followers,
        following_count: userProfile?._count.following,
      },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve user profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getProfileById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // User yang sedang login

    const userProfile = await prisma.users.findUnique({
      where: { id: Number(id) },
      omit: { password: true },
      include: {
        _count: {
          select: { followers: true, following: true },
        },
      },
    });

    if (!userProfile) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "User not found",
      });
    }

    // Cek apakah user yang login sedang follow profile ini
    // Record exist = sudah following, tidak exist = belum following
    let isFollowing = false;
    if (userId) {
      const followRecord = await prisma.following.findFirst({
        where: {
          followerId: userId,
          followingId: Number(id),
        },
      });
      isFollowing = !!followRecord; // Convert ke boolean: exist = true, tidak = false
    }

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "User profile retrieved successfully",
      data: {
        ...userProfile,
        isFollowing, // Tambahkan status following
      },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve user profile",
    });
  }
}

export async function getAllProfiles(req: Request, res: Response) {
  const userId = req.user?.id;

  try {
    const users = await prisma.users.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        id: { not: userId },
      },
      omit: { password: true },
      include: {
        _count: {
          select: { followers: true, following: true },
        },
      },
    });

    // Batch query: get all users the logged-in user follows (single query instead of N queries)
    const followingRecords = await prisma.following.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingSet = new Set(followingRecords.map((r) => r.followingId));

    const usersWithFollowStatus = users.map((user) => ({
      ...user,
      isFollowing: followingSet.has(user.id),
    }));

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Users retrieved successfully",
      data: usersWithFollowStatus,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve users",
    });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const { fullname, username, bio } = req.body;
    const avatar = req.file?.path;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Unauthorized - User not found",
      });
    }

    const valid = profileUpdateSchema.validate({
      fullname,
      username,
      bio,
    });

    if (valid.error) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: valid.error.details[0].message,
      });
    }

    const updatedProfile = await prisma.users.update({
      where: { id: userId },
      data: { photo_profile: avatar, fullname, username, bio },
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to update profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
