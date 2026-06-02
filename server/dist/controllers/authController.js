import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "../validations/auth.js";
export const register = async (req, res, next) => {
  try {
    // Validate
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: parsed.error.flatten().fieldErrors });
    }
    const { username, email, password, avatar, bio } = parsed.data;
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new user
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword, avatar, bio },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
      },
    });
    return res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    // Validate
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: parsed.error.flatten().fieldErrors });
    }
    const { username, password } = parsed.data;
    // Find user
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const { password: _, ...userWithoutPassword } = user;
    return res
      .status(200)
      .json({ message: "Login successful", token, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};
