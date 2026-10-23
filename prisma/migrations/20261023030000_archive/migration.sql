-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('SHIPPED', 'PARKED', 'ABANDONED');

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "outcome" "Outcome";
