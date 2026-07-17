-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CR_TEAM', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WALK_IN', 'MANUAL_OTHER', 'META_ADS', 'WHATSAPP', 'INSTAGRAM', 'GOOGLE_SHEETS', 'REFERRAL');

-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('NEW_CAR', 'USED_CAR', 'SERVICE_RELATED', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'APPOINTMENT_SCHEDULED', 'APPOINTMENT_NO_SHOW', 'TEST_DRIVE_DONE', 'FEEDBACK_COLLECTED', 'QUOTATION_SHARED', 'NEGOTIATION', 'BOOKING_CONFIRMED', 'FINANCE_IN_PROGRESS', 'EXCHANGE_IN_PROGRESS', 'SALE_CLOSED', 'DELIVERY_IN_PROGRESS', 'DELIVERED', 'LOST');

-- CreateEnum
CREATE TYPE "LossReason" AS ENUM ('PRICE_TOO_HIGH', 'BOUGHT_COMPETITOR', 'BOUGHT_ANOTHER_BRANCH', 'NOT_INTERESTED_ANYMORE', 'FINANCE_REJECTED', 'NO_RESPONSE', 'OTHER');

-- CreateEnum
CREATE TYPE "FinanceStatus" AS ENUM ('NOT_STARTED', 'DOCS_PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "autoAssignEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailableForRouting" BOOLEAN NOT NULL DEFAULT true,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
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
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "followUpDueAt" TIMESTAMP(3),
    "lossReason" "LossReason",
    "lossNote" TEXT,
    "assignedCrId" TEXT,
    "consultantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "reassignment_logs" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT NOT NULL,
    "reassignedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reassignment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_drive_feedback" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "conductedById" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
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

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_role_idx" ON "users"("branchId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "leads_phoneNormalized_key" ON "leads"("phoneNormalized");

-- CreateIndex
CREATE INDEX "leads_phoneNormalized_idx" ON "leads"("phoneNormalized");

-- CreateIndex
CREATE INDEX "enquiries_branchId_status_idx" ON "enquiries"("branchId", "status");

-- CreateIndex
CREATE INDEX "enquiries_assignedCrId_idx" ON "enquiries"("assignedCrId");

-- CreateIndex
CREATE INDEX "enquiries_createdAt_idx" ON "enquiries"("createdAt");

-- CreateIndex
CREATE INDEX "enquiry_status_history_enquiryId_createdAt_idx" ON "enquiry_status_history"("enquiryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "test_drive_feedback_enquiryId_key" ON "test_drive_feedback"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_enquiryId_key" ON "quotations"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_evaluations_enquiryId_key" ON "exchange_evaluations"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_applications_enquiryId_key" ON "finance_applications"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_details_enquiryId_key" ON "delivery_details"("enquiryId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assignedCrId_fkey" FOREIGN KEY ("assignedCrId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_status_history" ADD CONSTRAINT "enquiry_status_history_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_status_history" ADD CONSTRAINT "enquiry_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassignment_logs" ADD CONSTRAINT "reassignment_logs_reassignedById_fkey" FOREIGN KEY ("reassignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_feedback" ADD CONSTRAINT "test_drive_feedback_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_feedback" ADD CONSTRAINT "test_drive_feedback_conductedById_fkey" FOREIGN KEY ("conductedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
CREATE TYPE "LeadSubsource" AS ENUM ('WALK_IN', 'HMIL_WEBSITE', 'HMIL_SOCIAL_MEDIA', 'HMIL_CHATBOT', 'SOCIAL_MEDIA', 'HYPERLOCAL', 'CARPORTAL', 'CRM', 'REFERRAL', 'INCOMING_CALL', 'DEALER_ACTIVITY', 'SC_OWN_SOURCE', 'HMIL_EVENT');
