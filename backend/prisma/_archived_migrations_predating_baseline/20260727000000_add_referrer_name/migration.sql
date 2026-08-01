-- Referrer's name for REFERRAL-sourced leads, captured at intake and shown on the
-- lead's hero header and the Referral Leads report.
ALTER TABLE "enquiries" ADD COLUMN "referrerName" TEXT;

CREATE INDEX "enquiries_sourceCategory_idx" ON "enquiries"("sourceCategory");
