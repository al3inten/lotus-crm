-- Customer-level CR ownership: one CR owns all of a customer's enquiries.

ALTER TABLE "role_definitions" ADD COLUMN "canReassignCustomerCr" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "leads" ADD COLUMN "primaryCrId" TEXT;
ALTER TABLE "leads" ADD CONSTRAINT "leads_primaryCrId_fkey" FOREIGN KEY ("primaryCrId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "leads_primaryCrId_idx" ON "leads"("primaryCrId");

ALTER TABLE "reassignment_logs" ADD COLUMN "batchId" TEXT;
