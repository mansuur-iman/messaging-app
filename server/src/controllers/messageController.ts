import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import { sendMessageSchema } from "../validations/auth.js";
import { paginate } from "../services/userService.js";

type paginationQuery = {
  page?: string;
  limit?: string;
};

const sendMessage = async (
  req: Request<{ userId: string }, {}, { content: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = sendMessageSchema.safeParse({ content });
    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: parsed.error.flatten().fieldErrors });
    }

    // --- FIX: Allow Note-to-Self without checking Friendship rules ---
    const isNoteToSelf = userId === senderId;

    if (!isNoteToSelf) {
      const receiver = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { userId: senderId, friendId: userId },
            { userId, friendId: senderId },
          ],
        },
      });

      if (!friendship) {
        return res
          .status(403)
          .json({ message: "You can only message your friends" });
      }
    }

    const message = await prisma.message.create({
      data: {
        content: parsed.data.content,
        senderId,
        receiverId: userId,
        read: isNoteToSelf, // Mark as read instantly if sending to self
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        receiverId: true,
        createdAt: true,
        read: true,
      },
    });

    return res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (
  req: Request<{ userId: string }, {}, {}, paginationQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { skip, limit, page } = paginate(
      Number(req.query.page || 1),
      Number(req.query.limit || 20),
    );

    // --- FIX: Logic handles single user ID filter correctly for Notes ---
    const conversationFilter =
      userId === currentUserId
        ? { senderId: currentUserId, receiverId: currentUserId }
        : {
            OR: [
              { senderId: currentUserId, receiverId: userId },
              { senderId: userId, receiverId: currentUserId },
            ],
          };

    if (userId !== currentUserId) {
      await prisma.message.updateMany({
        where: {
          senderId: userId,
          receiverId: currentUserId,
          read: false,
        },
        data: { read: true },
      });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: conversationFilter,
        orderBy: { createdAt: "desc" }, // Handles paginated sorting limits
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          senderId: true,
          receiverId: true,
          createdAt: true,
          read: true,
        },
      }),
      prisma.message.count({
        where: conversationFilter,
      }),
    ]);

    return res.status(200).json({
      // Backend reverses so older items show up top in chronological order
      data: [...messages].reverse(),
      total,
      page,
    });
  } catch (error) {
    next(error);
  }
};

export { sendMessage, getMessages };
