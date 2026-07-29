-- Part B + Part C: additive migration.
-- Reference SQL only — NOT auto-generated, NOT executed in this environment (no
-- reachable dev DB). A human must run this by hand against a real database.
--
-- Run this SECOND (after 001_part_a_drop_departments.sql), and BEFORE running
-- backend/scripts/backfill-roles-and-consultants.ts. This migration is purely
-- additive — it does not touch the old Role enum, RoleDefinition.baseRole, the
-- old string[] permissions shape, or the old enquiries.consultant_id -> users FK.
-- Those are all removed/repointed later in 003, once the backfill script has run.

BEGIN;

-- --- Part B: new RoleDefinition columns -------------------------------------------------
ALTER TABLE role_definitions
  ADD COLUMN IF NOT EXISTS "canViewAllBranches" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "restrictLeadsToOwn" BOOLEAN NOT NULL DEFAULT false;

-- role_definitions.permissions stays as-is (jsonb) at this stage — its old shape
-- (string[] of enabled module keys) is converted to the new { [key]: level } shape
-- in-place by the backfill script's raw UPDATE, not by this migration.

-- --- Part C: per-user isCr flag ----------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "isCr" BOOLEAN NOT NULL DEFAULT false;

-- --- Part C: new ConsultantDirectory table ------------------------------------------------
CREATE TABLE IF NOT EXISTS consultant_directory (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  mobile      TEXT NOT NULL,
  "branchId"  TEXT NOT NULL REFERENCES branches(id),
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS consultant_directory_branch_id_idx ON consultant_directory("branchId");

-- --- Part C: loosen the consultant FK on enquiries ----------------------------------------
-- enquiries.consultant_id currently has an FK to users(id). We drop that FK constraint
-- (but keep the column and its data) so the backfill script's UPDATE can repoint each
-- row's consultant_id at a consultant_directory.id without violating the old constraint
-- mid-migration. 003 below adds the correct FK to consultant_directory once every row
-- has been repointed. The exact FK constraint name may differ per-environment — check
-- `\d enquiries` and adjust the constraint name before running.
ALTER TABLE enquiries
  DROP CONSTRAINT IF EXISTS "enquiries_consultantId_fkey";

COMMIT;
