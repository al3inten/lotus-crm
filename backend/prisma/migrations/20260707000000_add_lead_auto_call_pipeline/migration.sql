-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('ANSWERED', 'NO_ANSWER', 'BUSY');

-- CreateEnum
CREATE TYPE "EnquiryResponse" AS ENUM ('INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "NextAction" AS ENUM ('RETRY_CALL', 'SCHEDULE_CALLBACK', 'SCHEDULE_FOLLOW_UP', 'ASSIGN_TO_CR', 'MARK_LOST');

-- AlterTable
ALTER TABLE "enquiries" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "callTriggered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "callOutcome" "CallOutcome",
ADD COLUMN     "response" "EnquiryResponse",
ADD COLUMN     "nextAction" "NextAction";
