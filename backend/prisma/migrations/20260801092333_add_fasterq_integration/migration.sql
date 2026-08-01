-- CreateEnum
CREATE TYPE "CallTranscriptStatus" AS ENUM ('NONE', 'PENDING', 'DONE', 'FAILED');

-- AlterEnum
ALTER TYPE "IntegrationKey" ADD VALUE 'FASTERQ';

-- AlterTable
ALTER TABLE "call_logs" ADD COLUMN     "recordingExpiresAt" TIMESTAMP(3),
ADD COLUMN     "transcriptStatus" "CallTranscriptStatus" NOT NULL DEFAULT 'NONE';

