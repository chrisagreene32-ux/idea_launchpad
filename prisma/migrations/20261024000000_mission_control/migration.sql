-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'WAITING', 'PARKED', 'DONE');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('CHAT', 'CODE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'HANDED_OFF', 'DONE');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "holder" TEXT NOT NULL DEFAULT 'Chris',
    "batonSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "nextAction" TEXT,
    "blockedOn" TEXT,
    "notes" TEXT,
    "repoUrl" TEXT,
    "claudeProjectUrl" TEXT,
    "ideaId" TEXT,
    "nextSeq" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "kind" "SessionKind" NOT NULL DEFAULT 'CHAT',
    "driver" TEXT NOT NULL DEFAULT 'Chris',
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "url" TEXT,
    "branch" TEXT,
    "handoff" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE INDEX "Session_projectId_seq_idx" ON "Session"("projectId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "Session_projectId_seq_key" ON "Session"("projectId", "seq");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
