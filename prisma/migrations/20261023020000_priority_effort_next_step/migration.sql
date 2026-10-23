-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Effort" AS ENUM ('QUICK_WIN', 'FEW_HOURS', 'BIG_PROJECT');

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "effort" "Effort",
ADD COLUMN     "nextStep" TEXT,
ADD COLUMN     "priority" "Priority";
