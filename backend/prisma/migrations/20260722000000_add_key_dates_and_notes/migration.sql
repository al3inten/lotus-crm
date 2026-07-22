-- Enum for the editable key-date fields.
CREATE TYPE "DateFieldKey" AS ENUM ('APPOINTMENT_AT', 'TEST_DRIVE_SCHEDULED_AT', 'BOOKED_AT', 'RETAIL_DONE_AT');

-- Audit trail for key-date edits.
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
CREATE INDEX "date_change_history_enquiryId_createdAt_idx" ON "date_change_history"("enquiryId", "createdAt");
ALTER TABLE "date_change_history" ADD CONSTRAINT "date_change_history_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "date_change_history" ADD CONSTRAINT "date_change_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Private per-author notes.
CREATE TABLE "enquiry_notes" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enquiry_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "enquiry_notes_enquiryId_authorId_createdAt_idx" ON "enquiry_notes"("enquiryId", "authorId", "createdAt");
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
