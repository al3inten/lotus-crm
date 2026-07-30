-- Split the old single "Closed" outcome into two distinct terminal statuses:
-- CLOSED_TEMP ("Closed Temporarily", parked - not a real loss) and LOST (permanent loss).
-- CLOSED is kept in the enum (existing rows still reference it) but is no longer written.
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'CLOSED_TEMP';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'LOST';

-- CreateEnum
CREATE TYPE "CloseReason" AS ENUM ('OUT_OF_TERRITORY', 'RNR', 'PLAN_DROP', 'NOT_INTERESTED', 'OTHER');

-- AlterTable
ALTER TABLE "enquiries" ADD COLUMN "closeReason" "CloseReason";
ALTER TABLE "enquiries" ADD COLUMN "closeNote" TEXT;
