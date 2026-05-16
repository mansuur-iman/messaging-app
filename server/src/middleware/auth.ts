import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid access token" });
    }
    req.user = decoded as { userId: string };
    next();
  });
};
