-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('VOICE', 'WHATSAPP_CHATBOT', 'INSTAGRAM_CHATBOT');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('QUEUED', 'DIALING', 'IN_PROGRESS', 'COMPLETED', 'NO_ANSWER', 'FAILED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntegrationKey" ADD VALUE 'LIVEKIT';
ALTER TYPE "IntegrationKey" ADD VALUE 'TELECMI';
ALTER TYPE "IntegrationKey" ADD VALUE 'GEMINI';
ALTER TYPE "IntegrationKey" ADD VALUE 'OPENAI';
ALTER TYPE "IntegrationKey" ADD VALUE 'CLOUDINARY';

-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'VOICE_AGENT';

-- AlterEnum
ALTER TYPE "SocialChannel" ADD VALUE 'VOICE';

-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "voiceName" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash-live-001',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "carModel" TEXT,
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "SocialChannel" NOT NULL,
    "category" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "mediaAssetId" TEXT,
    "metaTemplateName" TEXT,
    "metaApprovalStatus" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "recordingUrl" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_call_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentConfigId" TEXT NOT NULL,
    "branchId" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_call_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_call_tasks" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "callLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_call_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "segmentFilters" JSONB NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_type_key" ON "agent_configs"("type");

-- CreateIndex
CREATE INDEX "call_logs_conversationId_createdAt_idx" ON "call_logs"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_call_tasks_callLogId_key" ON "outbound_call_tasks"("callLogId");

-- CreateIndex
CREATE INDEX "outbound_call_tasks_campaignId_status_idx" ON "outbound_call_tasks"("campaignId", "status");

-- AddForeignKey
ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_call_campaigns" ADD CONSTRAINT "outbound_call_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_call_tasks" ADD CONSTRAINT "outbound_call_tasks_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "outbound_call_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_call_tasks" ADD CONSTRAINT "outbound_call_tasks_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_call_tasks" ADD CONSTRAINT "outbound_call_tasks_callLogId_fkey" FOREIGN KEY ("callLogId") REFERENCES "call_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_campaigns" ADD CONSTRAINT "message_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_campaigns" ADD CONSTRAINT "message_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
