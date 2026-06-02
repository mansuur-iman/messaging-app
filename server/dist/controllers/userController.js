import { prisma } from "../../lib/prisma.js";
import { updateProfileSchema } from "../validations/auth.js";
import { paginate } from "../services/userService.js";
const getUsers = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page || "1", 10);
        const limitNumber = parseInt(limit || "20", 10);
        const { skip, limit: take } = paginate(pageNumber, limitNumber);
        const [users, total] = await Promise.all([
            prisma.user.findMany({
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
                take,
            }),
            prisma.user.count(),
        ]);
        res.status(200).json({
            data: users,
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
            hasMore: pageNumber * limitNumber < total,
        });
    }
    catch (error) {
        next(error);
    }
};
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        next(error);
    }
};
const getMe = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user?.userId },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        next(error);
    }
};
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.user?.userId !== id) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        if (parsed.data.username) {
            const existing = await prisma.user.findUnique({
                where: {
                    username: parsed.data.username,
                },
            });
            if (existing && existing.id !== id) {
                return res.status(400).json({
                    message: "Username already taken",
                });
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
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
};
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.user?.userId !== id) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }
        await prisma.user.delete({
            where: { id },
        });
        res.status(200).json({
            message: "Account deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
export default {
    getUsers,
    getUser,
    getMe,
    updateUser,
    deleteUser,
};
