/*
  Warnings:

  - A unique constraint covering the columns `[followerId,followingId]` on the table `following` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,threadId]` on the table `likes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "following_followerId_idx" ON "following"("followerId");

-- CreateIndex
CREATE INDEX "following_followingId_idx" ON "following"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "following_followerId_followingId_key" ON "following"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE INDEX "likes_threadId_idx" ON "likes"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_threadId_key" ON "likes"("userId", "threadId");

-- CreateIndex
CREATE INDEX "threads_createdById_idx" ON "threads"("createdById");

-- CreateIndex
CREATE INDEX "threads_createdAt_idx" ON "threads"("createdAt");
