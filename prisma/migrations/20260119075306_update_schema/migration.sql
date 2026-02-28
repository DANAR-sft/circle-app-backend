/*
  Warnings:

  - You are about to drop the column `createdBy` on the `following` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `following` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `likes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `likes` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `replies` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `replies` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `threads` table. All the data in the column will be lost.
  - You are about to drop the column `number_of_replis` on the `threads` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `threads` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "following" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "updatedById" INTEGER;

-- AlterTable
ALTER TABLE "likes" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "updatedById" INTEGER;

-- AlterTable
ALTER TABLE "replies" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "updatedById" INTEGER;

-- AlterTable
ALTER TABLE "threads" DROP COLUMN "createdBy",
DROP COLUMN "number_of_replis",
DROP COLUMN "updatedBy",
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "number_of_replies" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedById" INTEGER;

-- AddForeignKey
ALTER TABLE "following" ADD CONSTRAINT "following_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "following" ADD CONSTRAINT "following_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
