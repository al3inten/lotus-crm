-- Rename LossReason enum value OTHER_REASON -> LOST_TO_COMPETITOR (label/meaning is
-- now specifically "lost to a competitor brand" rather than a generic catch-all).
ALTER TYPE "LossReason" RENAME VALUE 'OTHER_REASON' TO 'LOST_TO_COMPETITOR';
