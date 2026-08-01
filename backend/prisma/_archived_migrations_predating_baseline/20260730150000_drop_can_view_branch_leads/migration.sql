-- Superseded by the "always viewable, only editing is restricted" model — viewing an
-- enquiry is never gated by restrictLeadsToOwn, so this per-role toggle is unused.
ALTER TABLE "role_definitions" DROP COLUMN "canViewBranchLeads";
