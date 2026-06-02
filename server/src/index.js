import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import messageRoutes from "./routes/message.js";
import friendshipRoutes from "./routes/friendship.js";
const app = express();
const PORT = process.env.PORT;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friendships", friendshipRoutes);
// Error handler — must have 4 parameters for Express to recognize it
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || "Internal Server Error" });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
