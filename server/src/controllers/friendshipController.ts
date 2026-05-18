import { fr } from "zod/locales";
import { prisma } from "../../lib/prisma.js";
import { Request, Response, NextFunction } from "express";

const sendFriendRequest = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const senderId = req.user?.userId;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userId === senderId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
      },
    });

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: userId },
          { userId: userId, friendId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      const messages = {
        PENDING: `Friend request already sent to ${receiver.username}`,
        ACCEPTED: `You are already friends with ${receiver.username}`,
        BLOCKED: "Unable to send friend request",
      };
      return res
        .status(400)
        .json({ message: messages[existingFriendship.status] });
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId: senderId,
        friendId: userId,
        status: "PENDING",
      },
      select: {
        id: true,
        userId: true,
        friendId: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: `Friend request sent successfully to ${receiver.username}`,
      data: friendship,
    });
  } catch (error) {
    next(error);
  }
};

const getPendingFriendRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const pendingRequests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: "PENDING",
      },
      select: {
        id: true,

        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json({ data: pendingRequests, length: pendingRequests.length });
  } catch (error) {
    next(error);
  }
};

const acceptFriendRequest = async (
  req: Request<{ requestId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship || friendship.friendId !== userId) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendship.status !== "PENDING") {
      return res.status(400).json({ message: "Invalid friend request" });
    }

    const updatedFriendship = await prisma.friendship.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
      select: {
        id: true,
        userId: true,
        friendId: true,
        status: true,
        updatedAt: true,
        friend: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return res.status(200).json({
      message: "Friend request accepted successfully",
      data: updatedFriendship,
    });
  } catch (error) {
    next(error);
  }
};

const getFriendsList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ userId: userId }, { friendId: userId }],
      },
      select: {
        userId: true,
        friendId: true,
        user: {
          select: { id: true, username: true, avatar: true },
        },
        friend: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // normalize output so frontend always gets "friend"
    const friendsList = friendships.map((f) => {
      const isUser = f.userId === userId;

      return {
        id: isUser ? f.friend.id : f.user.id,
        username: isUser ? f.friend.username : f.user.username,
        avatar: isUser ? f.friend.avatar : f.user.avatar,
      };
    });

    return res.status(200).json({
      data: friendsList,
      length: friendsList.length,
    });
  } catch (error) {
    next(error);
  }
};

const rejectFriendRequest = async (
  req: Request<{ requestId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship || friendship.friendId !== userId) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendship.status !== "PENDING") {
      return res.status(400).json({ message: "Invalid friend request" });
    }

    await prisma.friendship.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    return res
      .status(200)
      .json({ message: "Friend request rejected successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  sendFriendRequest,
  getPendingFriendRequests,
  acceptFriendRequest,
  getFriendsList,
  rejectFriendRequest,
};
