-- Part B + Part C: final narrowing migration.
-- Reference SQL only — NOT auto-generated, NOT executed in this environment (no
-- reachable dev DB). A human must run this by hand against a real database.
--
-- Run this THIRD and LAST, only after:
--   1. 001_part_a_drop_departments.sql has run,
--   2. 002_part_b_c_additive.sql has run,
--   3. backend/scripts/backfill-roles-and-consultants.ts has been dry-run against a
--      copy of production data and then run for real against the target database,
--   4. someone has reviewed every "REVIEW:" line the backfill script printed
--      (synthetic roles it guessed permissions for).
--
-- This is the point of no return: CONSULTANT login accounts are gone after this
-- (deactivated, not deleted, by the backfill script — but the Role enum value
-- itself disappears here, so nothing could log in as one again regardless).
--
-- Postgres can't remove enum values in place, so the Role enum is narrowed via a
-- new-type-and-swap rather than an ALTER TYPE ... DROP VALUE (which doesn't exist).

BEGIN;

-- --- 1. Narrow the Role enum to SUPER_ADMIN | STAFF ---------------------------------------
-- Precondition: every users.role value is already SUPER_ADMIN or STAFF at this point
-- (the backfill script converted every ADMIN/BRANCH_MANAGER/CR_TEAM row to STAFF, and
-- every CONSULTANT row was deactivated but MUST also be flipped to STAFF here first,
-- since the new enum has no CONSULTANT value to hold onto even for inactive rows):
UPDATE users SET role = 'STAFF' WHERE role NOT IN ('SUPER_ADMIN');

CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'STAFF');

ALTER TABLE users
  ALTER COLUMN role TYPE "Role_new"
  USING (role::text::"Role_new");

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- --- 2. Drop RoleDefinition.baseRole -------------------------------------------------------
ALTER TABLE role_definitions DROP COLUMN IF EXISTS "baseRole";

-- (If the old schema had its own enum type backing baseRole, e.g. "BaseRole", drop it
-- too once nothing references it — check `\dT` before running.)
-- DROP TYPE IF EXISTS "BaseRole";

-- --- 3. Repoint enquiries.consultant_id FK: users -> consultant_directory ------------------
-- By this point every enquiries.consultant_id value has already been rewritten by the
-- backfill script's UPDATE (step 4 of backfill-roles-and-consultants.ts) to point at
-- consultant_directory.id instead of users.id. This just adds back the FK constraint
-- the additive migration (002) dropped, now pointing at the correct table.
ALTER TABLE enquiries
  ADD CONSTRAINT "enquiries_consultantId_fkey"
  FOREIGN KEY ("consultantId") REFERENCES consultant_directory(id)
  ON DELETE SET NULL;

-- --- 4. Repoint test_drive_feedback.conductedById FK: users -> consultant_directory --------
-- Deviation from the plan's literal file list: consultants no longer have login User
-- accounts, so "who conducted this test drive" (test_drive_feedback.conductedById) can
-- only ever be a consultant_directory entry going forward too — see
-- backend/prisma/schema.prisma TestDriveFeedback.conductedBy. The backfill script's
-- consultant-conversion step (step 4) already repoints every conductedById value that
-- pointed at a since-converted consultant user, using raw SQL (the old FK still pointed
-- at users at that point in the sequence). This just swaps the constraint itself now
-- that the data is consistent.
ALTER TABLE test_drive_feedback
  DROP CONSTRAINT IF EXISTS "test_drive_feedback_conductedById_fkey";
ALTER TABLE test_drive_feedback
  ADD CONSTRAINT "test_drive_feedback_conductedById_fkey"
  FOREIGN KEY ("conductedById") REFERENCES consultant_directory(id);

COMMIT;
