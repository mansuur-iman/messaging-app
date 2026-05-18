import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
  getPendingFriendRequests,
  rejectFriendRequest,
} from "../controllers/friendshipController.js";

const router = Router();
router.get("/pending", authenticateToken, getPendingFriendRequests);
router.get("/", authenticateToken, getFriendsList);

router.post("/request/:userId", authenticateToken, sendFriendRequest);

router.put("/accept/:requestId", authenticateToken, acceptFriendRequest);
router.put("/reject/:requestId", authenticateToken, rejectFriendRequest);

export default router;
