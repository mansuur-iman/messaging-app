import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import messageController from "../controllers/messageController.js";
import { rmSync } from "fs";

const router = Router();

router.post("/:userId", authenticateToken, messageController.sendMessage);
router.get("/:userId", authenticateToken, messageController.getMessages);

export default router;
