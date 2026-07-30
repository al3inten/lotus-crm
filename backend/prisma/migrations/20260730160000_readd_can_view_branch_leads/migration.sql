-- Re-adds the per-role "view other CRs' leads in branch" toggle that
-- 20260730150000_drop_can_view_branch_leads removed — kept as an explicit, admin-controlled
-- setting layered on top of the "always viewable, only editing restricted" base model,
-- rather than making it unconditional for every restrictLeadsToOwn role.
ALTER TABLE "role_definitions" ADD COLUMN "canViewBranchLeads" BOOLEAN NOT NULL DEFAULT false;
