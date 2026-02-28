/*
  Warnings:

  - The `image` column on the `threads` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "threads" DROP COLUMN "image",
ADD COLUMN     "image" TEXT[] DEFAULT ARRAY[]::TEXT[];
