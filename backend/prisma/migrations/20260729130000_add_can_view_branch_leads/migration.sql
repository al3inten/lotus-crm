-- Only meaningful when restrictLeadsToOwn is true: lets the CR view (not edit/change-status
-- on) leads assigned to other CRs in their own branch, instead of only their own.
ALTER TABLE "role_definitions" ADD COLUMN "canViewBranchLeads" BOOLEAN NOT NULL DEFAULT false;
