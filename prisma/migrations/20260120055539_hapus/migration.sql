/*
  Warnings:

  - You are about to drop the column `authorId` on the `threads` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "threads" DROP CONSTRAINT "threads_authorId_fkey";

-- AlterTable
ALTER TABLE "threads" DROP COLUMN "authorId";
