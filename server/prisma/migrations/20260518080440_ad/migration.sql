-- AlterEnum
ALTER TYPE "FriendshipStatus" ADD VALUE 'REJECTED';

-- DropIndex
DROP INDEX "Message_receiverId_read_key";

-- CreateIndex
CREATE INDEX "Message_receiverId_read_idx" ON "Message"("receiverId", "read");
