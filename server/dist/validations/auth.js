import { z } from "zod";
export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(20, "Username must be at most 20 characters long")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password is too long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
    bio: z
        .string()
        .max(200, "Bio must be at most 200 characters long")
        .trim()
        .optional(),
});
export const loginSchema = z.object({
    username: z.string().min(1, "Username is required").trim(),
    password: z.string().min(1, "Password is required"),
});
export const updateProfileSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(20, "Username must be at most 20 characters long")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .trim()
        .optional(),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
    bio: z
        .string()
        .max(200, "Bio must be at most 200 characters long")
        .trim()
        .optional(),
});
export const sendMessageSchema = z.object({
    content: z
        .string()
        .min(1, "Message cannot be empty")
        .max(1000, "Message must be at most 1000 characters long")
        .trim(),
});
