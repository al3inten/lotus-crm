-- DropIndex
DROP INDEX "test_drive_feedback_enquiryId_key";

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

-- CreateIndex
CREATE INDEX "lead_touches_leadId_createdAt_idx" ON "lead_touches"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "test_drive_feedback_enquiryId_createdAt_idx" ON "test_drive_feedback"("enquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "lead_touches" ADD CONSTRAINT "lead_touches_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
