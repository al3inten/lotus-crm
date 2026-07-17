-- Performance indexes.
--
-- 1) The leads & customers lists group/paginate enquiries by leadId and order by
--    createdAt; the reports Chart Builder groups by source / enquiryCategory. Without
--    these, Postgres sequential-scans the whole enquiries table on every such query.
CREATE INDEX IF NOT EXISTS "enquiries_leadId_createdAt_idx" ON "enquiries"("leadId", "createdAt");
CREATE INDEX IF NOT EXISTS "enquiries_source_idx" ON "enquiries"("source");
CREATE INDEX IF NOT EXISTS "enquiries_enquiryCategory_idx" ON "enquiries"("enquiryCategory");

-- 2) Lead search filters on name ILIKE '%term%' and phoneNormalized LIKE '%term%'.
--    A B-tree index can't serve a leading-wildcard match, so these were full scans.
--    A pg_trgm GIN index makes substring search index-backed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "leads_name_trgm_idx" ON "leads" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "leads_phoneNormalized_trgm_idx" ON "leads" USING gin ("phoneNormalized" gin_trgm_ops);
