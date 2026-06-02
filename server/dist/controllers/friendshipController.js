import { prisma } from "../../lib/prisma.js";
const sendFriendRequest = async (req, res, next) => {
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
                REJECTED: `You have a rejected friend request with ${receiver.username}`,
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
    }
    catch (error) {
        next(error);
    }
};
const getPendingFriendRequests = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
const acceptFriendRequest = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
const getFriendsList = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const friendships = await prisma.friendship.findMany({
            where: {
                AND: [
                    { status: "ACCEPTED" },
                    { OR: [{ userId }, { friendId: userId }] },
                ],
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
        const friendsList = await Promise.all(friendships.map(async (f) => {
            const isUser = f.userId === userId;
            const friendData = isUser ? f.friend : f.user;
            const unreadCount = await prisma.message.count({
                where: {
                    senderId: friendData.id,
                    receiverId: userId,
                    read: false,
                },
            });
            return {
                id: friendData.id,
                username: friendData.username,
                avatar: friendData.avatar,
                unreadCount,
            };
        }));
        return res.status(200).json({
            data: friendsList,
            length: friendsList.length,
        });
    }
    catch (error) {
        next(error);
    }
};
const rejectFriendRequest = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
const getSentFriendRequests = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const sent = await prisma.friendship.findMany({
            where: { userId, status: "PENDING" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                friend: {
                    select: { id: true, username: true, avatar: true },
                },
            },
        });
        return res.status(200).json({ data: sent });
    }
    catch (error) {
        next(error);
    }
};
export { sendFriendRequest, getPendingFriendRequests, acceptFriendRequest, getFriendsList, rejectFriendRequest, getSentFriendRequests, };
