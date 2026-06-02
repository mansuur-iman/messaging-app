import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { sendMessage, getMessages } from "../controllers/messageController.js";
const router = Router();
router.post("/:userId", authenticateToken, sendMessage);
router.get("/:userId", authenticateToken, getMessages);
export default router;
