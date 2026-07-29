-- Part A: remove Departments entirely.
-- Reference SQL only — NOT auto-generated, NOT executed in this environment (no
-- reachable dev DB). A human must run this by hand (or fold it into a proper
-- `prisma migrate dev`/`migrate deploy` migration) against a real database.
--
-- Run this FIRST, before 002 and 003 below — Departments removal is independent
-- of the Roles/Consultants rework and carries no data worth preserving (it was
-- confirmed to have zero effect on authorization).

BEGIN;

-- Drop the FK column on users before dropping the table it points at.
ALTER TABLE users DROP COLUMN IF EXISTS "staffDepartmentId";

DROP TABLE IF EXISTS staff_departments;

COMMIT;
