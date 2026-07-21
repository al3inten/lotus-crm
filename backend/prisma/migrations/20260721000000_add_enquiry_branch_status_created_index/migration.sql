-- listEnquiries/buildWhere in leads.service.ts filters enquiries by branchId + status +
-- createdAt together. The existing @@index([branchId, status]) and @@index([createdAt])
-- indexes can each serve part of that filter but not all three at once efficiently; this
-- composite index lets Postgres satisfy the combined filter with a single index scan.
CREATE INDEX IF NOT EXISTS "enquiries_branchId_status_createdAt_idx" ON "enquiries"("branchId", "status", "createdAt");
