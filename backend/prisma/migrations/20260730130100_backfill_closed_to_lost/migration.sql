-- Existing "Closed" enquiries always carried a lossReason (loss, not a temporary park),
-- so they map to the new LOST status. Their status-history rows follow the same rule.
UPDATE "enquiries" SET "status" = 'LOST' WHERE "status" = 'CLOSED';
UPDATE "enquiry_status_history" SET "toStatus" = 'LOST' WHERE "toStatus" = 'CLOSED';
UPDATE "enquiry_status_history" SET "fromStatus" = 'LOST' WHERE "fromStatus" = 'CLOSED';
