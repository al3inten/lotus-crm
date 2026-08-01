-- AlterEnum
ALTER TYPE "LeadSubsource" ADD VALUE 'CTB';

-- CreateEnum
CREATE TYPE "SourceCategory" AS ENUM ('WALK_IN', 'DIGITAL', 'DIGITAL_WALK_IN', 'REFERRAL', 'FIELD_ACTIVITY', 'TELE_IN');

-- AlterTable
ALTER TABLE "enquiries" ADD COLUMN     "sourceCategory" "SourceCategory";
