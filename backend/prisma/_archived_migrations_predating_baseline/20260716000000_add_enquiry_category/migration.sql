-- Backfills migration history: this column/enum existed on the pre-existing
-- production database (added out-of-band, never captured in a migration) but
-- is required by schema.prisma and indexed by 20260717000000_add_perf_indexes.
-- Guarded with IF NOT EXISTS / DO blocks so it is a no-op on databases that
-- already have it, and creates it correctly on fresh databases.
DO $$ BEGIN
    CREATE TYPE "EnquiryCategory" AS ENUM ('HOT', 'WARM', 'COLD');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "enquiryCategory" "EnquiryCategory";
