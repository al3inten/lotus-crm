-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WALK_IN', 'MANUAL_OTHER', 'META_ADS', 'WHATSAPP', 'INSTAGRAM', 'GOOGLE_SHEETS', 'REFERRAL', 'VOICE_AGENT');

-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('NEW_CAR', 'USED_CAR', 'SERVICE_RELATED', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'UNDER_FOLLOW_UP', 'APPOINTMENT_FIXED', 'TEST_DRIVE', 'BOOKED', 'RETAIL_DONE', 'RTO_DONE', 'DELIVERED', 'CLOSED', 'CLOSED_TEMP', 'LOST');

-- CreateEnum
CREATE TYPE "LossReason" AS ENUM ('LOST_TO_DEALER', 'BOOKING_CANCEL', 'RETAIL_CANCEL', 'OUT_OF_TERRITORY', 'NOT_CONTACTABLE', 'PRICE_ISSUE', 'PURCHASED_ANOTHER_BRAND', 'OTHER_REASON');

-- CreateEnum
CREATE TYPE "CloseReason" AS ENUM ('OUT_OF_TERRITORY', 'RNR', 'PLAN_DROP', 'NOT_INTERESTED', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('CALL', 'WHATSAPP', 'VISIT', 'EMAIL');

-- CreateEnum
CREATE TYPE "FinanceStatus" AS ENUM ('NOT_STARTED', 'DOCS_PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('SALES', 'SERVICE', 'USED_CAR', 'ACCESSORIES', 'HR', 'OTHER_TERRITORY', 'OTHERS');

-- CreateEnum
CREATE TYPE "LeadSubsource" AS ENUM ('WALK_IN', 'HMIL_WEBSITE', 'HMIL_SOCIAL_MEDIA', 'HMIL_CHATBOT', 'SOCIAL_MEDIA', 'HYPERLOCAL', 'CARPORTAL', 'CTB', 'CRM', 'REFERRAL', 'CUSTOMER_REFERRAL', 'EMPLOYEE_REFERRAL', 'INCOMING_CALL', 'DEALER_ACTIVITY', 'SC_OWN_SOURCE', 'HMIL_EVENT', 'EXCHANGE_CAMP');

-- CreateEnum
CREATE TYPE "SourceCategory" AS ENUM ('WALK_IN', 'DIGITAL', 'DIGITAL_WALK_IN', 'REFERRAL', 'FIELD_ACTIVITY', 'TELE_IN');

-- CreateEnum
CREATE TYPE "EnquiryCategory" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'CNG_PETROL', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "IntegrationKey" AS ENUM ('META_APP', 'META_ADS', 'WHATSAPP', 'INSTAGRAM', 'GOOGLE_SHEETS', 'LIVEKIT', 'TELECMI', 'GEMINI', 'OPENAI', 'CLOUDINARY', 'CALLMATIC');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SocialChannel" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'VOICE');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('VOICE', 'WHATSAPP_CHATBOT', 'INSTAGRAM_CHATBOT');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('QUEUED', 'DIALING', 'IN_PROGRESS', 'COMPLETED', 'NO_ANSWER', 'FAILED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('ANSWERED', 'NO_ANSWER', 'BUSY');

-- CreateEnum
CREATE TYPE "EnquiryResponse" AS ENUM ('INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "NextAction" AS ENUM ('RETRY_CALL', 'SCHEDULE_CALLBACK', 'SCHEDULE_FOLLOW_UP', 'ASSIGN_TO_CR', 'MARK_LOST');

-- CreateEnum
CREATE TYPE "DateFieldKey" AS ENUM ('APPOINTMENT_AT', 'TEST_DRIVE_SCHEDULED_AT', 'BOOKED_AT', 'RETAIL_DONE_AT');

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_variants" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transmissionType" "TransmissionType" NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "autoAssignEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoCallEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT,
    "permissions" JSONB NOT NULL,
    "canViewAllBranches" BOOLEAN NOT NULL DEFAULT false,
    "restrictLeadsToOwn" BOOLEAN NOT NULL DEFAULT false,
    "canReassignCustomerCr" BOOLEAN NOT NULL DEFAULT false,
    "canViewBranchLeads" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_directory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultant_directory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "roleDefinitionId" TEXT,
    "branchId" TEXT,
    "isCr" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailableForRouting" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "avatarPublicId" TEXT,
    "lastActiveAt" TIMESTAMP(3),
    "onBreak" BOOLEAN NOT NULL DEFAULT false,
    "breakStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneRaw" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "email" TEXT,
    "alternateMobile" TEXT,
    "dob" TIMESTAMP(3),
    "profession" TEXT,
    "pincode" TEXT,
    "area" TEXT,
    "address" TEXT,
    "primaryCrId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_touches" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "source" "LeadSource" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_touches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "enquiryType" "EnquiryType" NOT NULL,
    "location" TEXT,
    "department" "Department",
    "subsource" "LeadSubsource",
    "sourceCategory" "SourceCategory",
    "referrerName" TEXT,
    "referrerPhone" TEXT,
    "variant" TEXT,
    "enquiryCategory" "EnquiryCategory",
    "financeRequired" BOOLEAN,
    "financeRemarks" TEXT,
    "appointmentScheduled" BOOLEAN NOT NULL DEFAULT false,
    "appointmentAt" TIMESTAMP(3),
    "testDriveInterested" BOOLEAN NOT NULL DEFAULT false,
    "testDriveCount" INTEGER,
    "exchangeCarModel" TEXT,
    "exchangeCarYear" INTEGER,
    "exchangeCarKms" INTEGER,
    "exchangeCarOwners" INTEGER,
    "exchangeCarRegNumber" TEXT,
    "calledDate" TIMESTAMP(3),
    "remarks" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "followUpDueAt" TIMESTAMP(3),
    "lossReason" "LossReason",
    "lossNote" TEXT,
    "closeReason" "CloseReason",
    "closeNote" TEXT,
    "financeDocumentCollected" BOOLEAN,
    "financeLoanApproved" BOOLEAN,
    "financeDoReceived" BOOLEAN,
    "bookedAt" TIMESTAMP(3),
    "retailDoneAt" TIMESTAMP(3),
    "rtoDoneAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "colour" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "callTriggered" BOOLEAN NOT NULL DEFAULT false,
    "callOutcome" "CallOutcome",
    "response" "EnquiryResponse",
    "nextAction" "NextAction",
    "assignedCrId" TEXT,
    "consultantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_notes" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_change_history" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "field" "DateFieldKey" NOT NULL,
    "oldValue" TIMESTAMP(3),
    "newValue" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_status_history" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "fromStatus" "EnquiryStatus",
    "toStatus" "EnquiryStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "followUpDate" DATE NOT NULL,
    "followUpTime" TEXT,
    "type" "FollowUpType" NOT NULL,
    "remark" TEXT NOT NULL,
    "nextFollowUpDate" DATE,
    "nextFollowUpTime" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reassignment_logs" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "batchId" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT NOT NULL,
    "reassignedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reassignment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_drafts" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "branchId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_drive_feedback" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "conductedById" TEXT NOT NULL,
    "carModel" TEXT,
    "variant" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "address" TEXT,
    "rating" INTEGER,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_drive_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "quotedById" TEXT NOT NULL,
    "variant" TEXT,
    "onRoadPrice" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2),
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_evaluations" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "oldCarMake" TEXT NOT NULL,
    "oldCarModel" TEXT NOT NULL,
    "oldCarYear" INTEGER NOT NULL,
    "oldCarKms" INTEGER NOT NULL,
    "oldCarCondition" TEXT,
    "valuationAmount" DECIMAL(12,2) NOT NULL,
    "evaluatedById" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_applications" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "bankOrNbfc" TEXT NOT NULL,
    "loanAmount" DECIMAL(12,2),
    "status" "FinanceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "docsChecklist" JSONB,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_details" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "rcTransferDone" BOOLEAN NOT NULL DEFAULT false,
    "insuranceDone" BOOLEAN NOT NULL DEFAULT false,
    "accessoriesFitted" BOOLEAN NOT NULL DEFAULT false,
    "deliveryDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "key" "IntegrationKey" NOT NULL,
    "encryptedCredentials" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastError" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_ads_pages" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "leadFormCount" INTEGER NOT NULL DEFAULT 0,
    "webhookSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_ads_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "channel" "SocialChannel" NOT NULL,
    "externalContactId" TEXT NOT NULL,
    "contactName" TEXT,
    "leadId" TEXT,
    "isIgnored" BOOLEAN NOT NULL DEFAULT false,
    "convertedById" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "body" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "externalMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "voiceName" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash-live-001',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "autoCallEnabled" BOOLEAN NOT NULL DEFAULT false,
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
    "transcript" TEXT,
    "insights" JSONB,
    "externalCallId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_call_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentConfigId" TEXT NOT NULL,
    "branchId" TEXT,
    "callmaticCampaignId" TEXT,
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
    "externalCallId" TEXT,
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

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_dismissals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "quotationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_offices" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_offices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_name_key" ON "vehicle_models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_variants_modelId_name_fuelType_key" ON "vehicle_variants"("modelId", "name", "fuelType");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_definitions_branchId_name_key" ON "role_definitions"("branchId", "name");

-- CreateIndex
CREATE INDEX "consultant_directory_branchId_idx" ON "consultant_directory"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_role_idx" ON "users"("branchId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "leads_phoneNormalized_key" ON "leads"("phoneNormalized");

-- CreateIndex
CREATE INDEX "leads_phoneNormalized_idx" ON "leads"("phoneNormalized");

-- CreateIndex
CREATE INDEX "leads_primaryCrId_idx" ON "leads"("primaryCrId");

-- CreateIndex
CREATE INDEX "lead_touches_leadId_createdAt_idx" ON "lead_touches"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "enquiries_branchId_status_idx" ON "enquiries"("branchId", "status");

-- CreateIndex
CREATE INDEX "enquiries_assignedCrId_idx" ON "enquiries"("assignedCrId");

-- CreateIndex
CREATE INDEX "enquiries_createdAt_idx" ON "enquiries"("createdAt");

-- CreateIndex
CREATE INDEX "enquiries_branchId_status_createdAt_idx" ON "enquiries"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "enquiries_leadId_createdAt_idx" ON "enquiries"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "enquiries_source_idx" ON "enquiries"("source");

-- CreateIndex
CREATE INDEX "enquiries_enquiryCategory_idx" ON "enquiries"("enquiryCategory");

-- CreateIndex
CREATE INDEX "enquiries_sourceCategory_idx" ON "enquiries"("sourceCategory");

-- CreateIndex
CREATE INDEX "enquiry_notes_enquiryId_authorId_createdAt_idx" ON "enquiry_notes"("enquiryId", "authorId", "createdAt");

-- CreateIndex
CREATE INDEX "date_change_history_enquiryId_createdAt_idx" ON "date_change_history"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "enquiry_status_history_enquiryId_createdAt_idx" ON "enquiry_status_history"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "follow_ups_enquiryId_followUpDate_idx" ON "follow_ups"("enquiryId", "followUpDate");

-- CreateIndex
CREATE INDEX "lead_drafts_createdById_idx" ON "lead_drafts"("createdById");

-- CreateIndex
CREATE INDEX "test_drive_feedback_enquiryId_createdAt_idx" ON "test_drive_feedback"("enquiryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_enquiryId_key" ON "quotations"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_evaluations_enquiryId_key" ON "exchange_evaluations"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_applications_enquiryId_key" ON "finance_applications"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_details_enquiryId_key" ON "delivery_details"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_key_key" ON "integration_configs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "meta_ads_pages_pageId_key" ON "meta_ads_pages"("pageId");

-- CreateIndex
CREATE INDEX "conversations_leadId_idx" ON "conversations"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_channel_externalContactId_key" ON "conversations"("channel", "externalContactId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_type_key" ON "agent_configs"("type");

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_externalCallId_key" ON "call_logs"("externalCallId");

-- CreateIndex
CREATE INDEX "call_logs_conversationId_createdAt_idx" ON "call_logs"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_call_tasks_externalCallId_key" ON "outbound_call_tasks"("externalCallId");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_call_tasks_callLogId_key" ON "outbound_call_tasks"("callLogId");

-- CreateIndex
CREATE INDEX "outbound_call_tasks_campaignId_status_idx" ON "outbound_call_tasks"("campaignId", "status");

-- CreateIndex
CREATE INDEX "comments_enquiryId_idx" ON "comments"("enquiryId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "reminder_dismissals_userId_idx" ON "reminder_dismissals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_dismissals_userId_reminderId_key" ON "reminder_dismissals"("userId", "reminderId");

-- CreateIndex
CREATE INDEX "post_offices_pincode_idx" ON "post_offices"("pincode");

-- CreateIndex
CREATE INDEX "post_offices_name_idx" ON "post_offices"("name");

-- CreateIndex
CREATE INDEX "post_offices_city_idx" ON "post_offices"("city");

-- CreateIndex
CREATE UNIQUE INDEX "post_offices_pincode_name_key" ON "post_offices"("pincode", "name");

-- AddForeignKey
ALTER TABLE "vehicle_variants" ADD CONSTRAINT "vehicle_variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_definitions" ADD CONSTRAINT "role_definitions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_directory" ADD CONSTRAINT "consultant_directory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleDefinitionId_fkey" FOREIGN KEY ("roleDefinitionId") REFERENCES "role_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_primaryCrId_fkey" FOREIGN KEY ("primaryCrId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_touches" ADD CONSTRAINT "lead_touches_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assignedCrId_fkey" FOREIGN KEY ("assignedCrId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultant_directory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_change_history" ADD CONSTRAINT "date_change_history_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_change_history" ADD CONSTRAINT "date_change_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_status_history" ADD CONSTRAINT "enquiry_status_history_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_status_history" ADD CONSTRAINT "enquiry_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_reassignedById_fkey" FOREIGN KEY ("reassignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_drafts" ADD CONSTRAINT "lead_drafts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_drafts" ADD CONSTRAINT "lead_drafts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_feedback" ADD CONSTRAINT "test_drive_feedback_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_feedback" ADD CONSTRAINT "test_drive_feedback_conductedById_fkey" FOREIGN KEY ("conductedById") REFERENCES "consultant_directory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_quotedById_fkey" FOREIGN KEY ("quotedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_evaluations" ADD CONSTRAINT "exchange_evaluations_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_evaluations" ADD CONSTRAINT "exchange_evaluations_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_applications" ADD CONSTRAINT "finance_applications_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_details" ADD CONSTRAINT "delivery_details_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_configs" ADD CONSTRAINT "integration_configs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_convertedById_fkey" FOREIGN KEY ("convertedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_dismissals" ADD CONSTRAINT "reminder_dismissals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
