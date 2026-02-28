import { Request, Response } from "express";
import { prisma } from "../connection/database";

export async function searchProfiles(req: Request, res: Response) {
  try {
    const { keyword } = req.query;

    if (typeof keyword !== "string" || keyword.trim() === "") {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Invalid or missing keyword",
      });
    }

    const profiles = await prisma.users.findMany({
      where: {
        OR: [
          {
            fullname: { contains: keyword, mode: "insensitive" },
          },
          {
            username: { contains: keyword, mode: "insensitive" },
          },
        ],
      },
      omit: { password: true },
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Profiles retrieved successfully",
      data: profiles,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve profiles",
    });
  }
}
