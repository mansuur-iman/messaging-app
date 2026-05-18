import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
  getPendingFriendRequests,
} from "../controllers/friendshipController.js";

const router = Router();

router.post("/request/:userId", authenticateToken, sendFriendRequest);
router.post("/accept/:requestId", authenticateToken, acceptFriendRequest);
router.get("/", authenticateToken, getFriendsList);
router.get("/pending", authenticateToken, getPendingFriendRequests);

export default router;
