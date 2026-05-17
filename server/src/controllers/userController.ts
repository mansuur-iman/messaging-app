import { prisma } from "../../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import { updateProfileSchema } from "../validations/auth.js";
import { paginateUsers } from "../services/userService.js";

type paginationQuery = {
  page: string;
  limit: string;
};

const getUsers = async (
  req: Request,
  {},
  {},
  pagination: paginationQuery,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { skip, limit, page } = paginateUsers(
      parseInt(pagination.page) || 1,
      parseInt(pagination.limit) || 20,
    );

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
      },
      orderBy: {
        username: "asc",
      },
      skip,
      take: limit,
    });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        // don't expose email on public profile
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        username: true,
        email: true, // only you can see your own email
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user?.userId !== id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: parsed.error.flatten().fieldErrors });
    }

    // check if username is taken by someone else
    if (parsed.data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: parsed.data.username },
      });
      if (existing && existing.id !== id) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
      },
    });

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user?.userId !== id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export default { getUsers, getUser, getMe, updateUser, deleteUser };
